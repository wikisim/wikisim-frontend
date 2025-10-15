import * as monaco from "monaco-editor"
import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"
type MonacoEditor = monaco.editor.IStandaloneCodeEditor
type ITextModel = monaco.editor.ITextModel

import { FunctionArgument } from "../../lib/core/src/data/interface"
import { format_function_input_value_string } from "../../lib/core/src/evaluator/format_function"
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
    lib: ["esnext"], // Only include ESNext, exclude DOM
    // allowJs: true,
    // strict: false, // disables strict type-checking
    // noImplicitAny: false, // disables "implicitly has an any type" errors
})


interface CodeEditorProps
{
    editable: boolean
    initial_content: string
    value: string
    function_arguments: FunctionArgument[] | undefined
    // single_line?: boolean
    auto_focus?: boolean
    on_update?: (text: string) => void
    label?: string
    invalid_value?: false | string
    // include_version_in_at_mention?: boolean
    // experimental_code_editor_features?: boolean
}
export function CodeEditor(props: CodeEditorProps)
{
    const [is_focused, set_is_focused] = useState(props.auto_focus ?? false)

    if (!props.editable)
    {
        // Just return the content as preformatted text
        return <div
            style={{
                maxWidth: "var(--max-column-width)",
                padding: "0 var(--width-for-fixed-buttons) 0 var(--hgap-large)",
            }}
        >
            <pre className="code-editor-container non-editable">
                {props.initial_content}
            </pre>
        </div>
    }


    return <div
        style={{
            maxWidth: "var(--max-column-width)",
            padding: "0 var(--width-for-fixed-buttons) 0 var(--hgap-large)",
        }}
    >
        <div className={
            "code-editor-container"
            + (is_focused ? " is_focused" : "")
            + (props.value && props.value.length > 0 ? " has_value" : "")
            + (props.invalid_value ? " invalid_value" : "")
        }>
            <InnerCodeEditor
                initial_content={props.initial_content}
                function_arguments={props.function_arguments}
                on_update={props.on_update}
            />
            <label>{props.label}</label>
        </div>
    </div>
}


