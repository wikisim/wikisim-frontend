import { useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"
import { changes_made } from "core/data/modify"

import { Button, Checkbox, Modal } from "@mantine/core"
import EditButton from "../buttons/EditButton"
import { get_async_data_component } from "../state/data_components/accessor"
import { app_store } from "../state/store"
import { TextEditorV2 } from "../text_editor/TextEditorV2"
import Loading from "../ui_components/Loading"
import "./DataComponentPageEdit.css"


export function DataComponentPageEdit(props: { data_component_id: string, query: Record<string, string> })
{
    const state = app_store()
    const async_data_component = get_async_data_component(state, props.data_component_id)
    const { component, status } = async_data_component

    if (!component)
    {
        return <div className="page-container">
            {status === "loading" ? <div>Loading data component<Loading/></div>
            : status === "error" ? <div>Error loading data component.</div>
            : <div>Data component not found.</div>}
        </div>
    }

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
                set_show_saving_modal={set_show_saving_modal}
            />
        </div>
    )
}


function SavingModal(props: {
    opened: boolean,
    draft_data_component: DataComponent,
    update_draft_data_component: (a: Partial<DataComponent>, compare_meta_fields?: boolean) => void,
    set_show_saving_modal: (show: boolean) => void
}) {
    const state = app_store()

    const handle_save = () =>
    {
        state.data_components.update_data_component(props.draft_data_component)
        props.set_show_saving_modal(false)
    }

    return (
        <Modal
            opened={props.opened}
            onClose={() => props.set_show_saving_modal(false)}
            size="lg"
            title={<h2>Save Changes</h2>}
        >
            <div className="saving-modal">
                <TextEditorV2
                    editable={true}
                    auto_focus={true}
                    initial_content={props.draft_data_component.comment || ""}
                    on_update={comment => props.update_draft_data_component({ comment }, true)}
                    label="Comment (optional)"
                />

                <Checkbox
                    label="Minor changes"
                    checked={props.draft_data_component.version_type === "minor"}
                    onChange={(e: any) =>
                    {
                        const version_type = e.currentTarget.checked ? "minor" : undefined
                        props.update_draft_data_component({ version_type }, true)
                    }}
                />

                <div className="buttons">
                    <Button onClick={handle_save}>
                        Save
                    </Button>

                    <Button onClick={() => props.set_show_saving_modal(false)} variant="outline">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
