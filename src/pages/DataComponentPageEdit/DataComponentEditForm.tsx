import { useState } from "preact/hooks"

import type { IdAndVersion } from "core/data/id"
import type { DataComponent, NewDataComponent } from "core/data/interface"
import { changes_made } from "core/data/modify"

import EditButton from "../../buttons/EditButton"
import type { AsyncDataComponentStatus } from "../../state/data_components/interface"
import type { RootAppState } from "../../state/interface"
import { app_store } from "../../state/store"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import "./DataComponentEditForm.css"
import { SavingModal } from "./SavingModal"


interface DataComponentEditFormProps<V>
{
    async_status: AsyncDataComponentStatus
    data_component: V
    handle_save: (state: RootAppState, draft_data_component: V) => void
    on_save_success: (id: IdAndVersion) => void
}
export function DataComponentEditForm<V extends (DataComponent | NewDataComponent)>(props: DataComponentEditFormProps<V>)
{
    const state = app_store()

    const { id } = state.user_auth_session.session?.user || {}
    if (!id)
    {
        return <div className="page-container">
            <p>Please log in to edit this data component.</p>
        </div>
    }

    const { async_status: status, data_component: component } = props

    const [show_saving_modal, set_show_saving_modal] = useState(false)
    const [draft_component, _set_draft_component] = useState<V>({
        ...component,
        comment: "",
        version_type: undefined, // Default to a normal change
    })

    const set_draft_component = (updates: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) =>
    {
        const new_draft: V = { ...draft_component, ...updates }
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

    return <>
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
            handle_save={props.handle_save}
            hide_saving_modal={() => set_show_saving_modal(false)}
            on_save_success={props.on_save_success}
        />
    </>
}
