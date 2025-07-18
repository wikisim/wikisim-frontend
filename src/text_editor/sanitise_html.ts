import { Editor } from "@tiptap/core"

import { get_tiptap_extensions } from "./tiptap_extensions"

// Singleton editors for sanitization
let singleton_single_line_editor: Editor | undefined = undefined
let singleton_editor: Editor | undefined = undefined

// Function to sanitize HTML using TipTap
export function sanitize_with_TipTap(html: string, single_line: boolean): string
{
    if (!singleton_single_line_editor)
    {
        singleton_single_line_editor = new Editor({
            extensions: get_tiptap_extensions(true),
            editable: false,
            content: "",
        })
    }
    if (!singleton_editor)
    {
        singleton_editor = new Editor({
            extensions: get_tiptap_extensions(false),
            editable: false,
            content: "",
        })
    }

    const editor = single_line ? singleton_single_line_editor : singleton_editor
    editor.commands.setContent(html)
    return editor.getHTML()
}
