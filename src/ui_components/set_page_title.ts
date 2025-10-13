

export function set_page_title(title?: string)
{
    title = title ? (title + " - WikiSim") : "WikiSim"
    document.title = title
}
