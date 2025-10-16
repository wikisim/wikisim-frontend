import { Button, Switch } from "@mantine/core"
import { useRef, useState } from "preact/hooks"

import { format_number_to_string } from "core/data/format/format_number_to_string"
import {
    DataComponent,
    NewDataComponent
} from "core/data/interface"
import { upload_interactable_files } from "core/data/post_to_edge_functions"
import { get_supabase } from "core/supabase/browser"
import { MAX_INTERACTABLE_SIZE } from "core/supabase/constants"

import { TargetedEvent } from "preact/compat"
import pub_sub from "../../../pub_sub"
import { ValueTypeDropdown } from "../../../ui_components/data_component/ValueTypeDropdown"
import Loading from "../../../ui_components/Loading"
import { filter_file_names, process_file_paths_of_interactable, ProcessedFileMap } from "./handle_file_paths_of_interactable"


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
                To upload an interactable first select a folder
                <ul>
                    <li>The folder must contain an index.html file</li>
                    <li>Total file size can not exceed {MAX_INTERACTABLE_SIZE.MEGA_BYTES} MB</li>
                </ul>
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

    const [error, set_error] = useState<string | null>(null)
    const [processed_file_map, set_processed_file_map] = useState<ProcessedFileMap | null>(null)


    function on_folder_select(event: React.ChangeEvent<HTMLInputElement>)
    {
        // @ts-ignore
        const files = event.target?.files as File[] | null
        if (!files) return

        const file_list = filter_file_names(Array.from(files))

        // Create a map of file paths to File objects
        const unprocessed_file_map: { [key: string]: File } = {}
        for (const file of file_list)
        {
            // Use webkitRelativePath to preserve folder structure
            const relative_path = file.webkitRelativePath
            unprocessed_file_map[relative_path] = file
        }

        const processed_file_map = process_file_paths_of_interactable(unprocessed_file_map)
        if (typeof processed_file_map === "string")
        {
            set_error(processed_file_map)
            return
        }

        set_processed_file_map(processed_file_map)
    }


    return <>
        <div className="data-component-form-column column">
            {error && <div className="generic-error-message">{error}</div>}

            <Button
                variant={button_colour(props.draft_component)}
                component="label"
                style={{ width: "fit-content"}}
            >
                {!processed_file_map ? "Select a folder" : "Select a different folder?"}
                <input
                    type="file"
                    // @ts-ignore
                    webkitdirectory
                    directory
                    multiple
                    onChange={on_folder_select}
                    style={{ display: "none" }}
                />
            </Button>

            {processed_file_map && <div>
                <ShowSelectedFiles file_map={processed_file_map.file_map} />

                <div className="vertical-gap" />

                <UploadFilesButtonAndStatus
                    draft_component={props.draft_component}
                    file_map={processed_file_map.file_map}
                    update_draft_component={props.on_change}
                />
            </div>}
        </div>
    </>
}


// If any file is larger than this then highlighting large files option will
// automatically be turned on
const BYTES_THRESHOLD_TO_HIGHLIGHT_LARGE_FILE = 0.5 * 1024 * 1024
// 2 MB, anything below this is considered small and will be shown with an
// increasingly fainter background colour
const STARTING_VISUAL_SCALE_MAX_BYTES = 2 * 1024 * 1024
const MIN_VISUAL_SCALE_BYTES = 1024
function ShowSelectedFiles(props: { file_map: { [key: string]: File } })
{
    const sizes = Object.values(props.file_map).map((file) => file.size)
    const total_size = sizes.reduce((a, b) => a + b, 0)
    const max_size = Math.max(STARTING_VISUAL_SCALE_MAX_BYTES, ...sizes)

    const [highlight_files_by_size, set_highlight_files_by_size] = useState(max_size > BYTES_THRESHOLD_TO_HIGHLIGHT_LARGE_FILE)


    return <div>
        {Object.keys(props.file_map).length} files selected<br/>

        <div style={{ display: "flex", gap: "0 1em", flexWrap: "wrap", justifyContent: "space-between" }}>
            {total_size > MAX_INTERACTABLE_SIZE.BYTES
            ?   <div className="generic-error-message">
                    Total size exceeds the maximum of {MAX_INTERACTABLE_SIZE.MEGA_BYTES} MB
                </div>
            :   <div>
                    Total size: {(total_size / 1024 / 1024).toFixed(2)} MB
                </div>
            }

            <Switch
                label="Highlight large files"
                size="md"
                labelPosition="left"
                checked={highlight_files_by_size}
                onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
                {
                    set_highlight_files_by_size(event.currentTarget.checked)
                }}
            />
        </div>

        <div className="vertical-gap" />

        {Object.entries(props.file_map).map(([path, file]) => (
            <div
                key={path}
                style={{
                    backgroundColor: `rgba(var(--colour-primary-blue-rgb), ${highlight_files_by_size ? file_size_to_colour(file.size, max_size) : 0})`,
                }}
            >
                {path} ({format_number_to_string(file.size / 1024, 2, "simple")} KB)
            </div>
        ))}

        <div className="vertical-gap" />
    </div>
}


