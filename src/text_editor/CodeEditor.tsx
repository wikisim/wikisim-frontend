import * as monaco from "monaco-editor"
import { MutableRef, useEffect, useMemo, useRef, useState } from "preact/hooks"
type MonacoEditor = monaco.editor.IStandaloneCodeEditor
type ITextModel = monaco.editor.ITextModel

import { extract_ids_from_text } from "core/data/id"
import { DataComponent, DataComponentsById, FunctionArgument } from "core/data/interface"
import { to_javascript_identifier } from "core/data/to_javascript_identifier"
import { format_function_input_value_string } from "core/evaluator/format_function"
import { get_global_js_lines, upsert_js_component_const } from "core/rich_text/get_global_js_lines"

import pub_sub from "../pub_sub"
import { RootAppState } from "../state/interface"
import { local_storage } from "../state/local_storage"
import { app_store } from "../state/store"
import { is_mobile_device } from "../utils/is_mobile_device"
import "./CodeEditor.css"
import { omit_or_truncate_long_code_string } from "./omit_or_truncate_long_code_string"


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
    function_arguments: FunctionArgument[] | undefined
    // single_line?: boolean
    auto_focus?: boolean
    on_update?: (text: string) => void
    label?: string
    // invalid_value?: false | string
    // include_version_in_at_mention?: boolean
    // experimental_code_editor_features?: boolean
}
export function CodeEditor(props: CodeEditorProps)
{
    const [is_focused, set_is_focused] = useState(props.auto_focus ?? false)
    const [value, set_value] = useState(props.initial_content)

    const on_update = useMemo(() => (value: string) =>
    {
        set_value(value)
        props.on_update?.(value)
    }, [props.on_update])

    if (!props.editable)
    {
        if (!props.initial_content) return null
        // Just return the code content as preformatted text
        const wrapped = wrap_user_code(props.function_arguments, props.initial_content)
        const truncated = omit_or_truncate_long_code_string(wrapped)

        return <div
            style={{
                maxWidth: "var(--max-column-width)",
                padding: "0 var(--width-for-fixed-buttons) 0 var(--hgap-large)",
            }}
        >
            <pre className="code-editor-container non-editable">
                {truncated}
            </pre>
        </div>
    }


    return <div
        style={{
            // Known issue where if the window width is increase, the Monaco editor
            // will resize to fill it but when the window width is shrunk again
            // then the Monaco editor will not shrink again.  Refreshing the page
            // of the smaller window will make it fit again.  Won't fix this for now.
            maxWidth: "var(--max-column-width)",
            // padding: "0 var(--width-for-fixed-buttons) 0 var(--hgap-large)",
        }}
    >
        <div className={
            "code-editor-container"
            + (is_focused ? " is_focused" : "")
            + (value && value.length > 0 ? " has_value" : "")
            // + (props.invalid_value ? " invalid_value" : "")
        }>
            <InnerCodeEditor
                initial_content={props.initial_content}
                function_arguments={props.function_arguments}
                on_update={on_update}

                // auto_focus={props.auto_focus}
                set_is_focused={set_is_focused}
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

    auto_focus?: boolean
    set_is_focused: (focused: boolean) => void
}
function InnerCodeEditor(props: InnerCodeEditorProps)
{
    // const initial_content_ref = useRef(props.initial_content)
    const editor_el_ref = useRef<HTMLDivElement | null>(null)
    const input_model_ref = useRef<MonacoEditor | null>(null)
    const validation_model_ref = useRef<ITextModel | null>(null)
    const disposable_sync_fns_ref = useRef<(() => void) | null>(null)
    const search_requester_id = useMemo(() => `code_editor_${Math.random().toString(36).substring(2, 15)}`, [])
    const [setup_or_refresh_part2, set_setup_or_force_refresh_part2] = useState({})


    const [data_component_dependencies_by_id, set_deps_by_id] = useState<DataComponentsById>({})
    const add_data_component_dependency = useMemo(() => (data_component: DataComponent) =>
    {
        set_deps_by_id(deps => {
            if (deps[data_component.id.to_str()]) return deps
            return { ...deps, [data_component.id.to_str()]: data_component }
        })
    }, [])


    const app_state = app_store()
    useEffect(() =>
    {
        load_dependencies(app_state, props.initial_content, add_data_component_dependency)

        const editor_dom_node = editor_el_ref.current
        if (!editor_dom_node) return

        const input_model = set_up_monaco_editor(input_model_ref, props.initial_content, editor_dom_node)
        const dispose_manage_scroll = enable_scroll_passthrough(input_model, editor_dom_node)

        // Create a hidden model for validation
        const validation_model = monaco.editor.createModel(
            wrap_user_code(props.function_arguments, props.initial_content),
            "typescript"
        )
        validation_model_ref.current = validation_model

        set_setup_or_force_refresh_part2({})

        const keydown_handler = factory_handle_keydown_and_trigger_search_modal(input_model, search_requester_id)
        editor_dom_node.addEventListener("keydown", keydown_handler)

        const unsub_search_modal_result = handle_search_modal_result(
            input_model,
            search_requester_id,
            add_data_component_dependency
        )
        const dispose_focus = handle_focus_blur_events(editor_dom_node, input_model, props.auto_focus, props.set_is_focused)
        const dispose_hover_tips_mobile = show_hover_tips_on_mobile_cursor(input_model)
        const dispose_resize = resize_editor_on_window_resize(input_model)
        const dispose_update_height = update_height_to_match_content(input_model, editor_dom_node)

        return () =>
        {
            dispose_manage_scroll()
            input_model.dispose()
            validation_model.dispose()
            editor_dom_node.removeEventListener("keydown", keydown_handler)
            dispose_focus()
            unsub_search_modal_result()
            dispose_hover_tips_mobile?.()
            dispose_resize()
            dispose_update_height()
        }
    }, [])


    useEffect(() =>
    {
        if (!input_model_ref.current || !validation_model_ref.current) return

        const disposable_sync_fns = upsert_change_and_sync_handler(
            disposable_sync_fns_ref,
            input_model_ref.current,
            validation_model_ref.current,
            props.function_arguments ?? [],
            props.on_update
        )

        update_available_globals(data_component_dependencies_by_id, props.function_arguments ?? [])

        return disposable_sync_fns
    }, [setup_or_refresh_part2, data_component_dependencies_by_id, props.function_arguments])

    // console .log("Rendering InnerCodeEditor")

    return useMemo(() => <div ref={editor_el_ref} style={{ height: 400 }} />, [])
}


