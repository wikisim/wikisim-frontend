import { extract_data_at_path } from "./extract_data_at_path"
import { JSONPath } from "./interface"


export interface ColumnData
{
    path: JSONPath
    values: (string | number)[]
}
export interface ExtractSelectedDataReturn
{
    columns: ColumnData[]
    used_paths: JSONPath[]
    missing_paths: JSONPath[]
}
export function extract_selected_data(data: unknown, selected_paths: JSONPath[]): ExtractSelectedDataReturn
{
    const columns: ColumnData[] = []
    const used_paths: JSONPath[] = []
    const missing_paths: JSONPath[] = []

    for (const path of selected_paths)
    {
        const { extracted_data, all_missing } = extract_data_at_path(data, path)

        if (all_missing) missing_paths.push(path)
        else
        {
            const values: (string | number)[] = Array.isArray(extracted_data)
                ? extracted_data
                : [extracted_data]
            columns.push({ path, values })

            used_paths.push(path)
        }
    }

    return { columns, used_paths, missing_paths }
}
