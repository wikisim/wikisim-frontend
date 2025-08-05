import { Tooltip } from "@mantine/core"
import IconExclamationCircle from "@tabler/icons-react/dist/esm/icons/IconExclamationCircle"
import { Selection } from "@tiptap/pm/state"
import { BubbleMenu, Editor, EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import pub_sub from "../pub_sub"
import { remove_p_tags } from "./sanitise_html"
import "./TextEditor.shared.css"
import "./TextEditorV2.css"
import { get_tiptap_extensions } from "./tiptap_extensions"
import { URLEditor } from "./URLEditor"


interface TextEditorV2
{
    editable: boolean
    initial_content?: string
    single_line?: boolean
    auto_focus?: boolean
    on_update?: (html: string, json: any) => void
    label?: string
    invalid_value?: false | string
}

export function TextEditorV2({
    editable,
    initial_content = "",
    single_line = false,
    auto_focus = false,
    on_update,
    label = "Start typing...",
    invalid_value = false,
}: TextEditorV2) {
    const search_requester_id = useMemo(() =>
    {
        return label + "_" + Math.random().toString(10).slice(2, 10) // Generate a random source ID
    }, [label])

    const cursor_position_on_blur_to_search = useRef<number | undefined>(undefined)
    const [edit_url_enabled, set_edit_url_enabled] = useState<Selection | undefined>(undefined)

    const editor = useEditor({
        extensions: get_tiptap_extensions(single_line),
        enableContentCheck: true,
        content: initial_content,
        autofocus: auto_focus,
        editorProps: {
            attributes: {
                class: `tiptap-content focus:outline-none ${single_line ? "single-line" : ""}`,
            },
            handlePaste(_view, event)
            {
                // type guard
                if (!editor) return false

                // Only handle plain text pastes
                const clipboard_data = event.clipboardData
                if (!clipboard_data) return false

                // This is not a good UX for inserting images but it is a work
                // around for now.
                const text = clipboard_data.getData("text/plain").trim()
                let success = convert_image_url_into_img_tag(text, editor, event)
                if (success) return true

                // Allow Wikicommons-style <a><img/></a> pastes. This seems to
                // specific and brittle but we'll experiment with it for now.
                success = handle_wikicommons_image_paste(text, editor, event)
                if (success) return true

                return false
            },
            transformPastedHTML: (html) =>
            {
                if (single_line)
                {
                    // Strip newlines and convert block elements to spaces for single-line fields
                    return html
                        .replace(/\n/g, " ")
                        .replace(/<\/?(div|p|br|h[1-6]|ul|ol|li)[^>]*>/gi, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                }
                return html
            },
            transformPastedText: (text) =>
            {
                if (single_line)
                {
                    // Strip newlines from plain text for single-line fields
                    return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim()
                }
                return text
            },
            handleKeyDown: (_view, event) =>
            {
                // type guard
                if (!editor) return false

                // Prevent new lines in single line mode, does not prevent
                // content containing new lines from being pasted in.  See
                // transformPastedHTML and transformPastedText for that behavior.
                if (single_line && event.key === "Enter")
                {
                    event.preventDefault()
                    return true
                }

                // Handle keyboard shortcuts
                if (event.ctrlKey || event.metaKey)
                {
                    switch (event.key) {
                        case "b":
                            event.preventDefault()
                            editor.chain().focus().toggleBold().run()
                            return true
                        case "i":
                            event.preventDefault()
                            editor.chain().focus().toggleItalic().run()
                            return true
                        case "u":
                            event.preventDefault()
                            editor.chain().focus().toggleUnderline().run()
                            return true
                        case "k":
                            event.preventDefault()
                            set_edit_url_enabled(editor.state.selection)
                            return true
                    }
                }

                if (event.key === "@")
                {
                    event.preventDefault()
                    event.stopImmediatePropagation()
                    cursor_position_on_blur_to_search.current = editor.state.selection.from
                    // Select the text after the @ symbol
                    const max_length = editor.state.doc.content.size
                    const proceeding_text = editor.state.doc.textBetween(
                        editor.state.selection.from,
                        Math.min(max_length, editor.state.selection.from + 100),
                        " "
                    )
                    const next_word = proceeding_text.split(" ")[0]

                    // Trigger reference search modal to show
                    pub_sub.pub("search_for_reference", {
                        search_requester_id,
                        search_term: next_word,
                    })
                    return true
                }
                return false
            },
        },
        onUpdate: ({ editor }) =>
        {
            const json = editor.getJSON()
            let html = editor.getHTML()
            // Replace every double space with space+&nbsp; to preserve multiple spaces visually
            html = html.replace(/ {2}/g, " &nbsp;")
            if (single_line) html = remove_p_tags(html)
            on_update?.(html, json)
        },
    })


    if (!editor) return null
    editor.setEditable(editable)


    useEffect(() =>
    {
        // Subscribe to search results
        // console .log(`Subscribing "${search_requester_id}" to search_for_reference_completed`)
        const unsubscribe = pub_sub.sub("search_for_reference_completed", data =>
        {
            // console .log(`Received search result for "${data.search_requester_id}", we are ${search_requester_id}`, data)
            if (data.search_requester_id !== search_requester_id) return
            const editor_chain = editor
                .chain()
                .focus()

            // Restore cursor position if it was set before the search
            if (cursor_position_on_blur_to_search.current !== undefined)
            {
                editor_chain.setTextSelection(cursor_position_on_blur_to_search.current)
                cursor_position_on_blur_to_search.current = undefined
            }

            // Insert the selected search result into the editor
            editor_chain
                // .deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from })
                .insertContent({
                    type: "customMention",
                    attrs: {
                        id: data.data_component.id.id,
                        label: data.data_component.plain_title,
                    },
                })
                .run()
        }, search_requester_id)

        return () => unsubscribe()
    }, [editor, search_requester_id])

    const is_focused = editor.isFocused
    const has_value = (editor.getText() || "").trim().length > 0

    return <>
        <Tooltip
            disabled={!invalid_value}
            label={invalid_value}
            position="bottom"
        >
            <div className={`tiptap-editor-container ${has_value ? "has_value" : ""} ${is_focused ? "is_focused" : ""} ${invalid_value ? "invalid_value" : ""}`}>
                <div className="editor-content" onClick={() => editor.chain().focus().run()}>
                    <EditorContent editor={editor} />
                </div>

                <label>{label}</label>

                {invalid_value && <IconExclamationCircle className="error-icon" />}
            </div>

        </Tooltip>

        {edit_url_enabled && <URLEditor
            selection={edit_url_enabled}
            on_close={(data, remove_link_at) => {
                set_edit_url_enabled(undefined)
                const chained = editor.chain().focus()

                if (data)
                {
                    let { text, url } = data
                    text = text.trim()
                    url = url.trim()
                    if (text && url)
                    {
                        // Insert the URL as a link in the editor
                        chained.setLink({
                            href: url,
                            rel: "noopener",
                        }).insertContent(text)
                    }
                }
                else if (remove_link_at)
                {
                    // Remove the link if no data was provided
                    chained
                        .setTextSelection(remove_link_at)
                        .unsetLink()
                }

                chained.run()
                set_edit_url_enabled(undefined)
            }}
        />}

        <ContextMenu
            editor={editor}
            set_edit_url_enabled={set_edit_url_enabled}
            set_superscript_enabled={selection =>
            {
                if (!selection) return
                const { from, to } = selection
                editor.chain().focus().setTextSelection({ from, to }).toggleSuperscript().run()
            }}
        />

        {/* <div className="editor-toolbar">
            <button
                disabled={!editable}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "active" : ""}
            >
                Bold
            </button>
            <button
                disabled={!editable}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "active" : ""}
            >
                Italic
            </button>
            <button
                disabled={!editable}
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={editor.isActive("highlight") ? "active" : ""}
            >
                Highlight
            </button>
            {!single_line && (
                <>
                    <button
                        disabled={!editable}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
                    >
                        H2
                    </button>
                    <button
                        disabled={!editable}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive("bulletList") ? "active" : ""}
                    >
                        Bullet List
                    </button>
                </>
            )}
            <button onClick={() => console.log("Editor data:", get_editor_data())}>
                Get JSON
            </button>
        </div> */}
    </>
}


interface ContextMenuProps
{
    editor: Editor
    set_edit_url_enabled: (selection: Selection | undefined) => void
    set_superscript_enabled: (selection: Selection | undefined) => void
}
function ContextMenu({ editor, ...props }: ContextMenuProps)
{
    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <button
                onClick={() => props.set_edit_url_enabled(editor.state.selection)}
                style={{ marginRight: 8 }}
            >
                Add/Edit Link
            </button>
            <button
                onClick={() => props.set_superscript_enabled(editor.state.selection)}
                style={{ marginRight: 8 }}
            >
                sup<sup>2</sup>
            </button>
            {/* ...other buttons */}
        </BubbleMenu>
    )
}


function convert_image_url_into_img_tag(text: string, editor: Editor, event: ClipboardEvent): true | undefined
{
    const image_URL_pattern = /^(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff?))(\?.*)?$/i
    if (image_URL_pattern.test(text))
    {
        // @ts-ignore -- width is present and respected but no in TipTap 2.x
        // types yet.  It is in 3.x types but this version seems bleeding edge
        // and has some other issues with using CustomReferences.
        editor.chain().focus().setImage({ src: text, width: 400 }).run()
        event.preventDefault()
        return true
    }
    return undefined
}


