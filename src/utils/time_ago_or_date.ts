

export function time_ago_or_date(date: Date, text_to_preprend: boolean = false): string
{
    const now = new Date()

    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 3) return text_to_preprend ? "on" : date.toDateString()
    if (text_to_preprend) return "about"
    if (days > 0) return `${pluralise(days, "day")} ago`
    if (hours > 0) return `${pluralise(hours, "hour")} ago`
    if (minutes > 0) return `${pluralise(minutes, "minute")} ago`
    return `${pluralise(seconds, "second")} ago`
}

function pluralise(count: number, singular: string): string
{
    return `${count} ${singular}${count !== 1 ? "s" : ""}`
}
