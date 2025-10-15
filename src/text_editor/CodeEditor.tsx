import * as monaco from "monaco-editor"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import { clamp } from "core/utils/clamp"
import { deindent } from "core/utils/deindent"

import { format_function_input_value_string } from "../../lib/core/src/evaluator/format_function"
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
    const [monaco_input_model, set_monaco_input_model] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
    const [cmd_key_down, set_cmd_key_down] = useState(false)
    const search_requester_id = useMemo(() => `code_editor_${Math.random().toString(36).substring(2, 15)}`, [])


    useEffect(() =>
    {
        if (!editor_ref.current) return

        if (monaco_input_model)
        {
            monaco_input_model.dispose()
            set_monaco_input_model(null)
        }

        const input_model = monaco.editor.create(editor_ref.current, {
            value: props.initial_content,
            language: "typescript",
            lineNumbers: "off",
            minimap: { enabled: false },
            wordWrap: "off",
            rulers: get_rulers(),
            scrollBeyondLastLine: false,
            readOnly: !props.editable,
        })
        set_monaco_input_model(input_model)


        const function_arguments = [{ name: "a_param", id: 0 }]
        // Create a hidden model for validation
        function wrap_user_code(user_code: string): string
        {
            return format_function_input_value_string({
                js_input_value: user_code,
                requested_at: Date.now(),
                function_arguments,
            }).result!
        }
        const validation_model = monaco.editor.createModel(
            wrap_user_code(props.initial_content ?? ""),
            "typescript"
        )

        // Sync changes from visible editor to validation model
        input_model.onDidChangeModelContent(() => {
            const user_code = input_model.getValue()
            validation_model.setValue(wrap_user_code(user_code))
        })

        // Listen for diagnostics on the validation model
        monaco.editor.onDidChangeMarkers(() => {
            const markers = monaco.editor.getModelMarkers({ resource: validation_model.uri })
            // Map marker positions back to user's code (subtract wrapper lines)
            const wrapper_line_offset = 1 // `(...function_args) => {` is line 1
            const wrapper_column_offset = 4 // because of the indentation
            const user_markers = markers.map(marker => ({
                ...marker,
                startLineNumber: marker.startLineNumber - wrapper_line_offset,
                endLineNumber: marker.endLineNumber - wrapper_line_offset,
                startColumn: marker.startColumn - wrapper_column_offset,
                endColumn: marker.endColumn - wrapper_column_offset,
            })).filter(marker => marker.startLineNumber > 0)

            // Set markers on the visible editor
            monaco.editor.setModelMarkers(input_model.getModel()!, "typescript", user_markers)
        })


        // function_arguments for auto-complete
        const function_args_for_auto_complete = (
            `// function args for auto-complete\n`
            + Object.entries(function_arguments).map(([_, arg]) =>
                deindent(`
                declare var ${arg.name}: any;
                `)
            ).join("\n")
            + "\n"
        )
        // This also removes any existing extraLibs
        monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
            content: function_args_for_auto_complete
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
            if (e.key !== "@") return
            e.preventDefault()

            // Find the word after the cursor
            const position = input_model.getPosition()
            if (!position) return
            const word_info = input_model.getModel()?.getWordAtPosition(position)
            const word_after_cursor = word_info?.word ?? ""

            pub_sub.pub("search_for_reference", {
                search_requester_id, search_term: word_after_cursor,
            })
        }
        dom_node.addEventListener("keydown", keydown_handler)


        return () =>
        {
            dom_node.removeEventListener("keydown", keydown_handler)
            validation_model.dispose()
            input_model.dispose()
            set_monaco_input_model(null)
        }
    }, [editor_ref.current, props.initial_content, props.editable])


    useEffect(() => pub_sub.sub("search_for_reference_completed", (data) =>
    {
        if (data.search_requester_id !== search_requester_id) return
        if (!monaco_input_model) return

        const position = monaco_input_model.getPosition()
        if (!position) return

        const word_info = monaco_input_model.getModel()?.getWordAtPosition(position)
        const range = word_info ? new monaco.Range(
            position.lineNumber,
            word_info.startColumn,
            position.lineNumber,
            word_info.endColumn
        ) : new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
        )


            // const content = function_args_for_auto_complete + Object.entries(map_of_components_by_ids).map(([id, component]) =>
            //     deindent(`
            //     /**
            //      * Component description here.
            //      *
            //      * https://wikisim.org/wiki/${id}
            //      */
            //     declare var ${component.name}: any; // ${id}
            //     `)
            // ).join("\n")
            // monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
            //     content
            // }])

            // const insert_at_cursor = map_of_components_by_ids["12v3"]!.name
            // const new_lines_count = 0

        // TODO make component title safe javascript identifier
        const component_title = data.data_component.title

        monaco_input_model.executeEdits("insert-ref-to-component", [{
            range,
            text: component_title,
            forceMoveMarkers: true,
        }])

        // Move cursor to end of inserted text
        const new_position = {
            lineNumber: position.lineNumber,
            column: range.startColumn + component_title.length,
        }
        monaco_input_model.setPosition(new_position)
        monaco_input_model.focus()
    }), [monaco_input_model, search_requester_id])


    // When on mobile, show help/context (such as JSDoc or hover info) when the
    // cursor is inside a token, not just on hover
    useEffect(() =>
    {
        if (!monaco_input_model || !is_mobile_device()) return

        const show_hover_on_cursor = () =>
        {
            monaco_input_model.trigger("keyboard", "editor.action.showHover", {})
        }

        // Listen for cursor position changes
        const disposable = monaco_input_model.onDidChangeCursorPosition(show_hover_on_cursor)

        return () => disposable.dispose()
    }, [monaco_input_model, is_mobile_device()])


    // Resize the editor when the window resizes
    useEffect(() =>
    {
        if (!monaco_input_model) return

        const handle_resize = () => monaco_input_model.layout()
        window.addEventListener("resize", handle_resize)

        return () => window.removeEventListener("resize", handle_resize)
    }, [monaco_input_model])


    // Add or remove height from editor_ref div style as more lines are added/removed
    useEffect(() =>
    {
        if (!monaco_input_model || !editor_ref.current) return

        const update_height = () =>
        {
            const raw_line_count = monaco_input_model.getModel()?.getLineCount()
            const line_count = clamp(raw_line_count ?? 1, 8, 20)
            console.log("Updating height", line_count)
            const line_height = monaco_input_model.getOption(monaco.editor.EditorOption.lineHeight)
            const height = line_count * line_height + 20 // +20 for some padding
            editor_ref.current!.style.height = `${height}px`
            monaco_input_model.layout()
        }

        update_height() // Initial height set

        const disposable = monaco_input_model.onDidChangeModelContent(update_height)

        return () => disposable.dispose()
    }, [monaco_input_model, editor_ref.current])


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


function get_rulers(): number[]
{
    // [45, 80] works well for mobile and desktop
    // localStorage.setItem("preferred_editor_ruler_columns", "45,80")
    return localStorage.getItem("preferred_editor_ruler_columns")?.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)) ?? []
}
