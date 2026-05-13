/**
 * Отрисовка Markdown-контента:
 * — базовый Markdown
 * — GitHub Flavoured Markdown: зачёркивание, таски, таблицы и т.п.
 * — Mermaid-диаграммы
 * 
 * Эксперименты: http://localhost:3000/playground/markdown
 */

"use client"

import { isValidElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/platform/utils"
import { MermaidDiagram } from "../MermaidDiagram"

import { type MarkdownContentProps } from "./props"
import { markdownBlockClassName, markdownElementClassNames } from "./styles"

const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

function normalizeRelativePath(rawPath: string) {
  const trimmedPath = rawPath.trim()

  if (!trimmedPath || trimmedPath.startsWith("/")) {
    return null
  }

  const normalizedSegments: string[] = []

  for (const segment of trimmedPath.split("/")) {
    if (!segment || segment === ".") continue
    if (segment === "..") return null

    normalizedSegments.push(segment)
  }

  return normalizedSegments.join("/")
}

function resolveMarkdownUrl(url: string | undefined, assetBasePath?: string) {
  if (!url) return undefined

  const trimmedUrl = url.trim()

  if (
    !trimmedUrl ||
    trimmedUrl.startsWith("#") ||
    trimmedUrl.startsWith("/") ||
    EXTERNAL_URL_PATTERN.test(trimmedUrl)
  ) {
    return trimmedUrl
  }

  if (!assetBasePath) return trimmedUrl

  const suffixIndex = trimmedUrl.search(/[?#]/)
  const rawPath = suffixIndex >= 0 ? trimmedUrl.slice(0, suffixIndex) : trimmedUrl
  const suffix = suffixIndex >= 0 ? trimmedUrl.slice(suffixIndex) : ""
  const normalizedPath = normalizeRelativePath(rawPath)

  if (!normalizedPath) return undefined

  return `${assetBasePath}/${normalizedPath}${suffix}`
}

function getCodeBlockData(children: React.ReactNode) {
  if (!isValidElement(children)) {
    return null
  }

  const props = children.props as {
    className?: string
    children?: React.ReactNode
  }

  const className = props.className ?? ""
  const match = /language-(\w+)/.exec(className)
  const language = match?.[1]

  const code = String(props.children ?? "").replace(/\n$/, "")

  return {
    language,
    code,
  }
}

function MarkdownContent({ content, className, assetBasePath }: MarkdownContentProps) {
  return (
    <div className={cn(markdownBlockClassName, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => (
            <p className={markdownElementClassNames.paragraph} {...props} />
          ),

          ul: (props) => (
            <ul className={markdownElementClassNames.list} {...props} />
          ),

          ol: (props) => (
            <ol className={markdownElementClassNames.orderedList} {...props} />
          ),

          li: (props) => (
            <li className={markdownElementClassNames.listItem} {...props} />
          ),

          h1: (props) => (
            <h3 className={markdownElementClassNames.heading} {...props} />
          ),

          h2: (props) => (
            <h3 className={markdownElementClassNames.heading} {...props} />
          ),

          h3: (props) => (
            <h4 className={markdownElementClassNames.heading} {...props} />
          ),

          a: ({ href, children, ...props }) => {
            const resolvedHref = resolveMarkdownUrl(href, assetBasePath)
            const isExternalUrl = resolvedHref
              ? EXTERNAL_URL_PATTERN.test(resolvedHref)
              : false

            if (!resolvedHref) {
              return <span>{children}</span>
            }

            return (
              <a
                {...props}
                className={markdownElementClassNames.link}
                href={resolvedHref}
                rel={isExternalUrl ? "noreferrer" : undefined}
                target={isExternalUrl ? "_blank" : undefined}
              >
                {children}
              </a>
            )
          },

          img: ({ src, alt }) => {
            const resolvedSrc =
              typeof src === "string"
                ? resolveMarkdownUrl(src, assetBasePath)
                : undefined

            if (!resolvedSrc) {
              return null
            }

            return <img src={resolvedSrc} alt={alt ?? ""} />
          },

          pre: ({ children }) => {
            const codeBlock = getCodeBlockData(children)

            if (codeBlock?.language === "mermaid") {
              return (
                <MermaidDiagram
                  chart={codeBlock.code}
                  className={markdownElementClassNames.mermaidBlock}
                />
              )
            }

            return (
              <pre className={markdownElementClassNames.codeBlock}>
                {children}
              </pre>
            )
          },

          code: ({ className, ...props }) => (
            <code
              className={cn(markdownElementClassNames.inlineCode, className)}
              {...props}
            />
          ),

          blockquote: (props) => (
            <blockquote
              className={markdownElementClassNames.blockquote}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export { MarkdownContent, resolveMarkdownUrl }