import { Tooltip } from "@mantine/core"
import IconExclamationCircle from "@tabler/icons-react/dist/esm/icons/IconExclamationCircle"
import { Selection } from "@tiptap/pm/state"
import { BubbleMenu, Editor, EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import pub_sub from "../pub_sub"
import "../ui_components/input_elements.shared.css"
import { remove_p_tags } from "./sanitise_html"
import "./TextEditorV2.css"
import { get_tiptap_extensions } from "./tiptap_extensions"
import { URLEditor } from "./URLEditor"


interface TextEditorV2Props
{
    editable: boolean
    initial_content?: string
    single_line?: boolean
    auto_focus?: boolean
    on_update?: (html: string, json: any) => void
    label?: string
    invalid_value?: false | string
    include_version_in_at_mention?: boolean
    experimental_code_editor_features?: boolean
}

export function TextEditorV2({
    editable,
    initial_content = "",
    single_line = false,
    auto_focus = false,
    on_update,
    label = "Start typing...",
    invalid_value = false,
    include_version_in_at_mention = false,
    experimental_code_editor_features = false,
}: TextEditorV2Props) {
    const search_requester_id = useMemo(() =>
    {
        return label + "_" + Math.random().toString(10).slice(2, 10) // Generate a random source ID
    }, [label])
    const ignore_initial_non_updates = useRef(true)

    const cursor_position_on_blur_to_search = useRef<number | undefined>(undefined)
    const [edit_url_enabled, set_edit_url_enabled] = useState<Selection | undefined>(undefined)

    const editor = useEditor({
        extensions: get_tiptap_extensions(single_line, experimental_code_editor_features),
        enableContentCheck: true,
        content: initial_content,
        autofocus: auto_focus,
        editorProps: {
            attributes: {
                class: `tiptap-content focus:outline-none ${single_line ? "single-line" : ""} ${experimental_code_editor_features ? "is-code" : ""}`,
                // spellCheck: "false",
                // autoCorrect: "off",
                // autoCapitalize: "off",
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
                // Why is it not good UX?  And what is it working around?
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
            handleDOMEvents:
            {
                beforeinput: (view, event) =>
                {
                    if (event.inputType === "insertText")
                    {
                        if ((event.data === '"' || event.data === "“" || event.data === "”"))
                        {
                            event.preventDefault()
                            view.dispatch(view.state.tr.insertText('"'))
                            return true
                        }
                        else if (event.data === "'" || event.data === "‘")
                        {
                            event.preventDefault()
                            view.dispatch(view.state.tr.insertText("'"))
                            return true
                        }
                    }
                    return false
                }
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
                            if (!experimental_code_editor_features)
                            {
                                event.preventDefault()
                                set_edit_url_enabled(editor.state.selection)
                                return true
                            }
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


                // Handle Tab and Shift+Tab for indenting and outdenting
                if (experimental_code_editor_features && (event.key === "Tab"))
                {
                    // Some really strange behavior here with eslint.  If we
                    // inline the return from handle_tab_indent_outdent()
                    // eslint produces errors all over the place.  So we just
                    // assign it to the variable `result` and return that... ?!
                    // return handle_tab_indent_outdent(editor, event)
                    const result = handle_tab_indent_outdent(editor, event)
                    return result
                }

                return false
            },
        },
        onUpdate: ({ editor }) =>
        {
            const json = editor.getJSON()
            let html = editor.getHTML()
            // Replace every double space with space+&nbsp; to preserve multiple spaces visually
            html = html.replace(/ {2}/g, "&nbsp; ")
            if (single_line) html = remove_p_tags(html)

            // For some reason, tiptap editor emits 3 onUpdate calls on init,
            // even though the content is not changing.  So we add this check
            // that ignores those initial non-updates.
            if (ignore_initial_non_updates.current)
            {
                const no_change = html === initial_content
                if (no_change) return
                ignore_initial_non_updates.current = false
            }

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

            const id = include_version_in_at_mention
                ? data.data_component.id.to_str()
                : data.data_component.id.to_str_without_version()

            // Insert the selected search result into the editor
            editor_chain
                // .deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from })
                .insertContent({
                    type: "customMention",
                    attrs: {
                        id,
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

        {!experimental_code_editor_features && edit_url_enabled && <URLEditor
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

        {!experimental_code_editor_features && <ContextMenu
            editor={editor}
            set_edit_url_enabled={set_edit_url_enabled}
            set_superscript_enabled={selection =>
            {
                if (!selection) return
                const { from, to } = selection
                editor.chain().focus().setTextSelection({ from, to }).toggleSuperscript().run()
            }}
        />}

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


const INDENT_SIZE = 4 // Number of spaces per indent level
const INDENT_STRING = " ".repeat(INDENT_SIZE)
function handle_tab_indent_outdent(editor: Editor, event: KeyboardEvent): boolean
{
    event.preventDefault()

    const { state, dispatch } = editor.view
    const { selection } = state
    const { from, to } = selection

    const is_indenting = !event.shiftKey
    const tr = state.tr
    let modified = false

    // Doesn't work without it
    const unknown_fudge = 1

    // Helper function to apply indentation changes to a single line
    const change_indentation = (line_start: number, line_text: string): void =>
    {
        if (is_indenting)
        {
            // Add indentation at the start of the line
            // Only indent the first line if there are multiple lines
            const node = state.doc.nodeAt(line_start)
            if (!node) return
            // const pos_in_node = line_start - state.doc.resolve(line_start).start()
            // const updated_text = INDENT_STRING + node.textContent.slice(pos_in_node)
            // const pos_in_node = line_start - state.doc.resolve(line_start).start()
            const updated_text = INDENT_STRING + node.textContent.slice(0)
            tr.replaceWith(line_start, line_start + node.nodeSize - unknown_fudge, state.schema.text(updated_text))
            // editor.commands.insertContentAt(line_start, INDENT_STRING)
            modified = true
        }
        else
        {
            const matches = /^\s+/.exec(line_text)
            // Remove indentation from the start of the line
            if (matches)
            {
                const white_space = matches[0].length
                const to_remove = Math.min(white_space, INDENT_SIZE)
                tr.delete(line_start, line_start + to_remove + unknown_fudge)
                modified = true
            }
        }
    }

    if (selection.empty)
    {
        // Handle single cursor position - just indent/outdent the current line
        const line_start = find_start_position_of_line_from_cursor(editor, from)
        const line_text = state.doc.textBetween(line_start, state.doc.content.size, "\n")
        change_indentation(line_start, line_text)
    }
    else
    {
        // Handle selection - collect all line positions first
        const line_start = find_start_position_of_line_from_cursor(editor, from)
        const lines_to_process: Array<{ start: number, text: string }> = []

        state.doc.nodesBetween(line_start, to, (node, pos) =>
        {
            if (!node.isTextblock) return

            const node_text = node.textContent
            if (!node_text) return

            const lines = node_text.split("\n")
            let current_line_start = pos

            for (let i = 0; i < lines.length; i++)
            {
                const line = lines[i]!
                const line_end = current_line_start + line.length

                // Check if this line intersects with our selection
                if (current_line_start <= to && line_end >= from)
                {
                    lines_to_process.push({ start: current_line_start, text: line })
                }

                // Move to next line (+ 1 for the newline character)
                current_line_start = line_end + 1
            }
        })

        // Process lines from end to beginning to avoid position shifting
        for (let i = lines_to_process.length - 1; i >= 0; i--)
        {
            const line_info = lines_to_process[i]!
            change_indentation(line_info.start, line_info.text)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (modified) dispatch(tr)
    return true
}


function find_start_position_of_line_from_cursor(editor: Editor, cursor_position: number): number
{
    const { state } = editor.view
    const doc = state.doc

    // Start from cursor position and work backwards to find start of line
    for (let pos = cursor_position - 1; pos >= 0; pos--)
    {
        if (doc.textBetween(pos, pos + 2, "\n") === "\n")
        {
            // Found newline, so start of line is the position after it
            return pos + 1
        }
    }

    // No newline found before cursor, so we're on the first line
    return 0
}
