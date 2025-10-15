import * as monaco from "monaco-editor"
import { useEffect, useRef, useState } from "preact/hooks"

import { clamp } from "core/utils/clamp"
import { deindent } from "core/utils/deindent"

import pub_sub from "../pub_sub"
import { is_mobile_device } from "../utils/is_mobile_device"
import "./CodeEditor.css"


monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    // Suppress specific diagnostic code
    diagnosticCodesToIgnore: [
        6133,  // 'some_name' is declared but its value is never read.(6133)
        7043,  // Variable 'some_name' implicitly has an 'any' type, but a better type may be inferred from usage.(7043)
        7044,  // Parameter 'some_name' implicitly has an 'any' type, but a better type may be inferred from usage.(7044)
        7050,  // 'some_name' implicitly has an 'any' return type, but a better type may be inferred from usage.(7050)
    ],
})

// Optionally, suppress more diagnostics:
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    // allowJs: true,
    // strict: false, // disables strict type-checking
    // noImplicitAny: false, // disables "implicitly has an any type" errors
})


interface CodeEditorProps
{
    editable: boolean
    initial_content?: string
    // single_line?: boolean
    // auto_focus?: boolean
    on_update?: (html: string, json: any) => void
    label?: string
    // invalid_value?: false | string
    // include_version_in_at_mention?: boolean
    // experimental_code_editor_features?: boolean
}
export function CodeEditor(props: CodeEditorProps)
{
    const editor_ref = useRef<HTMLDivElement | null>(null)
    const [monaco_instance, set_monaco_instance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
    const [cmd_key_down, set_cmd_key_down] = useState(false)


    useEffect(() =>
    {
        if (!editor_ref.current) return

        if (monaco_instance)
        {
            monaco_instance.dispose()
            set_monaco_instance(null)
        }

        const instance = monaco.editor.create(editor_ref.current, {
            value: props.initial_content,
            language: "typescript",
            lineNumbers: "off",
            minimap: { enabled: false },
            wordWrap: "off",
            rulers: get_rulers(),
            scrollBeyondLastLine: false,
            readOnly: !props.editable,
        })
        set_monaco_instance(instance)

        // const model = instance.getModel()
        // if (model)
        // {
        //     REGEX_MATCH_IDS.lastIndex = 0
        //     let match: RegExpExecArray | null
        //     while ((match = REGEX_MATCH_IDS.exec(model.getValue())) !== null)
        //     {
        //         const start = match.index
        //         const start_pos = model.getPositionAt(start)

        //         // Create a content widget for each match
        //         const widgetId = `function-widget-${match[1]}v${match[2]}`
        //         const function_name = `Some Function name`
        //         const widget = {
        //             getId: () => widgetId,
        //             getDomNode: () => {
        //                 const node = document.createElement("span")
        //                 node.textContent = function_name
        //                 node.style.background = "#e0e0ff"
        //                 node.style.borderRadius = "3px"
        //                 node.style.padding = "0 4px"
        //                 node.style.fontWeight = "bold"
        //                 node.style.pointerEvents = "none"
        //                 return node
        //             },
        //             getPosition: () => ({
        //                 position: start_pos,
        //                 preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
        //             })
        //         }
        //         instance.addContentWidget(widget)
        //     }
        // }

        monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
            // Remove any previous extra libs
            content: ``
        }])

        const map_of_components_by_ids: Record<string, { name: string }> = {
            "12v3": { name: "clamp" },
            "45v6": { name: "lerp" },
        }
        const map_of_component_names_to_ids: Record<string, string> = {}
        for (const [id, { name }] of Object.entries(map_of_components_by_ids))
        {
            map_of_component_names_to_ids[name] = id
        }

        const dom_node = editor_ref.current
        const keydown_handler = (e: KeyboardEvent) =>
        {
            if (e.key === "@")
            {
                e.preventDefault()
                const position = instance.getPosition()
                if (!position) return

                const content = Object.entries(map_of_components_by_ids).map(([id, component]) =>
                    deindent(`
                    /**
                     * Component description here.
                     *
                     * https://wikisim.org/wiki/${id}
                     */
                    declare var ${component.name}: any; // ${id}
                    `)
                ).join("\n")
                monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
                    content
                }])

                const insert_at_cursor = map_of_components_by_ids["12v3"]!.name
                const new_lines_count = 0

                instance.executeEdits("insert-ref-to-component", [
                    {
                        range: new monaco.Range(
                            position.lineNumber,
                            position.column,
                            position.lineNumber,
                            position.column
                        ),
                        text: insert_at_cursor,
                        forceMoveMarkers: true
                    }
                ])
                // Optionally move cursor after inserted text
                instance.setPosition({
                    lineNumber: position.lineNumber + new_lines_count,
                    column: position.column + insert_at_cursor.length
                })
            }
        }
        dom_node.addEventListener("keydown", keydown_handler)


        // // https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages.LinkProvider.html
        // // Register a LinkProvider for "some_var"
        // const link_provider_disposable = monaco.languages.registerLinkProvider("typescript",
        // {
        //     provideLinks(model, _token)
        //     {

        //         const links: monaco.languages.ILink[] = []
        //         const value = model.getValue()

        //         REGEX_MATCH_IDS.lastIndex = 0
        //         let match: RegExpExecArray | null
        //         while ((match = REGEX_MATCH_IDS.exec(value)) !== null)
        //         {
        //             const start = match.index
        //             const start_pos = model.getPositionAt(start)
        //             const end = start + match[0].length
        //             const end_pos = model.getPositionAt(end)
        //             links.push({
        //                 range: new monaco.Range(
        //                     start_pos.lineNumber,
        //                     start_pos.column,
        //                     end_pos.lineNumber,
        //                     end_pos.column
        //                 ),
        //                 url: `https://wikisim.org/wiki/${match[1]}v${match[2]}`,
        //             })
        //         }
        //         REGEX_MATCH_IDS.lastIndex = 0
        //         return { links }
        //     }
        // })

        // // https://microsoft.github.io/monaco-editor/typedoc/interfaces/languages.LinkProvider.html
        // // Register a LinkProvider for "some_var"
        // const link_provider_disposable = monaco.languages.registerLinkProvider("typescript",
        // {
        //     provideLinks(model, _token)
        //     {
        //         const links: monaco.languages.ILink[] = []
        //         const tokens = get_all_tokens(model)

        //         for (const token of tokens)
        //         {
        //             const id = map_of_component_names_to_ids[token.text]
        //             if (!id) continue

        //             links.push({
        //                 range: new monaco.Range(
        //                     token.line_number,
        //                     token.start_column,
        //                     token.line_number,
        //                     token.end_column
        //                 ),
        //                 url: `https://wikisim.org/wiki/${id}`,
        //             })
        //         }

        //         return { links }
        //     }
        // })


        return () =>
        {
            dom_node.removeEventListener("keydown", keydown_handler)
            instance.dispose()
            set_monaco_instance(null)
            // link_provider_disposable.dispose()
        }
    }, [editor_ref.current, props.initial_content, props.editable])


    // When on mobile, show help/context (such as JSDoc or hover info) when the
    // cursor is inside a token, not just on hover
    useEffect(() =>
    {
        if (!monaco_instance || !is_mobile_device()) return

        const show_hover_on_cursor = () =>
        {
            monaco_instance.trigger("keyboard", "editor.action.showHover", {})
        }

        // Listen for cursor position changes
        const disposable = monaco_instance.onDidChangeCursorPosition(show_hover_on_cursor)

        return () => disposable.dispose()
    }, [monaco_instance, is_mobile_device()])


    // Resize the editor when the window resizes
    useEffect(() =>
    {
        if (!monaco_instance) return

        const handle_resize = () => monaco_instance.layout()
        window.addEventListener("resize", handle_resize)

        return () => window.removeEventListener("resize", handle_resize)
    }, [monaco_instance])


    // Add or remove height from editor_ref div style as more lines are added/removed
    useEffect(() =>
    {
        if (!monaco_instance || !editor_ref.current) return

        const update_height = () =>
        {
            const raw_line_count = monaco_instance.getModel()?.getLineCount()
            const line_count = clamp(raw_line_count ?? 1, 8, 20)
            console.log("Updating height", line_count)
            const line_height = monaco_instance.getOption(monaco.editor.EditorOption.lineHeight)
            const height = line_count * line_height + 20 // +20 for some padding
            editor_ref.current!.style.height = `${height}px`
            monaco_instance.layout()
        }

        update_height() // Initial height set

        const disposable = monaco_instance.onDidChangeModelContent(update_height)

        return () => disposable.dispose()
    }, [monaco_instance, editor_ref.current])


    // Listen for cmd/ctrl key presses to add a class to the editor for styling
    useEffect(() => pub_sub.sub("key_down", ({ key }) =>
    {
        if (key === "Meta" || key === "Control") set_cmd_key_down(true)
    }), [])

    useEffect(() => pub_sub.sub("key_up", ({ key }) =>
    {
        if (key === "Meta" || key === "Control") set_cmd_key_down(false)
    }), [])


    return <div
        style={{
            maxWidth: "var(--max-column-width)",
            paddingRight: "var(--width-for-fixed-buttons)",
        }}
    >
        <div
            className={cmd_key_down ? "key-cmd-down" : ""}
            ref={editor_ref}
            style={{
                height: 400,
                border: "1px solid var(--colour-border)",
            }}
        />
    </div>
}


