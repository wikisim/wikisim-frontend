import { useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"
import { changes_made } from "core/data/modify"

import EditButton from "../../buttons/EditButton"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import "./DataComponentEditForm.css"
import { SavingModal } from "./SavingModal"


interface DataComponentEditFormProps
{
    data_component: DataComponent
}
export function DataComponentEditForm(props: DataComponentEditFormProps)
{
    const { data_component: component } = props

    const [show_saving_modal, set_show_saving_modal] = useState(false)
    const [draft_component, _set_draft_component] = useState<DataComponent>({
        ...component,
        comment: "",
        version_type: undefined, // Default to a normal change
    })
    const set_draft_component = (updates: Partial<DataComponent>, compare_meta_fields?: boolean) =>
    {
        const new_draft: DataComponent = { ...draft_component, ...updates }
        if (!changes_made(new_draft, draft_component, compare_meta_fields)) return
        _set_draft_component(new_draft)
    }

    const no_changes_made = !changes_made(draft_component, component)
    const saving_in_progress = status === "saving"
    const disabled = (
        saving_in_progress ? "Saving..." :
        no_changes_made ? "No changes made" : false
    )
    const editable = !saving_in_progress

    return (
        <div className="page-container">
            <div style={{ float: "right", width: "50px", height: "50px" }} />
            <div style={{ position: "fixed", top: "50px", right: "30px" }}>
                <EditButton
                    disabled={disabled}
                    editing={true}
                    set_editing={() => set_show_saving_modal(true)}
                />
            </div>

            <div className={"data-component-form " + (editable ? "editable" : "view-only")}>
                <TextEditorV2
                    editable={editable}
                    initial_content={component.title}
                    single_line={true}
                    on_update={title => set_draft_component({ title })}
                    label={"Title" + (saving_in_progress ? " saving..." : "")}
                />

                <TextEditorV2
                    editable={editable}
                    initial_content={component.description}
                    single_line={false}
                    on_update={description => set_draft_component({ description })}
                    label={"Description" + (saving_in_progress ? " saving..." : "")}
                />
            </div>

            <SavingModal
                opened={show_saving_modal}
                draft_data_component={draft_component}
                update_draft_data_component={set_draft_component}
                hide_saving_modal={() => set_show_saving_modal(false)}
            />
        </div>
    )
}
