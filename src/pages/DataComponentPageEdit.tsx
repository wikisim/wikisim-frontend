import { useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"
import { changes_made } from "core/data/modify"

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
            : status === "load_error" ? <div>Error loading data component.</div>
            : <div>Data component not found.</div>}
        </div>
    }

    const [draft_component, _set_draft_component] = useState(component)
    const set_draft_component = (updates: Partial<DataComponent>) =>
    {
        const new_draft: DataComponent = { ...draft_component, ...updates }
        if (!changes_made(new_draft, draft_component)) return
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
                    set_editing={() => state.data_components.update_data_component(draft_component)}
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
        </div>
    )
}
