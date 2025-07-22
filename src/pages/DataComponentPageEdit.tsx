import { useEffect, useState } from "preact/hooks"

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
    const current_async_component = get_async_data_component(state, props.draft_data_component.id.id.toString())

    const [is_saving, set_is_saving] = useState(false)
    const [error_is_unrecoverable, set_error_is_unrecoverable] = useState(false)
    const [error_message, set_error_message] = useState("")

    const handle_save = () =>
    {
        if (is_saving || error_is_unrecoverable) return
        set_error_is_unrecoverable(false)
        set_error_message("")
        state.data_components.update_data_component(props.draft_data_component)
        set_is_saving(true)
    }

    useEffect(() =>
    {
        const current_version = current_async_component.component?.id.version
        // type guard
        if (current_version === undefined) return

        if (current_async_component.status === "loaded" && current_version > props.draft_data_component.id.version)
        {
            props.set_show_saving_modal(false)
            set_is_saving(false)
        }
        else if (current_async_component.status === "error")
        {
            set_is_saving(false)
            if (current_async_component.error?.message.startsWith("ERR09."))
            {
                set_error_is_unrecoverable(true)
                set_error_message("A newer version of this data component has been saved.  Please copy your changes to another document, refresh the page and try again.")
            }
            else
            {
                const code = current_async_component.error?.message.match(/^(ERR\d+\.)/)
                set_error_message(`An error occurred while saving the data component.  Please try again.  ${code ? code[0] : ""}`)
            }
        }
    }, [current_async_component.status])

    return (
        <Modal
            opened={props.opened}
            onClose={() => props.set_show_saving_modal(false)}
            size="lg"
            title={<h2>Save Changes</h2>}
        >
            <div className="saving-modal">
                <TextEditorV2
                    editable={!is_saving && !error_is_unrecoverable}
                    auto_focus={true}
                    initial_content={props.draft_data_component.comment || ""}
                    on_update={comment => props.update_draft_data_component({ comment }, true)}
                    label="Comment (optional)"
                />

                <Checkbox
                    disabled={is_saving || error_is_unrecoverable}
                    label="Minor changes"
                    checked={props.draft_data_component.version_type === "minor"}
                    onChange={(e: any) =>
                    {
                        const version_type = e.currentTarget.checked ? "minor" : undefined
                        props.update_draft_data_component({ version_type }, true)
                    }}
                />

                {error_message && <div className="error-message">
                    <strong>Error:</strong> {error_message}
                </div>}

                <div className="buttons">
                    <Button
                        disabled={is_saving || error_is_unrecoverable}
                        onClick={handle_save}
                        title={error_is_unrecoverable ? error_message : ""}
                    >
                        Save {is_saving ? <Loading /> : ""}
                    </Button>

                    <Button
                        disabled={is_saving}
                        onClick={() => props.set_show_saving_modal(false)}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
