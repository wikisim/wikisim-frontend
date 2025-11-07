import { Table } from "@mantine/core"
import { TargetedEvent } from "preact/compat"
import { useCallback, useEffect, useMemo } from "preact/hooks"

import { JSONPath, MapSelectedPathToName } from "core/data/interface"

import { debounce } from "../../utils/debounce"
import { ExtractSelectedDataReturn } from "./extract_selected_data"
import "./TableViewer.css"


interface TableViewerProps
{
    selected_paths: JSONPath[]
    selected_path_names: MapSelectedPathToName
    upsert_path_name: (path: JSONPath, name?: string) => void
    extracted_data: ExtractSelectedDataReturn
}
export function TableViewer(props: TableViewerProps)
{
    const { extracted_data } = props

    const table_rows = useMemo(() =>
    {
        const { columns, missing_paths } = extracted_data
        const missing_paths_set = new Set(missing_paths.map(mp => JSON.stringify(mp)))

        const columns_existing = columns.filter(col => !missing_paths_set.has(JSON.stringify(col.path)))

        // All the columns should have the same number of rows
        const max_rows = columns_existing[0]?.values.length || 0

        const table_rows = []
        for (let row_index = 0; row_index < max_rows; row_index++)
        {
            const row: (string | number)[] = []
            for (const col of columns_existing)
            {
                row.push(col.values[row_index] ?? "")
            }
            table_rows.push(row)
        }
        return table_rows
    }, [extracted_data])

    const debounced_upsert_path_name = useCallback(debounce(props.upsert_path_name, 500), [props.upsert_path_name])
    useEffect(() => () =>
    {
        debounced_upsert_path_name.commit()
    }, [debounced_upsert_path_name])


    return <Table withColumnBorders withRowBorders highlightOnHover className="json-table-viewer">
        <Table.Thead>
            <Table.Tr>
                {props.selected_paths.map(path => (
                    <EditableHeader
                        key={JSON.stringify(path)}
                        path={path}
                        selected_path_names={props.selected_path_names}
                        upsert_path_name={debounced_upsert_path_name}
                    />
                ))}
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
            {table_rows.map((row, row_index) =>
            <Table.Tr key={row_index}>
                {row.map((cell, index) => <Table.Td key={index}>{cell}</Table.Td>)}
            </Table.Tr>)}
        </Table.Tbody>
    </Table>
}


function EditableHeader(props: {
    path: JSONPath
    selected_path_names: MapSelectedPathToName
    upsert_path_name: (path: JSONPath, name: string) => void
})
{
    const { path, selected_path_names, upsert_path_name } = props
    const value = selected_path_names[JSON.stringify(path)] || ""

    return <Table.Th title={value}>
        <input
            className="header"
            type="text"
            value={value}
            onChange={(e: TargetedEvent<HTMLInputElement>) =>
            {
                const new_name = e.currentTarget.value
                upsert_path_name(path, new_name)
            }}
        />
    </Table.Th>
}