function handle_wikicommons_image_paste(text: string, editor: Editor, event: ClipboardEvent): true | undefined
{
    // Allow Wikicommons-style <a><img/></a> pastes, i.e. a user:
    //  1. is reading an article on Wikipedia e.g.: https://en.wikipedia.org/wiki/Collaboration
    //  2. they click on an image in Wikipedia, e.g.: https://en.wikipedia.org/wiki/Collaboration#/media/File:3d10_fm_de_vilafranca.jpg
    //  3. they click on the "More Details" link in the bottom right corner and go to the Wikicommons page e.g.: https://commons.wikimedia.org/wiki/File:3d10_fm_de_vilafranca.jpg
    //  4. they click on the "Use this file (on the web)" link and copy the HTML from that page which will be in the format: <a><img/></a>
    //  5. they paste that content into the editor
    try {
        const doc = new DOMParser().parseFromString(text, "text/html")
        const a = doc.body.firstElementChild
        if (
            a &&
            a.tagName === "A" &&
            a.children.length === 1 &&
            a.children[0]!.tagName === "IMG"
        ) {
            const href = a.getAttribute("href") || ""
            const title = a.getAttribute("title") || "Wikipedia"

            const img_src = a.children[0]!.getAttribute("src") || ""
            const img_width = 400

            // Insert an image, then a caption with a link beneath it
            editor.chain()
                .focus()
                .insertContent([
                    {
                        type: "image",
                        attrs: { src: img_src, title, width: img_width },
                    },
                    {
                        type: "text",
                        text: href,
                        marks: [
                            {
                                type: "link",
                                attrs: { href, target: "_blank", rel: "noopener" },
                            },
                        ],
                    },
                ])
                .run()

            event.preventDefault()
            return true
        }
    } catch (_error) {
        // Fallback to default
    }
    return undefined
}
