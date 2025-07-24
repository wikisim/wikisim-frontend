import { Button, Checkbox, Modal } from "@mantine/core"
import { useEffect, useState } from "preact/hooks"

import { get_id_str_of_data_component } from "core/data/accessor"
import type { IdAndVersion } from "core/data/id"
import { DataComponent, is_data_component, NewDataComponent } from "core/data/interface"

import type { AsyncDataComponent, AsyncNewDataComponent } from "../../state/data_components/interface"
import type { RootAppState } from "../../state/interface"
import { app_store } from "../../state/store"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import Loading from "../../ui_components/Loading"
import "./SavingModal.css"


function get_async_data_component_from_state(state: RootAppState, data_component: DataComponent | NewDataComponent): AsyncDataComponent | AsyncNewDataComponent | undefined
{
    const id_str = get_id_str_of_data_component(data_component)
    if (is_data_component(data_component))
    {
        return state.data_components.data_component_by_id_and_maybe_version[id_str]
    }
    else
    {
        return state.data_components.new_data_component_by_temp_id[id_str]
    }
}

function get_id_and_version_of_async_data_component(async_data_component: AsyncDataComponent | AsyncNewDataComponent): IdAndVersion | undefined
{
    if ("component" in async_data_component)
    {
        // If this is an AsyncDataComponent, then the component should always be
        // defined in the context of the SavingModal as it will come from the Edit page.
        return async_data_component.component!.id
    }
    return async_data_component.new_id
}

function get_version_of_async_data_component(async_data_component: AsyncDataComponent | AsyncNewDataComponent): number
{
    return get_id_and_version_of_async_data_component(async_data_component)?.version || 0
}

function get_version_of_data_component(data_component: DataComponent | NewDataComponent): number
{
    if ("id" in data_component && "version" in data_component.id) return data_component.id.version
    return 0
}


interface SavingModalProps<V>
{
    opened: boolean
    draft_data_component: V
    update_draft_data_component: (a: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) => void
    handle_save: (state: RootAppState, draft_data_component: V) => void
    hide_saving_modal: () => void
    on_save_success: (id: IdAndVersion) => void
}
export function SavingModal<V extends (DataComponent | NewDataComponent)>(props: SavingModalProps<V>)
{
    const state = app_store()
    // Get the latest async data component for the draft data component so that
    // when we can tell the user if the save was successful or not.
    const current_async_component = get_async_data_component_from_state(state, props.draft_data_component)

    const [is_saving, set_is_saving] = useState(false)
    const [error_is_unrecoverable, set_error_is_unrecoverable] = useState(false)
    const [error_message, set_error_message] = useState("")

    const handle_save = () =>
    {
        if (is_saving || error_is_unrecoverable) return
        set_error_is_unrecoverable(false)
        set_error_message("")
        props.handle_save(state, props.draft_data_component)
        set_is_saving(true)
    }

    useEffect(() =>
    {
        // When we're updating an existing DataComponent then
        // current_async_component should always be defined
        // but
        // When we're going to insert a new component into the DB then before we
        // have started a request to insert a NewDataComponent to the
        // DB then current_async_component will be undefined.
        if (current_async_component === undefined) return
        // When we're updating an existing DataComponent then current_version
        // should always be defined
        // but
        // When we're inserting a new component into the DB and after we have
        // requested but before it has returned successfully then current_version
        // will be 0 or if it has returned an error then current_version will
        // also be 0 (remember that valid versions start at 1, so 0 is invalid).
        const current_version = get_version_of_async_data_component(current_async_component)

        // Once the save as completed successfully, then we can close the modal
        if (current_async_component.status === "loaded" && current_version > get_version_of_data_component(props.draft_data_component))
        {
            props.hide_saving_modal()
            set_is_saving(false)
            const id = get_id_and_version_of_async_data_component(current_async_component)!
            props.on_save_success(id)
        }
        // If the save encountered an error, then we keep the saving modal open and show the error message
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
    }, [current_async_component?.status])

    return (
        <Modal
            opened={props.opened}
            onClose={() => props.hide_saving_modal()}
            size="lg"
            title={<h2>Save Changes</h2>}
        >
            <div className="saving-modal">
                <TextEditorV1
                    editable={!is_saving && !error_is_unrecoverable}
                    single_line={true}
                    trigger_search_on_at_symbol={true}
                    value={props.draft_data_component.comment || ""}
                    on_change={e =>
                    {
                        const comment = e.currentTarget.value
                        props.update_draft_data_component({ comment }, true)
                    }}
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
                        onClick={() => props.hide_saving_modal()}
                        variant="outline"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
