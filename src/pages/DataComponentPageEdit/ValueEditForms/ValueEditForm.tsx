import { useCallback, useEffect, useMemo, useState } from "preact/hooks"

import { DEFAULTS } from "core/data/defaults"
import { valid_value_number_display_type } from "core/data/field_values_with_defaults"
import {
    format_data_component_value_to_string,
} from "core/data/format/format_data_component_value_to_string"
import { format_number_to_string } from "core/data/format/format_number_to_string"
import {
    DataComponent,
    NewDataComponent,
    NUMBER_DISPLAY_TYPES
} from "core/data/interface"
import { calc_function_arguments_errors } from "core/data/is_data_component_invalid"
import { calculate_result_value } from "core/evaluator"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { browser_convert_tiptap_to_javascript } from "core/rich_text/browser_convert_tiptap_to_javascript"
import { convert_text_type } from "core/rich_text/convert_text_type"
import { determine_input_value_text_type } from "core/rich_text/determine_text_type"

import { local_storage } from "../../../state/local_storage"
import { app_store } from "../../../state/store"
import { CodeEditor } from "../../../text_editor/CodeEditor"
import { omit_or_truncate_long_code_string } from "../../../text_editor/omit_or_truncate_long_code_string"
import { TextDisplayOnlyV1 } from "../../../text_editor/TextDisplayOnlyV1"
import { TextEditorV1 } from "../../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../../text_editor/TextEditorV2"
import { ValueTypeDropdown } from "../../../ui_components/data_component/ValueTypeDropdown"
import { ErrorMessage } from "../../../ui_components/info_and_errors/ErrorMessage"
import OpenCloseSection from "../../../ui_components/OpenCloseSection"
import { Select } from "../../../ui_components/Select"
import { ToggleTwo } from "../../../ui_components/ToggleTwo"
import { load_referenced_data_components } from "../../../ui_components/utils/load_referenced_data_components"
import { debounce } from "../../../utils/debounce"
import { FunctionInputsForm } from "../FunctionInputsForm"
import { UpdatesFnOrValue } from "../interface"
import { ScenariosForm } from "../ScenariosForm/ScenariosForm"
import "./ValueEditForm.css"


