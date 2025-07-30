import { Button, Checkbox, Modal } from "@mantine/core"
import { useState } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"

import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import Loading from "../../ui_components/Loading"
import "./SaveModal.css"


interface SaveModalProps<V>
{
    opened: boolean
    draft_data_component: V
    update_draft_data_component: (a: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) => void
    handle_save: (draft_data_component: V) => Promise<{ error?: Error }>
    hide_saving_modal: () => void
}
export function SaveModal<V extends (DataComponent | NewDataComponent)>(props: SaveModalProps<V>)
{
    const [is_saving, set_is_saving] = useState(false)
    const [error_is_unrecoverable, set_error_is_unrecoverable] = useState(false)
    const [error_message, set_error_message] = useState("")

    const handle_save = () =>
    {
        if (is_saving || error_is_unrecoverable) return
        set_error_is_unrecoverable(false)
        set_error_message("")
        set_is_saving(true)
        props.handle_save(props.draft_data_component)
        .then(({ error }) =>
        {
            set_is_saving(false)
            if (error?.message.startsWith("ERR09."))
            {
                set_error_is_unrecoverable(true)
                set_error_message("A newer version of this data component has been saved.  Please copy your changes to another document, refresh the page and try again.")
            }
            else if (error)
            {
                const code = error.message.match(/^(ERR\d+\.)/)
                set_error_message(`An error occurred while saving the data component.  Please try again.  ${code ? code[0] : ""}`)
            }
            else
            {
                props.hide_saving_modal()
            }
        })
    }

    return (
        <Modal
            opened={props.opened}
            onClose={() => props.hide_saving_modal()}
            size="lg"
            title={<h2>Save Changes</h2>}
            style={{ zIndex: "var(--z-index-modal-save)" }}
        >
            <div className="save-modal">
                <TextEditorV1
                    editable={!is_saving && !error_is_unrecoverable}
                    single_line={true}
                    trigger_search_on_at_symbol={true}
                    initial_value={props.draft_data_component.comment || ""}
                    on_change={e =>
                    {
                        const comment = e.currentTarget.value
                        props.update_draft_data_component({ comment }, true)
                    }}
                    label="Comment (optional)"
                    start_focused="focused"
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
