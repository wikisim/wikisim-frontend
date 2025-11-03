import { useMemo } from "preact/hooks"
import { extract_data_at_path } from "./extract_data_at_path"
import { SelectedJSONPath } from "./interface"


interface TableViewerProps
{
    data: unknown
    selected_paths: SelectedJSONPath[]
}
export function TableViewer(props: TableViewerProps)
{
    const { data, selected_paths } = props

    const table_data = useMemo(() =>
    {
        return extract_table_data(data, selected_paths)
    }, [data, selected_paths])

    return <div>
        <h2>Table Viewer</h2>
        <table cellPadding={5} cellSpacing={0}>
            <thead>
                <tr>
                    {table_data.map(col => <th key={col.header}>{col.header}</th>)}
                </tr>
            </thead>
            <tbody>
                {Array.from(
                    { length: Math.max(...table_data.map(col => col.values.length)) },
                    (_, row_index) => (
                        <tr key={row_index}>
                            {table_data.map(col => (
                                <td key={col.header}>
                                    {col.values[row_index] ?? ""}
                                </td>
                            ))}
                        </tr>
                    )
                )}
            </tbody>
        </table>
    </div>
}


interface ColumnData
{
    header: string
    values: (string | number)[]
}
function extract_table_data(data: unknown, selected_paths: SelectedJSONPath[]): ColumnData[]
{
    const columns: ColumnData[] = []

    for (const selected_path of selected_paths)
    {
        const { path, alias } = selected_path

        const extracted_data = extract_data_at_path(data, path)

        const values: (string | number)[] = (
            Array.isArray(extracted_data)
                ? extracted_data
                : [extracted_data]
        )

        columns.push({ header: alias, values })
    }

    return columns
}