// interface ExtractedToken
// {
//     text: string
//     line_number: number
//     start_column: number
//     end_column: number
// }
// function get_all_tokens(model: monaco.editor.ITextModel): ExtractedToken[]
// {
//     const tokens: ExtractedToken[] = []
//     const line_count = model.getLineCount()
//     const language_id = model.getLanguageId()

//     for (let line_number = 1; line_number <= line_count; line_number++)
//     {
//         const line_tokens = monaco.editor.tokenize(model.getLineContent(line_number), language_id)

//         for (const token_list of line_tokens)
//         {
//             for (const token of token_list)
//             {
//                 const start_column = token.offset + 1 // Monaco uses 1-based columns
//                 const end_offset = token_list[token_list.indexOf(token) + 1]?.offset ?? model.getLineContent(line_number).length
//                 const end_column = end_offset + 1

//                 const text = model.getLineContent(line_number).substring(token.offset, end_offset)

//                 tokens.push({
//                     text,
//                     line_number,
//                     start_column,
//                     end_column
//                 })
//             }
//         }
//     }

//     return tokens
// }


function get_rulers(): number[]
{
    // [45, 80] works well for mobile and desktop
    // localStorage.setItem("preferred_editor_ruler_columns", "45,80")
    return localStorage.getItem("preferred_editor_ruler_columns")?.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)) ?? []
}
