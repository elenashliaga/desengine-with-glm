import { readFile } from "node:fs/promises"
import path from "node:path"

import ts from "typescript"

import { appConfig } from "@/lib/server"

type Params = { taskId: string }

export const dynamic = "force-dynamic"
export const revalidate = 0

function transpile(code: string, fileName: string) {
  const res = ts.transpileModule(code, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2017,
      module: ts.ModuleKind.CommonJS,
      // Важно: используем классический runtime, чтобы не было import 'react/jsx-runtime'
      jsx: ts.JsxEmit.React,
      esModuleInterop: false,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
  })
  return res.outputText
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function createServerRequire() {
  return (specifier: string) => {
    if (specifier.endsWith(".css")) return {}
    if (specifier === "./props") return {}
    throw new Error(`Неподдерживаемая зависимость в mock/styles: ${specifier}`)
  }
}

function executeCommonJsModule(js: string) {
  const exportsObj: Record<string, unknown> = {}
  const moduleObj: { exports: Record<string, unknown> | unknown } = { exports: exportsObj }
  const fn = new Function("module", "exports", "require", js)
  fn(moduleObj, exportsObj, createServerRequire())
  return moduleObj.exports
}

function extractExpectedPropNames(componentRaw: string): string[] {
  const match = componentRaw.match(/\(\{\s*([^}]*)\}\s*(?::[^)]*)?\)\s*=>/)
  if (!match) return []

  return match[1]
    .split(",")
    .map((part) => part.trim())
    .map((part) => part.replace(/=[\s\S]*$/, "").trim())
    .map((part) => part.replace(/\?.*$/, "").trim())
    .map((part) => part.replace(/:.*$/, "").trim())
    .filter(Boolean)
}

function pickPropsFromMock(
  mockJs: string,
  expectedPropNames: string[],
): Record<string, unknown> {
  let exportsValue: unknown

  try {
    exportsValue = executeCommonJsModule(mockJs)
  } catch {
    return {}
  }

  if (!isPlainObject(exportsValue)) return {}

  const explicit = exportsValue.mockProps ?? exportsValue.mock
  if (isPlainObject(explicit)) return explicit

  const entries = Object.entries(exportsValue).filter(([key]) => key !== "__esModule")
  if (entries.length === 0) return {}

  const firstExpectedProp = expectedPropNames[0]
  if (firstExpectedProp && entries.length === 1) {
    const [, singleValue] = entries[0]

    if (Array.isArray(singleValue)) {
      const firstItem = singleValue[0]
      if (isPlainObject(firstItem) && firstExpectedProp in firstItem) {
        return firstItem
      }

      return { [firstExpectedProp]: singleValue }
    }

    if (isPlainObject(singleValue)) {
      return singleValue
    }

    return { [firstExpectedProp]: singleValue }
  }

  for (const [, value] of entries) {
    if (
      isPlainObject(value) &&
      expectedPropNames.length > 0 &&
      expectedPropNames.every((propName) => propName in value)
    ) {
      return value
    }
  }

  return {}
}

function buildClientRuntimeModule(files: {
  componentJs: string
  stylesJs: string
  mockJs: string
  propsJs: string
}) {
  return `
const __DESENGINE_MODULES__ = {
  "./Component": function(module, exports, require) {
${files.componentJs}
  },
  "./styles": function(module, exports, require) {
${files.stylesJs}
  },
  "./mock": function(module, exports, require) {
${files.mockJs}
  },
  "./props": function(module, exports, require) {
${files.propsJs}
  }
};

const __DESENGINE_CACHE__ = {};

function __desengineLoad(specifier) {
  if (specifier === "react") {
    return { ...React, default: React };
  }

  if (specifier.endsWith(".css")) {
    return {};
  }

  if (!Object.prototype.hasOwnProperty.call(__DESENGINE_MODULES__, specifier)) {
    throw new Error("Неподдерживаемая зависимость: " + specifier);
  }

  if (__DESENGINE_CACHE__[specifier]) {
    return __DESENGINE_CACHE__[specifier].exports;
  }

  const localModule = { exports: {} };
  __DESENGINE_CACHE__[specifier] = localModule;
  __DESENGINE_MODULES__[specifier](localModule, localModule.exports, __desengineLoad);
  return localModule.exports;
}

const __desengineEntry__ = __desengineLoad("./Component");
module.exports = __desengineEntry__;
`.trimStart()
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { taskId } = await params

  const baseDir = path.join(appConfig.tasksRoot, taskId)
  const componentPath = path.join(baseDir, "Component.tsx")
  const stylesPath = path.join(baseDir, "styles.ts")
  const mockPath = path.join(baseDir, "mock.ts")
  const propsPath = path.join(baseDir, "props.ts")

  const [componentRaw, stylesRaw, mockRaw, propsRaw] = await Promise.all([
    readFile(componentPath, "utf-8"),
    readFile(stylesPath, "utf-8").catch(() => "export const styles = {};"),
    readFile(mockPath, "utf-8").catch(() => "export const mock = {};"),
    readFile(propsPath, "utf-8").catch(() => "export {};"),
  ])

  const stylesJs = transpile(stylesRaw, stylesPath)
  const mockJs = transpile(mockRaw, mockPath)
  const propsJs = transpile(propsRaw, propsPath)
  const componentJs = transpile(componentRaw, componentPath)
  const props = pickPropsFromMock(mockJs, extractExpectedPropNames(componentRaw))

  const runtimeModule = buildClientRuntimeModule({
    componentJs,
    stylesJs,
    mockJs,
    propsJs,
  })

  return Response.json(
    { ok: true, module: runtimeModule, props },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate",
      },
    },
  )
}
