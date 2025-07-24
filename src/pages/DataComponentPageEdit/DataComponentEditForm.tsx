import { ActionIcon } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import IconDeviceFloppy from "@tabler/icons-react/dist/esm/icons/IconDeviceFloppy"
import IconTrashX from "@tabler/icons-react/dist/esm/icons/IconTrashX"
import { useEffect, useState } from "preact/hooks"

import { get_id_str_of_data_component, get_version_of_data_component } from "core/data/accessor"
import { flatten_data_component_for_db, hydrate_data_component_from_db } from "core/data/convert_between_db"
import { IdAndVersion, TempId } from "core/data/id"
import { is_data_component, type DataComponent, type NewDataComponent } from "core/data/interface"
import { changes_made } from "core/data/modify"

import BinChangesButton from "../../buttons/BinChangesButton"
import EditOrSaveButton from "../../buttons/EditOrSaveButton"
import type { AsyncDataComponentStatus } from "../../state/data_components/interface"
import type { RootAppState } from "../../state/interface"
import { app_store } from "../../state/store"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import Countdown, { CountdownTimer } from "../../ui_components/Countdown"
import "./DataComponentEditForm.css"
import { SaveModal } from "./SaveModal"



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

    const { id: user_id } = state.user_auth_session.session?.user || {}
    if (!user_id)
    {
        return <div className="page-container">
            <p>Please log in to edit this data component.</p>
        </div>
    }

    const { async_status: status } = props

    const [show_saving_modal, set_show_saving_modal] = useState(false)

    const potential_initial_component = {
        ...props.data_component,
        comment: "", // Reset comment for new edits
        version_type: undefined, // Default to a normal change
    }
    const previously_saved_draft = load_previously_saved_draft(props.data_component) as V | undefined
    const initial_component: V = {
        ...potential_initial_component,
        ...previously_saved_draft,
    }
    const [draft_component, _set_draft_component] = useState<V>(initial_component)

    const set_draft_component = (updates: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) =>
    {
        const new_draft: V = { ...draft_component, ...updates }
        const any_changes_made = changes_made(new_draft, potential_initial_component, true)
        store_draft_component_to_local(new_draft, any_changes_made)
        if (!changes_made(new_draft, draft_component, compare_meta_fields)) return
        _set_draft_component(new_draft)
    }

    const no_changes_made = !changes_made(draft_component, props.data_component)

    const version_mismatch = get_version_of_data_component(props.data_component) !== get_version_of_data_component(draft_component)
    const saving_in_progress = status === "saving"
    const disabled_save = (
        version_mismatch ? "Version mismatch, please reload" :
        saving_in_progress ? "Saving..." :
        no_changes_made ? "No changes made" : false
    )
    const disabled_bin_changes = (
        saving_in_progress ? "Saving..." :
        no_changes_made ? "No changes made" : false
    )
    const editable = !version_mismatch && !saving_in_progress


    function discard_previously_saved_draft()
    {
        clear_previously_saved_draft(draft_component)
        window.location.reload() // Reload to reset the form
    }
    useEffect(() => notify_if_loaded_previously_saved_draft(previously_saved_draft, version_mismatch, discard_previously_saved_draft), [])


    return <>
        {/* This element provides space to show the edit / save button */}
        <div style={{ float: "right", width: "50px", height: "50px" }} />
        <div className="buttons-container">
            <EditOrSaveButton
                disabled={disabled_save}
                editing={true}
                set_editing={() => set_show_saving_modal(true)}
            />
            <BinChangesButton
                disabled={disabled_bin_changes}
                highlighted={version_mismatch}
                on_click={discard_previously_saved_draft}
            />
        </div>

        <div className={"data-component-form " + (editable ? "editable" : "view-only")}>
            <TextEditorV2
                editable={editable}
                initial_content={initial_component.title}
                single_line={true}
                on_update={title => set_draft_component({ title })}
                label={"Title" + (saving_in_progress ? " saving..." : "")}
            />

            <TextEditorV2
                editable={editable}
                initial_content={initial_component.description}
                single_line={false}
                on_update={description => set_draft_component({ description })}
                label={"Description" + (saving_in_progress ? " saving..." : "")}
            />
        </div>

        {/* Hide the SaveModal when there is a version mismatch because currently
        it will incorrectly call the `on_save_success` and redirect the user to
        the view page without giving them a chance to discard their changes to
        the older version of this data component. */}
        {!version_mismatch && <SaveModal
            opened={show_saving_modal}
            draft_data_component={draft_component}
            update_draft_data_component={set_draft_component}
            handle_save={props.handle_save}
            hide_saving_modal={() => set_show_saving_modal(false)}
            on_save_success={data_component_id =>
            {
                clear_previously_saved_draft(draft_component)
                props.on_save_success(data_component_id)
            }}
        />}
    </>
}


function store_draft_component_to_local(draft_component: DataComponent | NewDataComponent, any_changes_made: boolean)
{
    if (!any_changes_made)
    {
        clear_previously_saved_draft(draft_component)
        return
    }

    const id_str = get_id_str_of_data_component(draft_component)
    const draft_key = `draft_component_${id_str}`
    const flattened = flatten_data_component_for_local_storage(draft_component)

    localStorage.setItem(draft_key, JSON.stringify({
        draft_component: flattened,
        timestamp: new Date().toISOString()
    }))
}


