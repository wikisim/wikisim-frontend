import { Button, Modal, Switch } from "@mantine/core"
import { TargetedEvent } from "preact/compat"
import { useState } from "preact/hooks"

import { DataComponent, is_data_component, NewDataComponent } from "core/data/interface"

import { app_store } from "../../state/store"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import Loading from "../../ui_components/Loading"
import "./SaveModal.css"


interface SaveModalProps<V>
{
    opened: boolean
    draft_data_component: V
    update_draft_data_component: (a: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) => void
    handle_save: (draft_data_component: V) => Promise<{ error?: Error | string }>
    hide_saving_modal: () => void
}
export function SaveModal<V extends (DataComponent | NewDataComponent)>(props: SaveModalProps<V>)
{
    const [is_saving, set_is_saving] = useState(false)
    const [error_is_unrecoverable, set_error_is_unrecoverable] = useState(false)
    const [error_message, set_error_message] = useState("")

    const state = app_store()
    const create_as_user = props.draft_data_component.owner_id !== undefined
    const set_create_as_user = (v: boolean) =>
    {
        const owner_id = v ? state.user_auth_session.session?.user.id : undefined
        props.update_draft_data_component({ owner_id })
    }

    const saving_existing = is_data_component(props.draft_data_component)
    const creating_new = !saving_existing

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
            const error_str = typeof error === "string" ? error : error?.message

            if (error_str?.startsWith("ERR09."))
            {
                set_error_is_unrecoverable(true)
                set_error_message("A newer version of this data component has been saved.  Please copy your changes to another document, refresh the page and try again.")
            }
            else if (error_str)
            {
                const code = error_str.match(/^(ERR\d+\.)/)
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
                    initial_content={props.draft_data_component.comment || ""}
                    on_change={e =>
                    {
                        const comment = e.currentTarget.value
                        props.update_draft_data_component({ comment }, true)
                    }}
                    label="Comment (optional)"
                    start_focused="focused"
                />

                {/* <Checkbox
                    disabled={is_saving || error_is_unrecoverable}
                    label="Minor changes"
                    checked={props.draft_data_component.version_type === "minor"}
                    onChange={(e: any) =>
                    {
                        const version_type = e.currentTarget.checked ? "minor" : undefined
                        props.update_draft_data_component({ version_type }, true)
                    }}
                /> */}

                {creating_new && <ToggleCreateAsUser
                    create_as_user={create_as_user}
                    set_create_as_user={set_create_as_user}
                />}

                {error_message && <div className="error-message">
                    <strong>Error:</strong> {error_message}
                </div>}

                <div className="buttons">
                    <Button
                        disabled={is_saving || error_is_unrecoverable}
                        onClick={handle_save}
                        title={error_is_unrecoverable ? error_message : ""}
                        {...(create_as_user ? { variant: "primary-user" } : {})}
                    >
                        {saving_existing ? "Save" : `Create ${create_as_user ? "User" : "Wiki"} Data` } {is_saving ? <Loading /> : ""}
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



interface ToggleCreateAsUserProps
{
    create_as_user: boolean
    set_create_as_user: (v: boolean) => void
}
function ToggleCreateAsUser(props: ToggleCreateAsUserProps)
{
    const { create_as_user, set_create_as_user } = props

    return <div className="create-as-user-toggle">
        <Switch
            checked={create_as_user}
            onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            {
                set_create_as_user(event.currentTarget.checked)
            }}
            withThumbIndicator={false}
            color="var(--mantine-color-green-filled)"
            labelPosition="left"
            label={`Create as ${create_as_user ? "User" : "Wiki"} Data Component`}
        />
    </div>
}
