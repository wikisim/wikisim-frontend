import { ActionIcon, Select } from "@mantine/core"
import IconCaretDownFilled from "@tabler/icons-react/dist/esm/icons/IconCaretDownFilled"
import IconCaretUpFilled from "@tabler/icons-react/dist/esm/icons/IconCaretUpFilled"
import { useState } from "preact/hooks"

import { format_data_component_value_to_string } from "core/data/format/format_data_component_value_to_string"
import { format_number_to_string } from "core/data/format/format_number_to_string"
import { DataComponent, NewDataComponent, NUMBER_DISPLAY_TYPES, NUMBER_DISPLAY_TYPES_OBJ, NumberDisplayType } from "core/data/interface"

import { TextDisplayOnlyV1 } from "../../text_editor/TextDisplayOnlyV1"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import "./ValueEditForm.css"


interface ValueEditorProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: DataComponent | NewDataComponent) => void
}
export function ValueEditor(props: ValueEditorProps)
{
    const [opened, set_opened] = useState(false)

    const { draft_component, on_change } = props

    const formatted_value = format_data_component_value_to_string(draft_component)

    return <>
        <div className={`value-editor-container ${opened ? "opened" : ""}`}>
            <div
                className="row value-editor-header"
                onPointerDown={() => set_opened(!opened)}
            >
                <TextDisplayOnlyV1
                    label="Value"
                    value={formatted_value}
                    single_line={true}
                />

                <ActionIcon size="xl" variant="subtle" style={{ marginTop: 5 }}>
                    {opened ? <IconCaretUpFilled /> : <IconCaretDownFilled />}
                </ActionIcon>
            </div>

            {opened && <>
                <TextEditorV1
                    label="Numerical Value"
                    initial_value={draft_component.value ?? ""}
                    on_change={e =>
                    {
                        const value = e.currentTarget.value.trim() || undefined
                        on_change({ ...draft_component, value })
                    }}
                    single_line={true}
                    editable={true}
                    start_focused="focused_and_text_selected"
                />
                <TextEditorV1
                    label="Units"
                    initial_value={draft_component.units ?? ""}
                    on_change={e =>
                    {
                        const units = e.currentTarget.value.trim() || undefined
                        on_change({ ...draft_component, units })
                    }}
                    single_line={true}
                    editable={true}
                />
                <div className="row">
                    <TextEditorV1
                        className="sig-figs"
                        label="Sig. figs."
                        initial_value={`${draft_component.value_number_sig_figs ?? ""}`}
                        on_change={e =>
                        {
                            const value_number_sig_figs = e.currentTarget.value.trim()
                            let num = parseInt(value_number_sig_figs, 10)
                            if (isNaN(num))
                            {
                                on_change({ ...draft_component, value_number_sig_figs: undefined })
                                return
                            }
                            num = Math.max(0, num)
                            on_change({ ...draft_component, value_number_sig_figs: num })
                        }}
                        single_line={true}
                        editable={true}
                    />

                    <Select
                        data={format_options(draft_component)}
                        size="lg"
                        style={{ marginTop: 2 }}
                        value={valid_value_number_display_type(draft_component.value_number_display_type)}
                        onChange={value =>
                        {
                            const value_number_display_type = valid_value_number_display_type(value as NumberDisplayType)
                            on_change({ ...draft_component, value_number_display_type })
                        }}
                    />
                </div>
            </>}

        </div>
    </>
}


function valid_value_number_display_type(value_number_display_type: NumberDisplayType | undefined): NumberDisplayType
{
    if (!value_number_display_type || !(value_number_display_type in NUMBER_DISPLAY_TYPES_OBJ)) return "bare"
    return value_number_display_type
}


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

// const READABLE_NUMBER_DISPLAY_TYPES: Record<NumberDisplayType, string> = {
//     bare: "Plain",
//     simple: "Commas",
//     scaled: "Worded",
//     abbreviated_scaled: "Compact",
//     percentage: "Percentage",
//     scientific: "Scientific",
// }
