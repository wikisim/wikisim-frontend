import { ActionIcon } from "@mantine/core"
import IconCaretDownFilled from "@tabler/icons-react/dist/esm/icons/IconCaretDownFilled"
import IconCaretUpFilled from "@tabler/icons-react/dist/esm/icons/IconCaretUpFilled"
import { useState } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"

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

    const handle_value_change = (value: string | undefined) =>
    {
        value = value?.trim() || undefined
        on_change({ ...draft_component, value })
    }

    const formatted_value = format_value(draft_component)

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
                    on_change={e => handle_value_change(e.currentTarget.value)}
                    single_line={true}
                    editable={true}
                    start_focused="focused_and_text_selected"
                />
                <TextEditorV1
                    label="Units"
                    initial_value={draft_component.units ?? ""}
                    on_change={e => (e.currentTarget.value)}
                    single_line={true}
                    editable={true}
                />
                <div className="row">
                    <TextEditorV1
                        className="sig-figs"
                        label="Sig. figs."
                        initial_value={`${draft_component.value_number_sig_figs ?? ""}`}
                        on_change={e => (e.currentTarget.value)}
                        single_line={true}
                        editable={true}
                    />
                    <TextEditorV1
                        className="format"
                        label="Format"
                        initial_value={draft_component.value_number_display_type ?? ""}
                        on_change={e => (e.currentTarget.value)}
                        single_line={true}
                        editable={true}
                    />
                </div>
            </>}

        </div>
    </>
}


function format_value(component: DataComponent | NewDataComponent): string
{
    if (component.value === undefined) return ""

    return component.value
}
