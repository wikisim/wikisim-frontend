

export function deindent(text: string): string
{
    const lines = text.split("\n")
        .map(line => line.replace(/\t/g, "    ")) // Replace tabs with spaces

    // Remove leading blank lines
    while (lines.length > 0 && lines[0]!.trim() === "")
    {
        lines.shift()
    }
    // Remove trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1]!.trim() === "")
    {
        lines.pop()
    }

    if (lines.length === 0) return ""

    // Find minimum indentation
    let min_indent: number | null = null
    for (const line of lines)
    {
        const match = line.match(/^(\s*)\S/)
        if (match)
        {
            const indent = match[1]!.length
            if (min_indent === null || indent < min_indent)
            {
                min_indent = indent
            }
        }
    }

    if (min_indent === null || min_indent === 0) return lines.join("\n")

    // Remove minimum indentation
    const deindented_lines = lines.map(line =>
    {
        if (line.trim() === "") return ""
        return line.slice(min_indent)
    })

    return deindented_lines.join("\n")
}
