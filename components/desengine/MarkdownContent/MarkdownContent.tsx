/* eslint-disable @next/next/no-img-element */
"use client"

import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

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
    if (!segment || segment === ".") {
      continue
    }

    if (segment === "..") {
      return null
    }

    normalizedSegments.push(segment)
  }

  return normalizedSegments.join("/")
}

function resolveMarkdownUrl(url: string | undefined, assetBasePath?: string) {
  if (!url) {
    return undefined
  }

  const trimmedUrl = url.trim()

  if (
    !trimmedUrl
    || trimmedUrl.startsWith("#")
    || trimmedUrl.startsWith("/")
    || EXTERNAL_URL_PATTERN.test(trimmedUrl)
  ) {
    return trimmedUrl
  }

  if (!assetBasePath) {
    return trimmedUrl
  }

  const suffixIndex = trimmedUrl.search(/[?#]/)
  const rawPath = suffixIndex >= 0 ? trimmedUrl.slice(0, suffixIndex) : trimmedUrl
  const suffix = suffixIndex >= 0 ? trimmedUrl.slice(suffixIndex) : ""
  const normalizedPath = normalizeRelativePath(rawPath)

  if (!normalizedPath) {
    return undefined
  }

  return `${assetBasePath}/${normalizedPath}${suffix}`
}

function MarkdownContent({ content, className, assetBasePath }: MarkdownContentProps) {
  return (
    <div className={cn(markdownBlockClassName, className)}>
      <ReactMarkdown
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
            const isExternalUrl = resolvedHref ? EXTERNAL_URL_PATTERN.test(resolvedHref) : false

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
            const resolvedSrc = resolveMarkdownUrl(src, assetBasePath)

            if (!resolvedSrc) {
              return null
            }
            return (
              <img
                alt={alt ?? ""}
                className={markdownElementClassNames.image}
                loading="lazy"
                src={resolvedSrc}
              />
            )
          },
          pre: (props) => (
            <pre className={markdownElementClassNames.codeBlock} {...props} />
          ),
          code: (props) => (
            <code className={markdownElementClassNames.inlineCode} {...props} />
          ),
          blockquote: (props) => (
            <blockquote className={markdownElementClassNames.blockquote} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export { MarkdownContent, resolveMarkdownUrl }
