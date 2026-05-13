import { readFile } from "node:fs/promises"

import ts from "typescript"

import { requireAccessOrUnauthorizedResponse } from "@/lib/access/access-control.server"
import { getUserTaskFilePath } from "@/lib/platform/user-state.server"

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
const __UI_BARREL__ = (() => {
  const button = { Button: ({ children, type = "button", ...props }) => React.createElement("button", { type, ...props }, children) };
  const input = { Input: (props) => React.createElement("input", props) };
  const textarea = { Textarea: (props) => React.createElement("textarea", props) };
  const checkbox = {
    Checkbox: ({ checked, defaultChecked, ...props }) =>
      React.createElement("input", {
        type: "checkbox",
        checked,
        defaultChecked,
        ...props,
      }),
  };
  const label = { Label: ({ children, ...props }) => React.createElement("label", props, children) };
  const badge = { Badge: ({ children, ...props }) => React.createElement("span", props, children) };
  const card = {
    Card: ({ children, ...props }) => React.createElement("div", props, children),
    CardHeader: ({ children, ...props }) => React.createElement("div", props, children),
    CardTitle: ({ children, ...props }) => React.createElement("div", props, children),
    CardDescription: ({ children, ...props }) => React.createElement("div", props, children),
    CardContent: ({ children, ...props }) => React.createElement("div", props, children),
    CardFooter: ({ children, ...props }) => React.createElement("div", props, children),
  };

  return {
    ...button,
    ...input,
    ...textarea,
    ...checkbox,
    ...label,
    ...badge,
    ...card,
  };
})();

const __BUILTINS__ = {
  "@/components/shadcn/ui": (() => {
    return __UI_BARREL__;
  })(),
  "@/components/ui": (() => {
    return __UI_BARREL__;
  })(),
  "@/components/ui/": (() => {
    return __UI_BARREL__;
  })(),
  "@/components/ui/button": (() => {
    const Button = ({ children, type = "button", ...props }) => React.createElement("button", { type, ...props }, children);
    return { Button };
  })(),
  "@/components/ui/input": (() => {
    const Input = (props) => React.createElement("input", props);
    return { Input };
  })(),
  "@/components/ui/textarea": (() => {
    const Textarea = (props) => React.createElement("textarea", props);
    return { Textarea };
  })(),
  "@/components/ui/checkbox": (() => {
    const Checkbox = ({ checked, defaultChecked, ...props }) =>
      React.createElement("input", {
        type: "checkbox",
        checked,
        defaultChecked,
        ...props,
      });
    return { Checkbox };
  })(),
  "@/components/ui/label": (() => {
    const Label = ({ children, ...props }) => React.createElement("label", props, children);
    return { Label };
  })(),
  "@/components/ui/badge": (() => {
    const Badge = ({ children, ...props }) => React.createElement("span", props, children);
    return { Badge };
  })(),
  "@/components/ui/card": (() => {
    const Card = ({ children, ...props }) => React.createElement("div", props, children);
    const CardHeader = ({ children, ...props }) => React.createElement("div", props, children);
    const CardTitle = ({ children, ...props }) => React.createElement("div", props, children);
    const CardDescription = ({ children, ...props }) => React.createElement("div", props, children);
    const CardContent = ({ children, ...props }) => React.createElement("div", props, children);
    const CardFooter = ({ children, ...props }) => React.createElement("div", props, children);
    return {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
    };
  })(),
};

const __MODULES__ = {
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

const __CACHE__ = {};

function __desengineLoad(specifier) {
  if (specifier === "react") {
    return { ...React, default: React };
  }

  if (Object.prototype.hasOwnProperty.call(__BUILTINS__, specifier)) {
    return __BUILTINS__[specifier];
  }

  if (specifier.endsWith(".css")) {
    return {};
  }

  if (!Object.prototype.hasOwnProperty.call(__MODULES__, specifier)) {
    throw new Error("Неподдерживаемая зависимость: " + specifier);
  }

  if (__CACHE__[specifier]) {
    return __CACHE__[specifier].exports;
  }

  const localModule = { exports: {} };
  __CACHE__[specifier] = localModule;
  __MODULES__[specifier](localModule, localModule.exports, __desengineLoad);
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
  const unauthorizedResponse = await requireAccessOrUnauthorizedResponse()
  if (unauthorizedResponse) return unauthorizedResponse

  const { taskId } = await params

  const componentPath = getUserTaskFilePath(taskId, "Component.tsx")
  const stylesPath = getUserTaskFilePath(taskId, "styles.ts")
  const mockPath = getUserTaskFilePath(taskId, "mock.ts")
  const propsPath = getUserTaskFilePath(taskId, "props.ts")

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
