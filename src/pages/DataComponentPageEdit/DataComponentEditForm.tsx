import { ActionIcon } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import IconDeviceFloppy from "@tabler/icons-react/dist/esm/icons/IconDeviceFloppy"
import IconTrashX from "@tabler/icons-react/dist/esm/icons/IconTrashX"
import { useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"
import { z } from "zod"

import { get_id_str_of_data_component, get_version_of_data_component } from "core/data/accessor"
import { flatten_new_or_data_component_to_json, hydrate_data_component_from_json } from "core/data/convert_between_json"
import { is_data_component, type DataComponent, type NewDataComponent } from "core/data/interface"
import { is_data_component_invalid } from "core/data/is_data_component_invalid"
import { changes_made } from "core/data/modify"
import { make_field_validators } from "core/data/validate_fields"

import BinChangesButton from "../../buttons/BinChangesButton"
import EditOrSaveButton from "../../buttons/EditOrSaveButton"
import pub_sub from "../../pub_sub"
import { ROUTES } from "../../routes"
import type { AsyncDataComponentStatus } from "../../state/data_components/interface"
import { app_store } from "../../state/store"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import Countdown, { CountdownTimer } from "../../ui_components/Countdown"
import Loading from "../../ui_components/Loading"
import { load_referenced_data_components } from "../utils/load_referenced_data_components"
import "./DataComponentEditForm.css"
import { SaveModal } from "./SaveModal"
import { ValueEditor } from "./ValueEditForm"



const validators = make_field_validators(z)


interface DataComponentEditFormProps<V>
{
    async_status: AsyncDataComponentStatus
    data_component: V
    on_component_change?: (draft_data_component: V) => void
    handle_save: (draft_data_component: V) => Promise<{ error?: Error | string }>
}
export function DataComponentEditForm<V extends (DataComponent | NewDataComponent)>(props: DataComponentEditFormProps<V>)
{
    const state = app_store()
    const location = useLocation()

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
    useEffect(() => props.on_component_change?.(initial_component), [])
    const [draft_component, _set_draft_component] = useState<V>(initial_component)


    const result = load_referenced_data_components(state, draft_component)
    if (result.status === "loading")
    {
        return <div className="page-container">
            <p>Loading {result.loading_count}/{result.referenced_data_component_ids.length} referenced components.</p>
            <Loading />
        </div>
    }

    const set_draft_component = (updates: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) =>
    {
        const new_draft: V = { ...draft_component, ...updates }
        const any_changes_made = changes_made(new_draft, potential_initial_component, true)
        store_draft_component_to_local(new_draft, any_changes_made)
        if (!changes_made(new_draft, draft_component, compare_meta_fields)) return

        props.on_component_change?.(new_draft)
        _set_draft_component(new_draft)
    }


    const version_mismatch = get_version_of_data_component(props.data_component) !== get_version_of_data_component(draft_component)
    const saving_in_progress = status === "saving"
    const no_changes_made = !changes_made(draft_component, props.data_component)
    const invalid_data_component = is_data_component_invalid(draft_component)

    const saving_disabled = (
        version_mismatch ? "Version out of date, please reload" :
        saving_in_progress ? "Saving..." :
        no_changes_made ? "No changes made" :
        invalid_data_component ? invalid_data_component : false
    )
    const disabled_bin_changes = (
        saving_in_progress ? "Saving..." :
        no_changes_made ? "No changes made" : false
    )
    const editable = !version_mismatch && !saving_in_progress


    function discard_previously_saved_draft()
    {
        clear_previously_saved_draft(draft_component)
        // Go back to original component
        if (is_data_component(props.data_component))
        {
            const new_route = ROUTES.DATA_COMPONENT.VIEW_WIKI_COMPONENT(props.data_component.id)
            location.route(new_route)
        }
        else
        {
            // Or reload the page
            document.location.reload()
        }
    }
    useEffect(() => notify_if_loaded_previously_saved_draft(previously_saved_draft, version_mismatch, discard_previously_saved_draft), [])


    // Subscribe to cmd + enter key combo to open the save modal for the component
    useEffect(() =>
    {
        if (saving_disabled) return
        return pub_sub.sub("key_down", data =>
        {
            if (data.key !== "Enter" || !data.metaKey) return
            set_show_saving_modal(true)
        })
    }, [saving_disabled])


    useEffect(() =>
    {
        // On first render, check the URL parameters for `=is_user_component=true`
        // and if set, save a draft of the current component with the owner_id
        // set to the current user id.
        // Then clear the URL parameter without reloading the page.
        const params = new URLSearchParams(window.location.search)
        const is_user_component = params.get("is_user_component")
        if (is_user_component === null) return

        const user_id = state.user_auth_session.session?.user.id
        if (is_user_component === "true") set_draft_component({ owner_id: user_id })
        else set_draft_component({ owner_id: undefined })

        params.delete("is_user_component")
        const new_url = window.location.pathname + (params.toString() ? `?${params.toString()}` : "")
        window.history.replaceState({}, "", new_url)
    })


    return <>
        <div className="data-component-edit-form-container">
            <DataComponentEditFormInner
                editable={editable}
                initial_component={initial_component}
                draft_component={draft_component}
                set_draft_component={set_draft_component}
                saving_in_progress={saving_in_progress}
            />

            <div className="buttons-container-spacer" />
            <div className="buttons-container">
                <EditOrSaveButton
                    disabled={saving_disabled}
                    editing={true}
                    set_editing={() => set_show_saving_modal(true)}
                />
                <BinChangesButton
                    disabled={disabled_bin_changes}
                    highlighted={version_mismatch}
                    on_click={discard_previously_saved_draft}
                />
            </div>
        </div>

        <SaveModal
            opened={show_saving_modal}
            draft_data_component={draft_component}
            update_draft_data_component={set_draft_component}
            handle_save={draft_data_component =>
            {
                return props.handle_save(draft_data_component)
                    .then(({ error }) =>
                    {
                        if (!error) clear_previously_saved_draft(draft_component)
                        return { error }
                    })
            }}
            hide_saving_modal={() => set_show_saving_modal(false)}
        />
    </>
}


function DataComponentEditFormInner(props: {
    editable: boolean
    initial_component: DataComponent | NewDataComponent
    draft_component: DataComponent | NewDataComponent
    set_draft_component: (updates: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) => void
    saving_in_progress: boolean
})
{
    const {
        editable,
        initial_component, draft_component,
        set_draft_component,
        saving_in_progress,
    } = props

    return <div className={"data-component-form column " + (editable ? "editable" : "view-only")}>
        <div className="data-component-form-row row">
            <div className="data-component-form-column column">
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
        </div>

        <ValueEditor
            draft_component={draft_component}
            on_change={set_draft_component}
        />
    </div>
}


function store_draft_component_to_local(draft_component: DataComponent | NewDataComponent, any_changes_made: boolean)
{
    if (!any_changes_made)
    {
        clear_previously_saved_draft(draft_component)
        return
    }

    const id_str = get_id_str_of_data_component(draft_component, true)
    const draft_key = `draft_component_${id_str}`
    const flattened = flatten_new_or_data_component_to_json(draft_component)

    localStorage.setItem(draft_key, JSON.stringify({
        draft_component: flattened,
        timestamp: new Date().toISOString()
    }))
}


function load_previously_saved_draft(data_component: DataComponent | NewDataComponent): DataComponent | NewDataComponent | undefined
{
    const id_str = get_id_str_of_data_component(data_component, true)
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
            return hydrate_data_component_from_json(draft_data.draft_component, validators)
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
    const id_str = get_id_str_of_data_component(data_component, true)
    const draft_key = `draft_component_${id_str}`
    localStorage.removeItem(draft_key)
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
            color: version_mismatch ? "var(--mantine-color-red-9)" : "var(--colour-primary-blue)",
            position: "bottom-right",
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
