import { Editor } from "@tiptap/core"
import { EditorContent } from "@tiptap/react"

import { get_tiptap_extensions } from "./tiptap_extensions"


export function ReadOnly(props: { html: string | undefined, single_line?: boolean, is_code?: boolean })
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
                class: `tiptap-content focus:outline-none ${single_line ? "single-line" : ""} ${is_code ? "is-code" : ""}`,
            }
        }
    })

    return <EditorContent editor={editor} />
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


// Singleton editors for sanitization
let singleton_single_line_editor: Editor | undefined = undefined
let singleton_editor: Editor | undefined = undefined

/**
 * Function to sanitize HTML using TipTap.
 * @deprecated Use the ReadOnly component instead.
 * TODO: Remove this function once we're confident everything can be handled
 *       by ReadOnly.
 */
export function sanitize_with_TipTap(html: string, single_line: boolean, is_code = false): string
{
    if (!singleton_single_line_editor)
    {
        singleton_single_line_editor = new Editor({
            extensions: get_tiptap_extensions(true, is_code),
            editable: false,
            content: "",
        })
    }
    if (!singleton_editor)
    {
        singleton_editor = new Editor({
            extensions: get_tiptap_extensions(false, is_code),
            editable: false,
            content: "",
        })
    }

    const editor = single_line ? singleton_single_line_editor : singleton_editor
    editor.commands.setContent(html)
    let html_string = editor.getHTML()

    if (single_line)
    {
        html_string = remove_p_tags(html_string)
    }

    return html_string
}
