import { Editor } from "@tiptap/core"
import { EditorContent } from "@tiptap/react"
import { useMemo } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"
import { get_function_signature } from "core/evaluator/format_function"

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


export function ReadOnlyFunction(props: { component: DataComponent | NewDataComponent })
{
    const { component: { value_type, input_value = "", function_arguments } } = props

    if (value_type !== "function")
    {
        return <></>
    }

    const function_as_tiptap_html = useMemo(() =>
    {
        const function_signature = get_function_signature(function_arguments || [])
        const function_signature_tiptap = `<p>${function_signature} => {</p>`

        const indented_input_value = input_value
            .replaceAll("<p>", "<p> &nbsp; &nbsp;")
            .replaceAll("<br>", "<br>&nbsp; &nbsp;")

        return function_signature_tiptap + indented_input_value + "<p>}</p>"
    }, [function_arguments, input_value])

    return <ReadOnly html={function_as_tiptap_html} is_code={true} />
}
