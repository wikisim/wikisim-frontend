import { JSONPath } from "core/data/interface"

import { extract_data_at_path } from "./extract_data_at_path"


export interface ColumnData
{
    path: JSONPath
    values: (string | number)[]
    numeric_values: (number[] | undefined)
}
export interface ExtractSelectedDataReturn
{
    columns: ColumnData[]
    used_paths: JSONPath[]
    missing_paths: JSONPath[]
    has_graphable_data: boolean
}
export function extract_selected_data(data: unknown, selected_paths: JSONPath[]): ExtractSelectedDataReturn
{
    const columns: ColumnData[] = []
    const used_paths: JSONPath[] = []
    const missing_paths: JSONPath[] = []
    let has_graphable_data = false

    for (const path of selected_paths)
    {
        const { extracted_data, all_missing } = extract_data_at_path(data, path)

        if (all_missing) missing_paths.push(path)
        else
        {
            const values: (string | number)[] = Array.isArray(extracted_data)
                ? extracted_data
                : [extracted_data]

            let is_numeric_column = false
            const numeric_values = values.map(v =>
            {
                const value_as_number = typeof v === "number" ? v : Number(v)
                // As long as one value is a valid number, treat the whole column as numbers
                if (!isNaN(value_as_number)) is_numeric_column = true
                return value_as_number
            })

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            columns.push({ path, values, numeric_values: is_numeric_column ? numeric_values : undefined })

            used_paths.push(path)

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            has_graphable_data = has_graphable_data || is_numeric_column
        }
    }

    return { columns, used_paths, missing_paths, has_graphable_data }
}
