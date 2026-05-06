// Tabs.styles.ts
export const TabsStyles = {
  list: "w-full flex border-b border-white/10",

  trigger: [
    "flex-1 w-full px-4 py-2 text-sm flex-col",
    "justify-start text-left",
    "border-b-2 border-transparent",
    "transition-colors",
    "data-[state=active]:text-white",
    "data-[state=active]:border-white",
    "bg-black/90 text-white/30",
    "hover:text-white/80",
  ].join(" "),

  content: "w-full h-full",
}