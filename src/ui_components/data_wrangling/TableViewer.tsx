import { Table } from "@mantine/core"
import { useMemo } from "preact/hooks"

import { ExtractSelectedDataReturn } from "./extract_selected_data"


interface TableViewerProps
{
    extracted_data: ExtractSelectedDataReturn
}
export function TableViewer(props: TableViewerProps)
{
    const { extracted_data } = props

    const { table_header, table_rows } = useMemo(() =>
    {
        const { columns, missing_paths } = extracted_data
        const missing_paths_set = new Set(missing_paths.map(mp => JSON.stringify(mp.path)))

        const columns_existing = columns.filter(col => !missing_paths_set.has(JSON.stringify(col.path)))
        const table_header: string[] = columns_existing.map(col => col.header)

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
        return { table_header, table_rows }
    }, [extracted_data])

    return <Table withColumnBorders withRowBorders highlightOnHover>
        <Table.Thead>
            <Table.Tr>
                {table_header.map(header => (
                    <Table.Th key={header}>{header}</Table.Th>
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