interface ValueEditorFormProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: UpdatesFnOrValue, compare_meta_fields?: boolean) => void
}
export function ValueEditorForm(props: ValueEditorFormProps)
{
    const { draft_component, on_change } = props

    if (draft_component.value_type === "interactable") return null

    const state = app_store()
    const [opened, set_opened] = useState(false)
    const [evaluation_error, set_evaluation_error] = useState<string>()

    const async_loading_referenced_data_components = load_referenced_data_components(state, draft_component)

    useEffect(() =>
    {
        if (async_loading_referenced_data_components.status !== "loaded") return

        let component = { ...draft_component }
        // If the dependencies have changed, update them
        if (JSON.stringify(draft_component.recursive_dependency_ids) !== JSON.stringify(async_loading_referenced_data_components.referenced_data_component_ids))
        {
            on_change({ recursive_dependency_ids: async_loading_referenced_data_components.referenced_data_component_ids })
            // Modify in place to
            component.recursive_dependency_ids = async_loading_referenced_data_components.referenced_data_component_ids
        }


        const data_components_by_id_and_version = async_loading_referenced_data_components.referenced_data_components_by_id_str

        calculate_result_value({
            component,
            data_components_by_id_and_version,
            convert_tiptap_to_javascript: browser_convert_tiptap_to_javascript,
            evaluate_code_in_sandbox: evaluate_code_in_browser_sandbox,
        })
        .then(response =>
        {
            if (!response) return
            if (response.error)
            {
                console.error("Error calculating result value:", response.error, "\nInput value:", response.js_input_value)
                set_evaluation_error(response.error)
                return
            }
            // console .debug("Calculated result value:", response.result, "\nInput value:", response.js_input_value)
            const result_value = response.result || undefined
            on_change({ result_value })
            set_evaluation_error(undefined)
        })
        .catch(e => { throw e })
    }, [async_loading_referenced_data_components.status, draft_component.input_value, draft_component.value_type, draft_component.function_arguments])

    const function_argument_error = calc_function_arguments_errors(draft_component.function_arguments).error
    const error = async_loading_referenced_data_components.error || evaluation_error || function_argument_error

    const formatted_value = format_data_component_value_to_string(draft_component)

    const debounced_handle_update_input_value = useCallback(debounce((value: string) =>
    {
        const input_value = value.trim() || undefined
        on_change({ input_value })
    }, 1000)
    , [on_change])

    useEffect(() => () =>
    {
        debounced_handle_update_input_value.commit()
    }, [debounced_handle_update_input_value])

    const value_type = draft_component.value_type || DEFAULTS.value_type
    const value_type_is_number = value_type === "number"
    const value_type_is_function = value_type === "function"
    // const value_type_is_interactable = value_type === "interactable"
    const show_units = value_type_is_number


    // Allow user to swap from TipTap editor to Monaco code editor
    const text_type = determine_input_value_text_type(draft_component.input_value || "")
    const [use_code_editor, _set_use_code_editor] = useState(() => text_type === "typescript")
    const set_use_code_editor = useMemo(() => (use: boolean) =>
    {
        debounced_handle_update_input_value.commit() // Commit any outstanding changes

        on_change(({ input_value }) =>
        {
            _set_use_code_editor(use)
            const converted_input_value = convert_text_type(input_value || "", use ? "typescript" : "tiptap")
            return { input_value: converted_input_value }
        })
    }, [])


    return <>
        <div className={`value-editor-container column ${opened ? "opened" : ""}`}>
            <div className="data-component-form-column component-ids-should-have-versions">
                <div
                    className="row"
                    onPointerDown={() => set_opened(!opened)}
                >
                    <div style={{ flexGrow: 1 }}>
                        <TextDisplayOnlyV1
                            label="Value"
                            value={opened ? omit_or_truncate_long_code_string(formatted_value) : formatted_value}
                        />
                    </div>

                    <OpenCloseSection opened={opened} />
                </div>

                <ErrorMessage show={!!error} message={error} />

                <div class="vertical-gap" />

                {opened && <>
                    {use_code_editor
                    ? <CodeEditor
                        label={value_type_is_number ? "Input Value" : "Function"}
                        initial_content={draft_component.input_value || ""}
                        function_arguments={draft_component.function_arguments}
                        on_update={debounced_handle_update_input_value}
                        editable={true}
                        auto_focus={true}
                    />
                    : <TextEditorV2
                        label={value_type_is_number ? "Input Value" : "Function"}
                        initial_content={draft_component.input_value ?? ""}
                        on_update={debounced_handle_update_input_value}
                        single_line={false}
                        editable={true}
                        auto_focus={true}
                        include_version_in_at_mention={true}
                        experimental_code_editor_features={true}
                    />}

                    {local_storage.get_show_option_for_code_editor() && <ToggleTwo
                        label={active => active ? "Code Editor" : "Rich Text Editor"}
                        active={use_code_editor}
                        set_active={set_use_code_editor}
                        style={{ padding: "4px 8px" }}
                    />}

                    {show_units && <TextEditorV1
                        label="Units"
                        initial_content={draft_component.units ?? ""}
                        on_change={e =>
                        {
                            let units = e.currentTarget.value.trim() || undefined
                            // This was a convenience feature but it behaves very poorly in practice
                            // as users might want to enter "£ per item" or "$ / year" etc.
                            // And these would be incorrectly modified to "£_per_item" or "$_/_year".
                            // units = units?.replaceAll(" ", "_") // Replace spaces with underscores
                            on_change({ units })
                        }}
                        single_line={true}
                        editable={true}
                    />}

                    <div className="vertical-gap" />

                    {value_type_is_number && <div className="row">
                        <TextEditorV1
                            className="sig-figs"
                            label="Sig. figs."
                            initial_content={`${draft_component.value_number_sig_figs ?? DEFAULTS.value_number_sig_figs}`}
                            on_change={e =>
                            {
                                const value_number_sig_figs = e.currentTarget.value.trim()
                                let num = parseInt(value_number_sig_figs, 10)
                                if (isNaN(num))
                                {
                                    on_change({ value_number_sig_figs: undefined })
                                    return
                                }
                                num = Math.max(0, num)
                                on_change({ value_number_sig_figs: num })
                            }}
                            single_line={true}
                            editable={true}
                        />

                        <Select
                            label="Format"
                            data={format_options(draft_component)}
                            size="md"
                            style={{ width: 200 }}
                            value={valid_value_number_display_type(draft_component.value_number_display_type)}
                            onChange={value =>
                            {
                                const value_number_display_type = valid_value_number_display_type(value)
                                on_change({ value_number_display_type })
                            }}
                        />
                    </div>}

                </>}
            </div>

            {opened && value_type_is_function && <>
                <FunctionInputsForm draft_component={draft_component} on_change={on_change} />
                <ScenariosForm component={draft_component} on_change={on_change} />
            </>}

            {opened && <div className="data-component-form-column">
                <div className="vertical-gap" />

                <ValueTypeDropdown
                    draft_component={draft_component}
                    on_change={on_change}
                />
            </div>}

        </div>
    </>
}


// const READABLE_NUMBER_DISPLAY_TYPES: Record<NumberDisplayType, string> = {
//     bare: "Plain",
//     simple: "Commas",
//     scaled: "Worded",
//     abbreviated_scaled: "Compact",
//     percentage: "Percentage",
//     scientific: "Scientific",
// }
function format_options(_data_component: DataComponent | NewDataComponent)
{
    // const { value = "1230.5", value_number_sig_figs = 2 } = data_component

    // const value_as_number = parseFloat(value)

    return NUMBER_DISPLAY_TYPES.map(type =>
    {
        // const label_str = format_number_to_string(value_as_number, value_number_sig_figs, type)
        // const readable_type = READABLE_NUMBER_DISPLAY_TYPES[type]
        // const label = `${label_str} (${readable_type} e.g. ${format_number_to_string(1230.5, value_number_sig_figs, type)})`
        const label = `${format_number_to_string(1230.5, 3, type)}`
        return ({ value: type, label })
    })
}
