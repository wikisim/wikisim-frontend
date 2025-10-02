import { useState } from "preact/hooks"

import {
    DataComponent,
    NewDataComponent
} from "core/data/interface"

import { ValueTypeDropdown } from "../../../ui_components/data_component/ValueTypeDropdown"
import "./ValueEditForm.css"


interface ValueEditorForInteractableProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function ValueEditorForInteractable(props: ValueEditorForInteractableProps)
{
    const { draft_component, on_change } = props

    if (draft_component.value_type !== "interactable") return null

    return <>
        <div className="value-editor-container column opened">

            <div className="data-component-form-column">
                Upload an interactable by choosing a folder to upload that should
                have an index.html file and associated assets.
            </div>

            <UploadInteractableFolder
                draft_component={draft_component}
                on_change={on_change}
            />

            <div className="data-component-form-column">
                <div className="vertical-gap" />

                <ValueTypeDropdown
                    draft_component={draft_component}
                    on_change={on_change}
                />
            </div>
        </div>
    </>
}


function UploadInteractableFolder(props: ValueEditorForInteractableProps)
{
    // const { draft_component, on_change } = props

    const [error, set_error] = useState<string | null>("null testing eror")


    function on_folder_select(event: React.ChangeEvent<HTMLInputElement>)
    {
        // @ts-ignore
        const files = event.target?.files as File[] | null
        if (!files) return

        const file_list = Array.from(files)

        // Check if index.html is present
        const has_index = file_list.some(file => file.name === "index.html")
        if (!has_index)
        {
            set_error("The selected folder must contain an index.html file.")
            return
        }

        // Create a map of file paths to File objects
        const file_map: { [key: string]: File } = {}
        for (const file of file_list)
        {
            // Use webkitRelativePath to preserve folder structure
            const relative_path = file.webkitRelativePath
            file_map[relative_path] = file
        }

        // on_change({ value: file_map })
    }

    return <>
        <div className="data-component-form-column">
            {error && <div className="error-message">{error}</div>}

            <label className="upload-button">
                Choose Folder
                <input
                    type="file"
                    // @ts-ignore
                    webkitdirectory
                    directory
                    multiple
                    onChange={on_folder_select}
                    style={{ display: "none" }}
                />
            </label>
            {/* {draft_component.value &&
                <span style={{ marginLeft: "10px" }}>
                    {Object.keys(draft_component.value).length} files selected
                </span>
            } */}
        </div>
    </>
}
