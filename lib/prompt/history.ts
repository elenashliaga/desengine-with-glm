export const TEACHING_COST_PER_ITERATION_CENTS = 3

function padDatePart(value: number) {
  return String(value).padStart(2, "0")
}

export function formatPromptHistoryTimestamp(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const year = parsed.getFullYear()
  const month = padDatePart(parsed.getMonth() + 1)
  const day = padDatePart(parsed.getDate())
  const hours = padDatePart(parsed.getHours())
  const minutes = padDatePart(parsed.getMinutes())
  const seconds = padDatePart(parsed.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
