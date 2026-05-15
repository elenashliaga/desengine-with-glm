type ProgressDotsProps = {
  total: number
  completed: number
  className?: string
}

function ProgressDots({
  total,
  completed,
  className="flex gap-1"
}: ProgressDotsProps) {
  return (
    <div className={className}>
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < completed

        return (
          <div
            key={index}
            className={`
              h-1 w-1 rounded-full
              ${isCompleted
                ? "text-green-600"
                : "text-gray-100"
              }
            `}
          >•</div>
        )
      })}
    </div>
  )
}

export { ProgressDots }