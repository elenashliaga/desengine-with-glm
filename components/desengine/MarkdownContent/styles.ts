const markdownBlockClassName = "space-y-3 text-sm leading-6 text-muted-foreground"

const markdownElementClassNames = {
  paragraph: "whitespace-pre-wrap",
  list: "list-disc space-y-1 pl-5",
  orderedList: "list-decimal space-y-1 pl-5",
  listItem: "pl-1",
  heading: "font-medium text-foreground",
  link: "text-foreground underline underline-offset-4",
  inlineCode: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-foreground",
  codeBlock: "overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground",
  blockquote: "border-l-2 border-border pl-4 italic text-foreground/80",
} as const

export { markdownBlockClassName, markdownElementClassNames }
