import { Editor } from "@tiptap/core"
import { EditorContent } from "@tiptap/react"

import { get_tiptap_extensions } from "../tiptap_extensions"


export function ReadOnly(props: { html: string | undefined, single_line?: boolean, is_code?: boolean, max_height?: number })
{
    if (!props.html) return <></>

    const { single_line = false, is_code = false } = props

    const editor = new Editor({
        extensions: get_tiptap_extensions(single_line, is_code),
        editable: false,
        content: props.html || "",
        editorProps:
        {
            attributes:
            {
                class: `tiptap-content focus:outline-none ${single_line ? "single-line" : ""} ${is_code ? "is_code" : ""}`,
                style: props.max_height ? `max-height: ${props.max_height}px; overflow-y: scroll;` : "",
            }
        }
    })

    return <EditorContent editor={editor} className="tiptap-content-parent" />
}


export function remove_p_tags(html_string: string): string
{
    // For single line, we want to ensure it is not wrapped in a paragraph tag
    if (html_string.startsWith("<p>") && html_string.endsWith("</p>"))
    {
        html_string = html_string.slice(3, -4)
    }
    return html_string
}