interface InnerCodeEditorProps
{
    initial_content: string
    function_arguments: FunctionArgument[] | undefined
    on_update?: (text: string) => void
}
function InnerCodeEditor(props: InnerCodeEditorProps)
{
    const initial_content_ref = useRef(props.initial_content)
    const editor_el_ref = useRef<HTMLDivElement | null>(null)
    const input_model_ref = useRef<MonacoEditor | null>(null)
    const validation_model_ref = useRef<ITextModel | null>(null)
    const disposable_sync_fns_ref = useRef<(() => void) | null>(null)
    const search_requester_id = useMemo(() => `code_editor_${Math.random().toString(36).substring(2, 15)}`, [props.initial_content])
    const [setup_or_refresh_part2, set_setup_or_force_refresh_part2] = useState({})


    if (initial_content_ref.current !== props.initial_content)
    {
        // Reset all the refs
        initial_content_ref.current = props.initial_content
        // update the input_model_ref with new value
        input_model_ref.current?.setValue(props.initial_content)
        // TODO trigger other required resets
    }


    useEffect(() =>
    {
        if (!editor_el_ref.current) return

        const input_model = set_up_monaco_editor(input_model_ref, props.initial_content, editor_el_ref.current)

        // Create a hidden model for validation
        const validation_model = monaco.editor.createModel(
            wrap_user_code(props.function_arguments, props.initial_content).result,
            "typescript"
        )
        validation_model_ref.current = validation_model

        set_setup_or_force_refresh_part2({})


        // // function_arguments for auto-complete
        // const function_args_for_auto_complete = (
        //     `// function args for auto-complete\n`
        //     + Object.entries(function_arguments).map(([_, arg]) =>
        //         deindent(`
        //         declare var ${arg.name}: any;
        //         `)
        //     ).join("\n")
        //     + "\n"
        // )
        // // This also removes any existing extraLibs
        // monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
        //     content: function_args_for_auto_complete
        // }])

        // const map_of_components_by_ids: Record<string, { name: string }> = {
        //     "12v3": { name: "clamp" },
        //     "45v6": { name: "lerp" },
        // }
        // const map_of_component_names_to_ids: Record<string, string> = {}
        // for (const [id, { name }] of Object.entries(map_of_components_by_ids))
        // {
        //     map_of_component_names_to_ids[name] = id
        // }

        // const dom_node = editor_ref.current
        // const keydown_handler = (e: KeyboardEvent) =>
        // {
        //     if (e.key !== "@") return
        //     e.preventDefault()

        //     // Find the word after the cursor
        //     const position = input_model.getPosition()
        //     if (!position) return
        //     const word_info = input_model.getModel()?.getWordAtPosition(position)
        //     const word_after_cursor = word_info?.word ?? ""

        //     pub_sub.pub("search_for_reference", {
        //         search_requester_id, search_term: word_after_cursor,
        //     })
        // }
        // dom_node.addEventListener("keydown", keydown_handler)


        // // Not sure this is the right way of doing this.  Feels buggy
        // if (props.auto_focus)
        // {
        //     setTimeout(() => {
        //         // input_model.focus()
        //         // set_is_focused(true) // Ensure this is in sync with state
        //     }, 10)
        // }


        return () =>
        {
            input_model.dispose()
            validation_model.dispose()
            // dom_node.removeEventListener("keydown", keydown_handler)
            // set_monaco_input_model(null)
        }
    }, [])


    useEffect(() =>
    {
        const input_model = input_model_ref.current
        const validation_model = validation_model_ref.current
        if (!input_model || !validation_model) return

        const disposable_sync_fns = upsert_change_and_sync_handler(
            disposable_sync_fns_ref,
            input_model,
            validation_model,
            props.function_arguments ?? [],
            props.on_update
        )
        return disposable_sync_fns
    }, [setup_or_refresh_part2, props.function_arguments])


    // useEffect(() => pub_sub.sub("search_for_reference_completed", (data) =>
    // {
    //     if (data.search_requester_id !== search_requester_id) return
    //     if (!monaco_input_model) return

    //     const position = monaco_input_model.getPosition()
    //     if (!position) return

    //     const word_info = monaco_input_model.getModel()?.getWordAtPosition(position)
    //     const range = word_info ? new monaco.Range(
    //         position.lineNumber,
    //         word_info.startColumn,
    //         position.lineNumber,
    //         word_info.endColumn
    //     ) : new monaco.Range(
    //         position.lineNumber,
    //         position.column,
    //         position.lineNumber,
    //         position.column
    //     )


    //         // const content = function_args_for_auto_complete + Object.entries(map_of_components_by_ids).map(([id, component]) =>
    //         //     deindent(`
    //         //     /**
    //         //      * Component description here.
    //         //      *
    //         //      * https://wikisim.org/wiki/${id}
    //         //      */
    //         //     declare var ${component.name}: any; // ${id}
    //         //     `)
    //         // ).join("\n")
    //         // monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
    //         //     content
    //         // }])

    //         // const insert_at_cursor = map_of_components_by_ids["12v3"]!.name
    //         // const new_lines_count = 0


    //     const safe_component_title_ref = to_javascript_reference(data.data_component)

    //     monaco_input_model.executeEdits("insert-ref-to-component", [{
    //         range,
    //         text: safe_component_title_ref,
    //         forceMoveMarkers: true,
    //     }])

    //     // Move cursor to end of inserted text
    //     const new_position = {
    //         lineNumber: position.lineNumber,
    //         column: range.startColumn + safe_component_title_ref.length,
    //     }
    //     monaco_input_model.setPosition(new_position)
    //     monaco_input_model.focus()
    // }), [monaco_input_model, search_requester_id])


    // // When on mobile, show help/context (such as JSDoc or hover info) when the
    // // cursor is inside a token, not just on hover
    // useEffect(() =>
    // {
    //     if (!monaco_input_model || !is_mobile_device()) return

    //     const show_hover_on_cursor = () =>
    //     {
    //         monaco_input_model.trigger("keyboard", "editor.action.showHover", {})
    //     }

    //     // Listen for cursor position changes
    //     const disposable = monaco_input_model.onDidChangeCursorPosition(show_hover_on_cursor)

    //     return () => disposable.dispose()
    // }, [monaco_input_model, is_mobile_device()])


    // // Resize the editor when the window resizes
    // useEffect(() =>
    // {
    //     if (!monaco_input_model) return

    //     const handle_resize = () => monaco_input_model.layout()
    //     window.addEventListener("resize", handle_resize)

    //     return () => window.removeEventListener("resize", handle_resize)
    // }, [monaco_input_model])


    // // Add or remove height from editor_ref div style as more lines are added/removed
    // useEffect(() =>
    // {
    //     if (!monaco_input_model || !editor_ref.current) return

    //     const update_height = () =>
    //     {
    //         const raw_line_count = monaco_input_model.getModel()?.getLineCount()
    //         const line_count = props.editable ? Math.min(raw_line_count ?? 1, 20): (raw_line_count ?? 1)
    //         const line_height = monaco_input_model.getOption(monaco.editor.EditorOption.lineHeight)
    //         const height = line_count * line_height + 20 // +20 for some padding
    //         editor_ref.current!.style.height = `${height}px`
    //         monaco_input_model.layout()
    //     }

    //     update_height() // Initial height set

    //     const disposable = monaco_input_model.onDidChangeModelContent(update_height)

    //     return () => disposable.dispose()
    // }, [monaco_input_model, editor_ref.current, props.editable])


    // // Focus/blur handling for styling
    // useEffect(() =>
    // {
    //     if (!editor_ref.current) return

    //     const focus_handler = () => set_is_focused(true)
    //     const blur_handler = () => set_is_focused(false)

    //     const dom_node = editor_ref.current
    //     dom_node.addEventListener("focusin", focus_handler)
    //     dom_node.addEventListener("focusout", blur_handler)

    //     return () => {
    //         dom_node.removeEventListener("focusin", focus_handler)
    //         dom_node.removeEventListener("focusout", blur_handler)
    //     }
    // }, [editor_ref.current])

    console.log("Rendering InnerCodeEditor")

    return useMemo(() => <div ref={editor_el_ref} style={{ height: 400 }} />, [])
}


