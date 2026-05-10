"use client"

import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

import { type MarkdownContentProps } from "./props"
import { markdownBlockClassName, markdownElementClassNames } from "./styles"

function MarkdownContent({ content, className }: MarkdownContentProps) {
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
          a: (props) => (
            <a
              className={markdownElementClassNames.link}
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
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

export { MarkdownContent }
