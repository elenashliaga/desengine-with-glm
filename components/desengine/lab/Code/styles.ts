// Tabs.styles.ts
export const TabsStyles = {
  list: [
    "w-full flex flex-col gap-2 rounded-2xl border border-black/10 bg-[#f5efe4] p-2",
    "md:max-w-[18rem]",
  ].join(" "),

  trigger: [
    "w-full rounded-xl border border-transparent px-4 py-3",
    "justify-start text-left",
    "transition-[border-color,background-color,color,box-shadow]",
    "text-black/55 hover:text-black/80",
    "hover:border-black/10 hover:bg-white/70",
    "data-[state=active]:border-black/10 data-[state=active]:bg-white",
    "data-[state=active]:text-black data-[state=active]:shadow-sm",
  ].join(" "),

  content: "w-full h-full mt-0",
}
