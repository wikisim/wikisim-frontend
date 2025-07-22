import { Button, Checkbox, Modal } from "@mantine/core"
import { useEffect, useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import { get_async_data_component } from "../../state/data_components/accessor"
import { app_store } from "../../state/store"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import Loading from "../../ui_components/Loading"
import "./SavingModal.css"


interface SavingModalProps
{
    opened: boolean
    draft_data_component: DataComponent
    update_draft_data_component: (a: Partial<DataComponent>, compare_meta_fields?: boolean) => void
    hide_saving_modal: () => void
}
export function SavingModal(props: SavingModalProps)
{
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
            props.hide_saving_modal()
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
            onClose={() => props.hide_saving_modal()}
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