function load_previously_saved_draft(data_component: DataComponent | NewDataComponent): DataComponent | NewDataComponent | undefined
{
    const id_str = get_id_str_of_data_component(data_component)
    const draft_key = `draft_component_${id_str}`
    const draft_json = localStorage.getItem(draft_key)
    if (!draft_json) return undefined

    try
    {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const draft_data = JSON.parse(draft_json)
        if (draft_data && draft_data.draft_component)
        {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return hydrate_data_component_from_local_storage(draft_data.draft_component)
        }
    }
    catch (error)
    {
        console.error("Failed to parse previously saved draft:", error)
    }
    return undefined
}


function clear_previously_saved_draft(data_component: DataComponent | NewDataComponent)
{
    const id_str = get_id_str_of_data_component(data_component)
    const draft_key = `draft_component_${id_str}`
    localStorage.removeItem(draft_key)
}


type FlattenedDataComponent = ReturnType<typeof flatten_data_component_for_db> & { id: number, version_number: number }
type FlattenedNewDataComponent = ReturnType<typeof flatten_data_component_for_db> & { temporary_id: string }
type FlattenedDataComponentOrNew = FlattenedDataComponent | FlattenedNewDataComponent
function flatten_data_component_for_local_storage(draft_component: DataComponent | NewDataComponent)
{
    let flattened: FlattenedDataComponentOrNew
    if (is_data_component(draft_component))
    {
        flattened = {
            ...flatten_data_component_for_db(draft_component),
            id: draft_component.id.id,
            version_number: draft_component.id.version,
        }
    }
    else
    {
        flattened = {
            ...flatten_data_component_for_db(draft_component),
            temporary_id: draft_component.temporary_id.to_str(),
        }
    }

    return flattened
}


function hydrate_data_component_from_local_storage(row: FlattenedDataComponentOrNew): DataComponent | NewDataComponent
{
    if ("id" in row)
    {
        const id = new IdAndVersion(row.id, row.version_number)
        // This is a DataComponent
        return {
            id,
            ...hydrate_data_component_from_db(row),
        } as DataComponent
    }
    else
    {
        const temporary_id = new TempId(row.temporary_id)
        // This is a NewDataComponent
        return {
            temporary_id,
            ...hydrate_data_component_from_db(row),
        } as NewDataComponent
    }
}


function notify_if_loaded_previously_saved_draft(
    previously_saved_draft: DataComponent | NewDataComponent | undefined,
    version_mismatch: boolean,
    discard_previously_saved_draft: () => void,
)
{
    if (previously_saved_draft)
    {
        const close_in = 15 // seconds
        const timer = new CountdownTimer(close_in)

        const on_click = () =>
        {
            discard_previously_saved_draft()
            timer.destroy()
            notifications.hide(notification_element_id)
        }

        const notification_element_id = notifications.show({
            title: "Previously saved draft loaded",
            message: (<div
                className="notifcation-draft-loaded"
                onPointerEnter={() => timer.stop()}
                onPointerLeave={() => timer.start()}
            >
                {version_mismatch
                ? <VersionMismatchNotificationMessage on_click={on_click} />
                : <SavedDraftLoadedNotificationMessage on_click={on_click} timer={timer} />}
            </div>),
            color: version_mismatch ? "var(--mantine-color-red-9)" : "var(--primary-blue)",
            position: "top-right",
            // autoClose: close_in * 1000,
            autoClose: false,
            withCloseButton: true,
            withBorder: true,
            icon: <IconDeviceFloppy />,
            onClose: () => timer.destroy()
        })

        timer.subscribe(seconds_left =>
        {
            if (seconds_left > 0 || version_mismatch) return
            notifications.hide(notification_element_id)
        })
    }
}


/**
 * Can these this functionality using this script replacing `draft_component_1`
 * with the ID of the data component you are testing:
 * id_str = "1"; go_earlier = () => { const d = JSON.parse(localStorage["draft_component_" + id_str]); d.draft_component.version_number --; localStorage.setItem("draft_component_" + id_str,JSON.stringify(d))}; go_earlier()
 */
function VersionMismatchNotificationMessage(props: { on_click: () => void })
{
    return <>
        A previously saved draft was loaded, but it is now out of date because
        it was created for an older version of this data component. Please copy
        any changes you wish to keep, <span
            className="action-discard-changes"
            onClick={props.on_click}
        >
            discard this draft
            <span style={{ marginLeft: 5, verticalAlign: "top" }}>
                <ActionIcon
                    size="xs"
                    variant="danger"
                >
                    <IconTrashX />
                </ActionIcon>
            </span>
        </span>, and then reapply your changes to the latest version if needed.
    </>
}


function SavedDraftLoadedNotificationMessage(props: { on_click: () => void, timer: CountdownTimer })
{
    return <>
        A previously saved draft has been loaded. You can either
        <ul>
            <li>continue editing and save it as a new version</li>
            <li>
                or <span
                    className="action-discard-changes"
                    onClick={props.on_click}
                >
                    discard these changes
                    <span style={{ marginLeft: 5, verticalAlign: "top" }}>
                        <ActionIcon
                            size="xs"
                            variant="danger"
                        >
                            <IconTrashX />
                        </ActionIcon>
                    </span>
                </span>
            </li>
        </ul>
        <span style={{ color: "darkgrey" }}>Closes in <Countdown timer={props.timer} /></span>
    </>
}