function load_dependencies(app_state: RootAppState, initial_content: string, add_data_component_dependency: (data_component: DataComponent) => void)
{
    const ids = extract_ids_from_text(initial_content)

    ids.forEach(id_and_version =>
    {
        const ref_component = app_state.data_components.data_component_by_id_and_maybe_version[id_and_version.to_str()]
        if (!ref_component || !ref_component.component) return
        add_data_component_dependency(ref_component.component)
    })
}


function enable_scroll_passthrough(input_model: MonacoEditor, editor_dom_node: HTMLDivElement)
{
    let last_scroll_top = input_model.getScrollTop()

    const handle_scroll = (_: monaco.IScrollEvent) =>
    {
        const editor_rect = editor_dom_node.getBoundingClientRect()
        const scroll_top = input_model.getScrollTop()
        const scroll_height = input_model.getScrollHeight()
        const visible_height = editor_dom_node.clientHeight

        // Determine scroll direction
        const scroll_delta = scroll_top - last_scroll_top
        last_scroll_top = scroll_top

        const is_scrolling_down = scroll_delta > 0
        const is_scrolling_up = scroll_delta < 0

        // Check if editor top is within 20px of window top
        const editor_near_top = editor_rect.top > 20
        // Check if editor bottom is within 20px of window bottom
        const editor_near_bottom = editor_rect.bottom < (window.innerHeight - 20)

        // Check if at scroll boundaries
        const at_scroll_top = scroll_top <= 0
        const at_scroll_bottom = scroll_top + visible_height >= scroll_height - 1

        let should_scroll_main_window = false

        if (is_scrolling_down)
        {
            // Scroll main window (down) if scrolling down AND
            // * editor top is not near main window top
            //   OR
            // * if at bottom of editor scroll (but see note below, this is not
            //   working yet)
            should_scroll_main_window = editor_near_top || at_scroll_bottom
        }
        else if (is_scrolling_up)
        {
            // Scroll main window (up) if scrolling up AND
            // * editor bottom is not near main window bottom
            //   OR
            // * if at top of editor scroll (but see note below, this is not
            //   working yet)
            should_scroll_main_window = editor_near_bottom || at_scroll_top
        }

        if (should_scroll_main_window)
        {
            // Only the monaco editor's scroll emits events, the editor_dom_node's
            // document do not emit scroll events.  When the scroll in the editor
            // has reached the top or bottom no more scroll events are emitted,
            // this function is not called, so it is not possible to
            // apply the scroll to the main window to keep scrolling (and move
            // the CodeEditor out of the main window view).
            window.scrollBy(0, scroll_delta)
            // A potential solution would be to put a transparent div over the
            // editor that would capture scroll events and allow other pointer
            // and mouse events to pass through to the editor below.
        }
    }

    const disposable_scroll = input_model.onDidScrollChange(handle_scroll)

    return () => disposable_scroll.dispose()
}


