import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Typography from "@tiptap/extension-typography"
import Underline from "@tiptap/extension-underline"
import { Selection } from "@tiptap/pm/state"
import { BubbleMenu, Editor, EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"

import pub_sub from "../pub_sub"
import { CustomReferences } from "./CustomReferences"
import { SingleLineExtension } from "./extension_enforce_single_line"
import "./TextEditorV2.css"
import { URLEditor } from "./URLEditor"


interface TextEditorV2 {
    editable: boolean
    initial_content?: string
    single_line?: boolean
    auto_focus?: boolean
    on_update?: (json: any, html: string) => void
    label?: string
}

export function TextEditorV2({
    editable,
    initial_content = "",
    single_line = false,
    auto_focus = false,
    on_update: onUpdate,
    label = "Start typing..."
}: TextEditorV2) {
    const search_requester_id = useMemo(() =>
    {
        return label + "_" + Math.random().toString(10).slice(2, 10) // Generate a random source ID
    }, [label])

    const cursor_position_on_blur_to_search = useRef<number | undefined>(undefined)
    const [edit_url_enabled, set_edit_url_enabled] = useState<Selection | undefined>(undefined)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // For single line mode, keep paragraph but disable block elements
                heading: single_line ? false : undefined,
                bulletList: single_line ? false : undefined,
                orderedList: single_line ? false : undefined,
                blockquote: single_line ? false : undefined,
                codeBlock: single_line ? false : undefined,
                horizontalRule: single_line ? false : undefined,
            }),
            // Add single line extension only when in single line mode
            ...(single_line ? [SingleLineExtension] : []),
            Highlight,
            Typography,
            Underline,
            CustomReferences,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "editor-link",
                },
            }),
        ],
        content: initial_content,
        autofocus: auto_focus,
        editorProps: {
            attributes: {
                class: `tiptap-content focus:outline-none ${single_line ? "single-line" : ""}`,
            },
            handleKeyDown: (view, event) => {
                // Prevent new lines in single line mode
                if (single_line && event.key === "Enter") {
                    event.preventDefault()
                    return true
                }

                // Handle keyboard shortcuts
                if (event.ctrlKey || event.metaKey) {
                    switch (event.key) {
                        case "b":
                            event.preventDefault()
                            editor?.chain().focus().toggleBold().run()
                            return true
                        case "i":
                            event.preventDefault()
                            editor?.chain().focus().toggleItalic().run()
                            return true
                        case "u":
                            event.preventDefault()
                            editor?.chain().focus().toggleUnderline().run()
                            return true
                        case "k":
                            event.preventDefault()
                            set_edit_url_enabled(editor?.state.selection)
                            return true
                    }
                }
                switch (event.key) {
                    case "@":
                        event.preventDefault()
                        event.stopImmediatePropagation()
                        cursor_position_on_blur_to_search.current = editor?.state.selection.from
                        // Trigger reference search modal to show
                        pub_sub.pub("search_for_reference", { search_requester_id })
                        return true
                }
                return false
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON()
            const html = editor.getHTML()
            onUpdate?.(json, html)
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

            // If no data_component_id was selected then do nothing
            if (!data.data_component_id) return

            // Insert the selected search result into the editor
            editor_chain
                // .deleteRange({ from: editor.state.selection.from - 1, to: editor.state.selection.from })
                .insertContent({
                    type: "customMention",
                    attrs: {
                        id: data.data_component_id,
                        label: data.data_component_id,
                    },
                })
                .run()
        }, search_requester_id)

        return () => {
            // console .log(`unsubscribing "${search_requester_id}"`)
            unsubscribe()
        }
    }, [editor, search_requester_id])


    const get_editor_data = useCallback(() => {
        return {
            json: editor.getJSON(),
            html: editor.getHTML(),
            text: editor.getText(),
        }
    }, [editor])


    const focused = editor.isFocused
    const has_value = (editor.getText() || "").trim().length > 0

    return (
        <div className="tiptap-editor-container">
            <div className="editor-content" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>

            <label
                style={{
                    position: "absolute",
                    left: 12,
                    top: has_value || focused ? -10 : 8,
                    fontSize: has_value || focused ? 12 : 16,
                    color: focused ? "#a6aeb6" : "#868e96",
                    background: "white",
                    padding: has_value || focused ? "0 4px" : "0",
                    pointerEvents: "none",
                    transition: "all 0.2s"
                }}
            >
                {label}
            </label>

            {editor && edit_url_enabled && <URLEditor
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

            <ContextMenu editor={editor} set_edit_url_enabled={set_edit_url_enabled} />

            <div className="editor-toolbar">
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
            </div>
        </div>
    )
}


interface ContextMenuProps
{
    editor: Editor
    set_edit_url_enabled: (selection: Selection | undefined) => void
}
function ContextMenu({ editor, set_edit_url_enabled }: ContextMenuProps)
{
    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <button
                onClick={() => set_edit_url_enabled(editor.state.selection)}
                style={{ marginRight: 8 }}
            >
                Add/Edit Link
            </button>
            {/* ...other buttons */}
        </BubbleMenu>
    )
}
