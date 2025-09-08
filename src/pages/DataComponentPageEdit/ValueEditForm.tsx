import { ActionIcon } from "@mantine/core"
import IconCaretDownFilled from "@tabler/icons-react/dist/esm/icons/IconCaretDownFilled"
import IconCaretUpFilled from "@tabler/icons-react/dist/esm/icons/IconCaretUpFilled"
import { useEffect, useState } from "preact/hooks"

import { DEFAULTS } from "core/data/defaults"
import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { format_number_to_string } from "core/data/format/format_number_to_string"
import {
    DataComponent,
    NewDataComponent,
    NUMBER_DISPLAY_TYPES,
    NUMBER_DISPLAY_TYPES_OBJ,
    NumberDisplayType,
    VALUE_TYPES,
    ValueType,
} from "core/data/interface"
import { browser_convert_tiptap_to_javascript } from "core/rich_text/browser_convert_tiptap_to_javascript"

import { calc_function_arguments_errors } from "../../../lib/core/src/data/is_data_component_invalid"
import { evaluate_input_value_string } from "../../evaluator"
import { TextDisplayOnlyV1 } from "../../text_editor/TextDisplayOnlyV1"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import { ErrorMessage } from "../../ui_components/ErrorMessage"
import { Select } from "../../ui_components/Select"
import { to_sentence_case } from "../../utils/to_sentence_case"
import { FunctionInputsForm } from "./FunctionInputsForm"
import { ScenariosForm } from "./ScenariosForm"
import "./ValueEditForm.css"


interface ValueEditorProps
{
    data_component_by_id_and_version: Record<string, DataComponent>
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function ValueEditor(props: ValueEditorProps)
{
    const [opened, set_opened] = useState(false)
    const [evaluation_error, set_evaluation_error] = useState<string>()

    const { draft_component, on_change } = props

    const formatted_value = format_data_component_value_to_string(draft_component)

    useEffect(() =>
    {
        const { input_value, value_type, function_arguments } = draft_component
        if (!input_value) return
        const input_value_string = browser_convert_tiptap_to_javascript(input_value, props.data_component_by_id_and_version)

        evaluate_input_value_string({ value: input_value_string, value_type, function_arguments })
        .then(response =>
        {
            if (response.error)
            {
                console.error("Error calculating result value:", response.error, "\nInput value:", input_value_string)
                set_evaluation_error(response.error)
                return
            }
            console .debug("Calculated result value:", response.result, "\nInput value:", input_value_string)
            const result_value = response.result || undefined
            on_change({ result_value })
            set_evaluation_error(undefined)
        })
    }, [draft_component.input_value, draft_component.value_type, draft_component.function_arguments])

    const function_argument_error = calc_function_arguments_errors(draft_component.function_arguments).error
    const error = evaluation_error || function_argument_error

    const value_type = draft_component.value_type || DEFAULTS.value_type
    const value_type_is_number = value_type === "number"
    const value_type_is_function = value_type === "function"
    const show_units = value_type_is_number

    return <>
        <div className={`value-editor-container column ${opened ? "opened" : ""}`}>
            <div className="data-component-form-column">
                <div
                    className="row"
                    onPointerDown={() => set_opened(!opened)}
                >
                    <div style={{ flexGrow: 1 }}>
                        <TextDisplayOnlyV1
                            label="Value"
                            value={formatted_value}
                        />
                    </div>

                    <ActionIcon size="xl" variant="subtle" style={{ marginTop: 5 }}>
                        {opened ? <IconCaretUpFilled /> : <IconCaretDownFilled />}
                    </ActionIcon>
                </div>

                <ErrorMessage show={!!error} message={error ? `Error: ${error}` : ""} />

                <div class="vertical-gap" />

                {opened && <>
                    <TextEditorV2
                        label={value_type_is_number ? "Input Value" : "Function"}
                        initial_content={draft_component.input_value ?? ""}
                        on_update={value =>
                        {
                            const input_value = value.trim() || undefined
                            on_change({ input_value })
                        }}
                        single_line={false}
                        editable={true}
                        auto_focus={true}
                        include_version_in_at_mention={true}
                    />
                    {show_units && <TextEditorV1
                        label="Units"
                        initial_content={draft_component.units ?? ""}
                        on_change={e =>
                        {
                            let units = e.currentTarget.value.trim() || undefined
                            units = units?.replace(" ", "_") // Replace spaces with underscores
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
                                const value_number_display_type = valid_value_number_display_type(value as NumberDisplayType)
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

                <Select
                    label="Type"
                    data={value_type_options()}
                    size="md"
                    style={{ width: 200 }}
                    value={draft_component.value_type || DEFAULTS.value_type}
                    onChange={value =>
                    {
                        on_change({ value_type: value as ValueType })
                    }}
                />
            </div>}

        </div>
    </>
}


function valid_value_number_display_type(value_number_display_type: NumberDisplayType | undefined): NumberDisplayType
{
    if (!value_number_display_type || !(value_number_display_type in NUMBER_DISPLAY_TYPES_OBJ)) return DEFAULTS.value_number_display_type
    return value_number_display_type
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


function value_type_options()
{
    return VALUE_TYPES
    // For now, only allow number and function types
    .filter(type => type === "number" || type === "function")
    .map(type =>
    {
        return ({ value: type, label: to_sentence_case(type) })
    })
}
