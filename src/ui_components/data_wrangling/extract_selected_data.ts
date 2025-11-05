import { extract_data_at_path } from "./extract_data_at_path"
import { JSONPath, SelectedJSONPath } from "./interface"


export interface ColumnData
{
    header: string
    path: JSONPath
    values: (string | number)[]
}
export interface ExtractSelectedDataReturn
{
    columns: ColumnData[]
    used_paths: SelectedJSONPath[]
    missing_paths: SelectedJSONPath[]
}
export function extract_selected_data(data: unknown, selected_paths: SelectedJSONPath[]): ExtractSelectedDataReturn
{
    const columns: ColumnData[] = []
    const used_paths: SelectedJSONPath[] = []
    const missing_paths: SelectedJSONPath[] = []

    for (const selected_path of selected_paths)
    {
        const { path, alias } = selected_path
        const { extracted_data, all_missing } = extract_data_at_path(data, path)

        if (all_missing) missing_paths.push(selected_path)
        else
        {
            const values: (string | number)[] = Array.isArray(extracted_data)
                ? extracted_data
                : [extracted_data]
            columns.push({ header: alias, path, values })

            used_paths.push(selected_path)
        }
    }

    return { columns, used_paths, missing_paths }
}
