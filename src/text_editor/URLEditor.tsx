import { Button, Modal } from "@mantine/core"
import { Selection } from "@tiptap/pm/state"
import { useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"

import { Range } from "@tiptap/core"
import { TextEditorV1 } from "./TextEditorV1"
import { is_valid_URL } from "./is_valid_URL"


interface URLEditorProps
{
    selection: Selection
    on_close: (data?: {text: string, url: string}, remove_link_at?: Range) => void
}


export function URLEditor (props: URLEditorProps)
{
    const { selection, on_close } = props

    // Handle 5 different cases:
    // 1. The selection is empty and there is no underlying link being edited
    // 2. The selection is empty and there is an existing underlying link being edited
    // 3. The selection is not empty and there is no underlying link being edited and the text selected is a valid URL
    // 4. The selection is not empty and there is no underlying link being edited and the text selected is not a valid URL
    // 5. The selection is not empty and there is an existing underlying link being edited
    // Handle error cases:
    // 6. The selection is not empty and partially goes across a boundary between a link and another element (could also be a link)
    //      * Choose the first link to edit.

    const result = find_first_link_from_selection(selection)
    let initial_text = result.text
    let initial_url = result.url

    // Case 3: Text selected, no existing link, text is valid URL
    if (initial_text && !initial_url && is_valid_URL(initial_text))
    {
        initial_url = (initial_text.startsWith("http://") || initial_text.startsWith("https://"))
            ? initial_text
            : `https://${initial_text}` // Default to https if no protocol is specified
        initial_text = ""
    }

    return <InnerURLEditor
        initial_text={initial_text}
        initial_url={initial_url}
        link_location={(!!initial_url) ? result.range : undefined}
        on_close={on_close}
    />
}


// Find if:
// * an empty selection is in a link or not
// * a non-empty selection includes one or more links, if so use the first link found
// If a link is found in either case it returns the range of the link and the text
// contained by the link.
// If a link is not found, it returns the text covered by the selection (which
// for an empty selection will be an empty string.
function find_first_link_from_selection(selection: Selection)
{
    // Default to the text covered by the selection unless a link is found
    const doc = selection.$from.doc

    let { from, to } = selection
    let text = doc.textBetween(from, to, " ")
    let url = ""

    // Search for the first link in the document within the selection range
    let found_a_link = false
    doc.nodesBetween(from, to, (node, pos) => {
        if (found_a_link) return false

        const node_is_a_link = node.marks.find(m => m.type.name === "link")
        if (!node_is_a_link) return true // Continue traversing if no link mark found
        found_a_link = true

        text = node.text || ""
        url = node_is_a_link.attrs.href || ""
        from = pos
        to = pos + node.nodeSize
        return false // Stop traversing once we find the first link
    })

    return { text, url, range: { from, to } }
}



interface InnerURLEditorProps
{
    initial_text: string
    initial_url: string
    link_location: Range | undefined
    on_close: (data?: {text: string, url: string}, remove_link_at?: Range) => void
}

function InnerURLEditor(props: InnerURLEditorProps)
{
    const { initial_text, initial_url, link_location, on_close } = props

    const [text, set_text] = useState(initial_text)
    const [url, set_url] = useState(initial_url)


    const handle_text_on_change = (e: JSX.TargetedEvent<HTMLTextAreaElement | HTMLInputElement, Event>) =>
    {
        const newText = e.currentTarget.value
        set_text(newText)
    }

    const handle_url_on_change = (e: JSX.TargetedEvent<HTMLTextAreaElement | HTMLInputElement, Event>) =>
    {
        const newUrl = e.currentTarget.value
        set_url(newUrl)
    }

    const handle_on_key_down = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    {
        if (e.key !== "Enter") return
        e.preventDefault() // Prevent default Enter behavior
        e.stopImmediatePropagation()
        handle_apply() // Apply changes on Enter
    }

    const handle_apply = () => {
        // Ensure URL has protocol if it doesn't already
        let final_url = url.trim()
        if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
            final_url = `https://${url}`
        }

        on_close({ text, url: final_url })
    }

    const focus_text = (!text || !!url)

    return (
        <Modal
            opened={true}
            onClose={handle_apply}
            title="Edit Link"
            size="md"
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <TextEditorV1
                    editable={true}
                    value={text}
                    single_line={true}
                    label="Link Text"
                    on_change={handle_text_on_change}
                    start_focused={focus_text ? "focused" : false}
                    on_key_down={handle_on_key_down}
                />
                <TextEditorV1
                    editable={true}
                    value={url}
                    single_line={true}
                    label="URL"
                    on_change={handle_url_on_change}
                    start_focused={focus_text ? false : "focused"}
                    on_key_down={handle_on_key_down}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <Button
                        variant="danger"
                        onClick={() => on_close(undefined, link_location)}
                        disabled={!link_location}
                    >
                        Delete
                    </Button>
                    <Button
                        variant="subtle"
                        onClick={() => on_close()}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handle_apply}
                        disabled={!text.trim() || !url.trim() || !is_valid_URL(url.trim())}
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
