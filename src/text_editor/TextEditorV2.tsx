import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"
import Typography from "@tiptap/extension-typography"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks"

import pub_sub from "../pub_sub"
import { CustomReferencesAndSearch } from "./CustomReferencesAndSearch"
import "./TextEditorV2.css"
import { SingleLineExtension } from "./extension_enforce_single_line"


interface TextEditorV2 {
    initialContent?: string
    singleLine?: boolean
    autoFocus?: boolean
    selectAllOnFocus?: boolean
    onUpdate?: (json: any, html: string) => void
    label?: string
}

export function TextEditorV2({
    initialContent = "",
    singleLine = false,
    autoFocus = false,
    selectAllOnFocus = false,
    onUpdate,
    label = "Start typing..."
}: TextEditorV2) {
    const search_requester_id = useMemo(() =>
    {
        return label + "_" + Math.random().toString(10).slice(2, 10) // Generate a random source ID
    }, [label])

    const cursor_position_on_blur_to_search = useRef<number | undefined>(undefined)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // For single line mode, keep paragraph but disable block elements
                heading: singleLine ? false : undefined,
                bulletList: singleLine ? false : undefined,
                orderedList: singleLine ? false : undefined,
                blockquote: singleLine ? false : undefined,
                codeBlock: singleLine ? false : undefined,
                horizontalRule: singleLine ? false : undefined,
            }),
            // Add single line extension only when in single line mode
            ...(singleLine ? [SingleLineExtension] : []),
            Highlight,
            Typography,
            Underline,
            CustomReferencesAndSearch,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "editor-link",
                },
            }),
        ],
        content: initialContent,
        autofocus: autoFocus,
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${singleLine ? "single-line" : ""}`,
            },
            handleKeyDown: (view, event) => {
                // Prevent new lines in single line mode
                if (singleLine && event.key === "Enter") {
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
                            const url = window.prompt("Enter URL:")
                            if (url) {
                                editor?.chain().focus().setLink({ href: url }).run()
                            }
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

    // Select all text on focus if specified
    useEffect(() => {
        if (editor && selectAllOnFocus && autoFocus) {
            setTimeout(() => {
                editor.commands.selectAll()
            }, 100)
        }
    }, [editor, selectAllOnFocus, autoFocus])


    useEffect(() =>
    {
        if (!editor) return

        // Subscribe to search results
        console.log(`Subscribing "${search_requester_id}" to search_for_reference_completed`)
        const unsubscribe = pub_sub.sub("search_for_reference_completed", data =>
        {
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
            const current_content = editor.getJSON()
            debugger

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
            console.log(`unsubscribing "${search_requester_id}"`)
            unsubscribe()
        }
    }, [editor])


    const getEditorData = useCallback(() => {
        if (!editor) return { json: null, html: "", text: "" }

        return {
            json: editor.getJSON(),
            html: editor.getHTML(),
            text: editor.getText(),
        }
    }, [editor])


    return (
        <div className="tiptap-editor-container">
            <div className="editor-toolbar">
                <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={editor?.isActive("bold") ? "active" : ""}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={editor?.isActive("italic") ? "active" : ""}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    className={editor?.isActive("highlight") ? "active" : ""}
                >
                    Highlight
                </button>
                {!singleLine && (
                    <>
                        <button
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor?.isActive("heading", { level: 2 }) ? "active" : ""}
                        >
                            H2
                        </button>
                        <button
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            className={editor?.isActive("bulletList") ? "active" : ""}
                        >
                            Bullet List
                        </button>
                    </>
                )}
                <button onClick={() => console.log("Editor data:", getEditorData())}>
                    Get JSON
                </button>
            </div>

            <div className="editor-content">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