function set_up_monaco_editor(input_model_ref: React.RefObject<MonacoEditor | null>, initial_content: string, editor_el: HTMLDivElement): MonacoEditor
{
    console.log("Setting up monaco editor")

    input_model_ref.current?.dispose()
    input_model_ref.current = monaco.editor.create(editor_el, {
        value: initial_content,
        language: "typescript",
        lineNumbers: "off",
        minimap: { enabled: false },
        wordWrap: "off",
        rulers: get_rulers(),
        scrollBeyondLastLine: false,
        readOnly: false,
        renderLineHighlight: "none",
        // Default size for editor is 12, and for page is 16, so using 14
        // makes it seem more like size 16.
        fontSize: 14,
        // Failed attempt to prevent warning from when failing to load
        // "Hiragino Kaku Gothic ProN"
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        glyphMargin: false, // hides the gutter icons
        folding: false,     // hides the folding controls
        lineDecorationsWidth: 0, // removes extra gutter space
    })

    return input_model_ref.current
}


function upsert_change_and_sync_handler(
    disposable_sync_fns_ref: MutableRef<(() => void) | null>,
    input_model: MonacoEditor,
    validation_model: ITextModel,
    function_arguments: FunctionArgument[],
    on_update: ((text: string) => void) | undefined)
{
    console.log("Upserting change and sync handler")

    disposable_sync_fns_ref.current?.()
    disposable_sync_fns_ref.current = null

    // Sync changes from props.function_arguments and visible editor to validation model
    function sync_validation_model()
    {
        const user_code = input_model.getValue()
        const wrapped_code = wrap_user_code(function_arguments, user_code)
        validation_model.setValue(wrapped_code.result)
        on_update?.(user_code)
    }
    const disposable_on_change_modal_content = input_model.onDidChangeModelContent(sync_validation_model)

    let previous_markers: monaco.editor.IMarker[] = []

    // Listen for diagnostics on the validation model
    const disposable_on_change_markers = monaco.editor.onDidChangeMarkers(() =>
    {
        const new_markers = monaco.editor.getModelMarkers({ resource: validation_model.uri })
        if (!markers_changed(previous_markers, new_markers)) return
        previous_markers = new_markers

        const validation_model_text = validation_model.getValue()
        const user_code = input_model.getValue()
        // wrapped_code.result! should be same as validation_model_text
        const wrapped_code = wrap_user_code(function_arguments, user_code)

        const is_multi_line = validation_model_text.includes("\n")
        // Map marker positions back to user's code (subtract wrapper lines and indentation)
        // `(...function_args) => {` is line 1 when multiline however will
        // be on line 0 when single line like: `(...function_args) => a + 1`
        const wrapper_line_offset = is_multi_line ? 1 : 0

        // +4 because of the indentation when multi-line
        // and when single line then +function_signature.length
        const wrapper_column_offset = is_multi_line ? 4 : wrapped_code.first_line_sans_body.length

        const adjusted_markers = new_markers.map(marker => ({
            ...marker,
            startLineNumber: marker.startLineNumber - wrapper_line_offset,
            endLineNumber: marker.endLineNumber - wrapper_line_offset,
            startColumn: marker.startColumn - wrapper_column_offset,
            endColumn: marker.endColumn - wrapper_column_offset,
        })).filter(marker => marker.startLineNumber > 0)

        // Set markers on the visible editor
        monaco.editor.setModelMarkers(input_model.getModel()!, "typescript", adjusted_markers)
    })

    // Now trigger an initial sync
    sync_validation_model()

    function disposable_sync_fns()
    {
        disposable_on_change_modal_content.dispose()
        disposable_on_change_markers.dispose()
    }
    disposable_sync_fns_ref.current = disposable_sync_fns
    return disposable_sync_fns
}


function wrap_user_code(function_arguments: FunctionArgument[] | undefined, user_code: string)
{
    return format_function_input_value_string({
        js_input_value: user_code,
        requested_at: Date.now(),
        function_arguments: function_arguments ?? [],
    })
}


function markers_changed(old_markers: monaco.editor.IMarker[], new_markers: monaco.editor.IMarker[])
{
    if (old_markers.length !== new_markers.length) return true
    for (let i = 0; i < old_markers.length; ++i)
    {
        const old_marker = old_markers[i]!
        const new_marker = new_markers[i]!
        const diff = JSON.stringify(old_marker) !== JSON.stringify(new_marker)
        if (diff) return true
    }
    return false
}


function get_rulers(): number[]
{
    // [45, 80] works well for mobile and desktop
    // localStorage.setItem("preferred_editor_ruler_columns", "45,80")
    return localStorage.getItem("preferred_editor_ruler_columns")?.split(",").map(s => parseInt(s)).filter(n => !isNaN(n)) ?? []
}
