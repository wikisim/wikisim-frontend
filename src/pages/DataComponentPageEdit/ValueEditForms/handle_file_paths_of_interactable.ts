import { ERRORS } from "core/errors"


export function filter_file_names(files: File[]): File[]
{
    return files.filter(file =>
    {
        const file_path = file.name
        const file_name = file_path.split("/").pop() || ""
        // Exclude system files like .DS_Store and Thumbs.db
        return !file_name.startsWith(".") && file_name !== "Thumbs.db"
    })
}


export function find_relative_file_path(file_names: string[]): string | undefined
{
    // Look for index.html in the list of file names
    for (const file_name of file_names)
    {
        if (file_name.match(/^([^/]+\/)?index.html/))
        {
            return file_name.split("/").slice(0, -1).join("/")
        }
    }

    // If index.html is not found, return undefined
    return undefined
}


export interface ProcessedFileMap
{
    relative_path: string
    file_map: { [key: string]: File }
}
export function process_file_paths_of_interactable(file_map: { [key: string]: File }): ProcessedFileMap | string
{
    const file_names = Object.keys(file_map)
    const relative_path = find_relative_file_path(file_names)

    if (relative_path === undefined)
    {
        return ERRORS.ERR41.message
    }

    const processed_file_map: { [key: string]: File } = {}
    for (const [file_path, file] of Object.entries(file_map))
    {
        // Remove the relative path prefix from each file path
        const new_path = file_path.startsWith(relative_path)
            ? file_path.slice(relative_path.length + 1) // +1 to remove the trailing slash
            : file_path
        processed_file_map[new_path] = file
    }

    return {
        relative_path,
        file_map: processed_file_map,
    }
}