function set_up_monaco_editor(input_model_ref: React.RefObject<MonacoEditor | null>, initial_content: string, editor_el: HTMLDivElement): MonacoEditor
{
    // console .log("Setting up monaco editor")

    input_model_ref.current?.dispose()
    input_model_ref.current = monaco.editor.create(editor_el, {
        value: initial_content,
        language: "typescript",
        lineNumbers: "off",
        minimap: { enabled: false },
        wordWrap: "on",
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
    input_editor: MonacoEditor,
    validation_model: ITextModel,
    function_arguments: FunctionArgument[],
    on_update: ((text: string) => void) | undefined)
{
    // console .log("Upserting change and sync handler")

    disposable_sync_fns_ref.current?.()
    disposable_sync_fns_ref.current = null

    // Sync changes from props.function_arguments and visible editor to validation model
    function sync_validation_model()
    {
        const user_code = input_editor.getValue()
        const wrapped_code = wrap_user_code(function_arguments, user_code)
        validation_model.setValue(wrapped_code)
        on_update?.(user_code)
    }
    const disposable_on_change_modal_content = input_editor.onDidChangeModelContent(sync_validation_model)

    let previous_input_model_markers: monaco.editor.IMarker[] | undefined = undefined
    let previous_validation_markers: monaco.editor.IMarker[] | undefined = undefined

    function respond_to_change_in_markers(force?: boolean)
    {
        const input_model = input_editor.getModel()
        const new_input_model_markers = input_model ? monaco.editor.getModelMarkers({ resource: input_model.uri }) : undefined
        const new_validation_markers = monaco.editor.getModelMarkers({ resource: validation_model.uri })

        const changed_input_model_markers = markers_changed(previous_input_model_markers, new_input_model_markers)
        const changed_validation_markers = markers_changed(previous_validation_markers, new_validation_markers)

        if (!changed_validation_markers && !changed_input_model_markers && !force) return
        previous_input_model_markers = new_input_model_markers
        previous_validation_markers = new_validation_markers

        const input_value_lines = input_editor.getValue().trim().split("\n")
        const last_line = input_value_lines.last() ?? ""
        const last_line_starts_with_return = last_line.trim().startsWith("return ")

        // Map marker positions back to user's code (subtract wrapper lines and indentation)
        // `(...function_args) => {` is line 1
        const wrapper_line_offset = 1
        // +4 because of the indentation
        const wrapper_column_offset = 4

        const adjusted_markers = new_validation_markers.map(marker =>
        {
            const remove_return_offset = (line_number: number) =>
            {
                // +7 if the last line doesn't start with "return " because it
                // will be added automatically inside the format_function_input_value_string
                return (!last_line_starts_with_return && line_number === input_value_lines.length) ? 7 : 0
            }

            const startLineNumber = marker.startLineNumber - wrapper_line_offset
            const endLineNumber = marker.endLineNumber - wrapper_line_offset
            return {
                ...marker,
                startLineNumber,
                endLineNumber,
                startColumn: marker.startColumn - wrapper_column_offset - remove_return_offset(startLineNumber),
                endColumn: marker.endColumn - wrapper_column_offset - remove_return_offset(endLineNumber),
            }
        }).filter(marker => marker.startLineNumber > 0)

        // Set markers on the visible editor
        monaco.editor.setModelMarkers(input_editor.getModel()!, "typescript", adjusted_markers)
    }
    // Listen for diagnostics on the validation model
    const disposable_on_change_markers = monaco.editor.onDidChangeMarkers(() => respond_to_change_in_markers())

    // Now trigger an initial sync
    sync_validation_model()
    // Total fudge to try to ensure stale markers from input_model are
    // overwritten by correct markers from validation_model.  If these are not
    // used and you go to https://wikisim.org/edit/1021 (of version6 as of
    // writing this), then when you first view the input_value in this CodeEditor
    // there may be 2 errors for the `return` statements saying
    //      "A 'return' statement can only be used within a function body.(1108)"
    // This error is reproducible on local but only if you close the section and
    // reopen it: that should cause this element to be unmounted and remounted
    // and there must be some state somewhere.
    // setTimeout(() => respond_to_change_in_markers(true), 100)
    // setTimeout(() => respond_to_change_in_markers(true), 500)
    // setTimeout(() => respond_to_change_in_markers(true), 2000)

    function disposable_sync_fns()
    {
        disposable_on_change_modal_content.dispose()
        disposable_on_change_markers.dispose()
    }
    disposable_sync_fns_ref.current = disposable_sync_fns
    return disposable_sync_fns
}


function update_available_globals(data_component_dependencies_by_id: DataComponentsById, function_arguments: FunctionArgument[])
{
    const content = get_global_js_lines(data_component_dependencies_by_id, function_arguments).join("\n")

    // This also removes any existing extraLibs but will apply globally to all
    // editors.  Not ideal but for now I can't find a simple way to isolate the
    // editors / text models from each other.
    monaco.languages.typescript.typescriptDefaults.setExtraLibs([{
        content
    }])
}


function factory_handle_keydown_and_trigger_search_modal(input_model: MonacoEditor, search_requester_id: string)
{
    return (e: KeyboardEvent) =>
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
}


function handle_search_modal_result(input_model: MonacoEditor, search_requester_id: string, add_data_component_dependency: (data_component: DataComponent) => void)
{
    const unsub = pub_sub.sub("search_for_reference_completed", (data) =>
    {
        if (data.search_requester_id !== search_requester_id) return

        const position = input_model.getPosition()
        if (!position) return

        const word_info = input_model.getModel()?.getWordAtPosition(position)
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

        const safe_component_title_ref = to_javascript_identifier(data.data_component)

        input_model.executeEdits("insert-ref-to-component", [{
            range,
            text: safe_component_title_ref,
            forceMoveMarkers: true,
        }])

        // Move cursor to end of inserted text
        const new_position = {
            lineNumber: position.lineNumber,
            column: range.startColumn + safe_component_title_ref.length,
        }
        input_model.setPosition(new_position)
        input_model.focus()

        // For now we add the data component as a dependency directly to the top
        // of the code.  In future we could add this to another field to keep it
        // out of the way and keep the experience cleaner and closer to what we
        // currently have with the TipTap TextEditorV2
        const current_value = input_model.getValue()
        const new_value = upsert_js_component_const(data.data_component, current_value)
        if (new_value !== current_value) input_model.setValue(new_value)

        add_data_component_dependency(data.data_component)
    })

    return unsub
}


function handle_focus_blur_events(
    editor_dom_node: HTMLDivElement,
    input_model: MonacoEditor,
    auto_focus: boolean | undefined,
    set_is_focused: (focused: boolean) => void
)
{
    const focus_handler = () => set_is_focused(true)
    const blur_handler = () => set_is_focused(false)

    editor_dom_node.addEventListener("focusin", focus_handler)
    editor_dom_node.addEventListener("focusout", blur_handler)

    if (auto_focus)
    {
        input_model.focus()
        set_is_focused(true) // Ensure this is in sync with state
    }

    return () => {
        editor_dom_node.removeEventListener("focusin", focus_handler)
        editor_dom_node.removeEventListener("focusout", blur_handler)
    }
}


function show_hover_tips_on_mobile_cursor(input_model: MonacoEditor)
{
    // When on mobile, show help/context (such as JSDoc or hover info) when the
    // cursor is inside a token, not just on hover
    if (!is_mobile_device()) return

    const show_hover_on_cursor = () =>
    {
        input_model.trigger("keyboard", "editor.action.showHover", {})
    }

    // Listen for cursor position changes
    const disposable = input_model.onDidChangeCursorPosition(show_hover_on_cursor)

    return () => disposable.dispose()
}


function resize_editor_on_window_resize(input_model: MonacoEditor)
{
    // Resize the editor when the window resizes
    const handle_resize = () => input_model.layout()
    window.addEventListener("resize", handle_resize)

    return () => window.removeEventListener("resize", handle_resize)
}


function update_height_to_match_content(monaco_input_model: MonacoEditor, editor_dom_node: HTMLDivElement)
{
    // Add or remove height from editor_ref div style as more lines are added/removed
    const update_height = () =>
    {
        const raw_line_count = monaco_input_model.getModel()?.getLineCount()
        const line_count = Math.min(raw_line_count ?? 1, is_mobile_device() ? 20 : 32) //: (raw_line_count ?? 1)
        const line_height = monaco_input_model.getOption(monaco.editor.EditorOption.lineHeight)
        const height = line_count * line_height + 20 // +20 for some padding
        editor_dom_node.style.height = `${height}px`
        monaco_input_model.layout()
    }
    update_height() // Initial height set

    const disposable = monaco_input_model.onDidChangeModelContent(update_height)

    return () => disposable.dispose()
}


function wrap_user_code(function_arguments: FunctionArgument[] | undefined, user_code: string)
{
    return format_function_input_value_string({
        js_input_value: user_code,
        function_arguments: function_arguments ?? [],
    })
}


function markers_changed(old_markers: monaco.editor.IMarker[] | undefined, new_markers: monaco.editor.IMarker[] | undefined)
{
    if (!old_markers) return !!new_markers
    else if (!new_markers) return true

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
    return local_storage.get_preferred_editor_ruler_columns()
}