function file_size_to_colour(size: number, max_bytes_size: number): number
{
    let opacity = 0

    if (size > MIN_VISUAL_SCALE_BYTES)
    {
        // Scale size to be between 0 and 1
        const scaled_size = (size - MIN_VISUAL_SCALE_BYTES) / (max_bytes_size - MIN_VISUAL_SCALE_BYTES)
        // Scale to be between 0.1 and 1
        opacity += scaled_size * (1 - opacity)
    }

    return opacity
}



interface UploadFilesButtonAndStatusProps
{
    draft_component: DataComponent | NewDataComponent
    file_map: { [key: string]: File }
    update_draft_component: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
// Posts files to edge function and gets back a URL that is hosting the resources
// If the user closes window they will have to reupload.  The server will be
// able to find and clean uploads which have no data components pointing to them.
function UploadFilesButtonAndStatus(props: UploadFilesButtonAndStatusProps)
{
    const { file_map, update_draft_component } = props
    const initial_result_value = useRef(props.draft_component.result_value)
    const [is_uploading, set_is_uploading] = useState(false)
    const [upload_result, set_upload_result] = useState<{[file_path: string]: string} | string | null>(null)

    async function on_click_upload()
    {
        set_is_uploading(true)
        set_upload_result(null)
        const response = await upload_interactable_files(get_supabase, file_map)
        set_is_uploading(false)
        set_upload_result(response.error || response.data)
        if (response.data)
        {
            // Update the draft component to have the map of the interactable
            // file paths to their uploaded IDs
            update_draft_component({
                result_value: JSON.stringify(response.data)
            })
        }
    }

    const result_value_changed = (typeof upload_result === "object" && upload_result !== null)
        ? initial_result_value.current !== JSON.stringify(upload_result)
        : undefined

    return <div>
        {(!upload_result || typeof upload_result === "string") && <Button
            variant={button_colour(props.draft_component)}
            onClick={on_click_upload}
            disabled={is_uploading}
        >
            {is_uploading ? <>Uploading<Loading/></> : (upload_result === null ? "Upload files" : "Try upload again")}
        </Button>}

        {typeof upload_result === "string" && <div className="generic-error-message">
            Upload failed. Please try again.
        </div>}

        {upload_result && !(typeof upload_result === "string") && <div>
            <div style={{ color: "var(--colour-success)" }}>
                Upload successful!
            </div>

            {result_value_changed === false && <>
                <div className="generic-error-message warning">
                    No changes were detected to the interactable files from
                    the last upload.
                </div>
                <ul>
                    <li>
                        If this is because you loaded up a draft then
                        you can ignore this message and just save the page.
                    </li>
                    <li>
                        Otherwise if you have made changes to the files then perhaps
                        you need to select a different folder for upload?
                    </li>
                </ul>
            </>}

            {result_value_changed && <>
                Now Save Page to publish this interactable

                <div className="vertical-gap" />

                <Button
                    variant={button_colour(props.draft_component)}
                    onClick={() => pub_sub.pub("open_save_modal_request_from_ValueEditorForInteractable", true)}
                >
                    Save Page
                </Button>
            </>}
        </div>}
    </div>
}


function button_colour(data_component: DataComponent | NewDataComponent): string
{
    return data_component.owner_id ? "primary-user" : "primary"
}
