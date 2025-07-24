import { useState } from "preact/hooks"

import { get_id_str_of_data_component } from "core/data/accessor"
import { flatten_data_component_for_db, hydrate_data_component_from_db } from "core/data/convert_between_db"
import { IdAndVersion, TempId } from "core/data/id"
import { is_data_component, type DataComponent, type NewDataComponent } from "core/data/interface"
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

    const { async_status: status } = props

    const [show_saving_modal, set_show_saving_modal] = useState(false)

    const previously_saved_draft = load_previously_saved_draft(props.data_component) as V | undefined
    const initial_component: V = {
        ...props.data_component,
        comment: "", // Reset comment for new edits
        version_type: undefined, // Default to a normal change
        ...previously_saved_draft,
    }
    const [draft_component, _set_draft_component] = useState<V>(initial_component)


    const set_draft_component = (updates: Partial<DataComponent | NewDataComponent>, compare_meta_fields?: boolean) =>
    {
        const new_draft: V = { ...draft_component, ...updates }
        store_draft_component_to_local(new_draft)
        if (!changes_made(new_draft, draft_component, compare_meta_fields)) return
        _set_draft_component(new_draft)
    }

    const no_changes_made = !changes_made(draft_component, props.data_component)
    // Warn user if they try to navigate away with unsaved changes
    // useEffect(() => warn_user_if_unsaved_changes(no_changes_made), [no_changes_made])

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

        <SavingModal
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
        />
    </>
}


// function warn_user_if_unsaved_changes(no_changes_made: boolean)
// {
//     const handle_beforeunload = (event: BeforeUnloadEvent) =>
//     {
//         if (no_changes_made) return
//         event.preventDefault()
//     }

//     const handle_popstate = () =>
//     {
//         if (no_changes_made) return
//         window.alert("You have unsaved changes, they will be stored locally but may be lost.")
//     }

//     // Store original methods to intercept programmatic navigation
//     const original_pushState = window.history.pushState
//     const original_replaceState = window.history.replaceState

//     const handle_pushState = function(this: History, state: any, title: string, url?: string | URL | null)
//     {
//         if (!no_changes_made)
//         {
//             window.alert("You have unsaved changes, they will be stored locally but may be lost.")
//         }
//         return original_pushState.call(this, state, title, url)
//     }

//     const handle_replaceState = function(this: History, state: any, title: string, url?: string | URL | null)
//     {
//         if (!no_changes_made)
//         {
//             window.alert("You have unsaved changes, they will be stored locally but may be lost.")
//         }
//         return original_replaceState.call(this, state, title, url)
//     }

//     window.addEventListener("beforeunload", handle_beforeunload)
//     window.addEventListener("popstate", handle_popstate)
//     window.history.pushState = handle_pushState
//     window.history.replaceState = handle_replaceState

//     return () => {
//         window.removeEventListener("beforeunload", handle_beforeunload)
//         window.removeEventListener("popstate", handle_popstate)
//         window.history.pushState = original_pushState
//         window.history.replaceState = original_replaceState
//     }
// }


function store_draft_component_to_local(draft_component: DataComponent | NewDataComponent)
{
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
