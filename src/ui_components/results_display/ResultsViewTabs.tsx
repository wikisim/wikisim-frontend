import { ActionIcon, Tooltip } from "@mantine/core"
import IconJson from "@tabler/icons-react/dist/esm/icons/IconJson"
import IconTable from "@tabler/icons-react/dist/esm/icons/IconTable"

import { JSONPath } from "core/data/interface"

import { IconGraph } from "../../assets/icons"
import "./ResultsViewTab.css"
import { ResultsViewType } from "./interface"


interface ResultsViewTabsProps
{
    selected_tab: ResultsViewType
    on_select_tab: (tab: ResultsViewType) => void
    valid_selected_paths: JSONPath[]
    has_graphable_data: boolean
}
export function ResultsViewTabs(props: ResultsViewTabsProps)
{
    const { selected_tab, on_select_tab } = props
    const disabled_table = props.valid_selected_paths.length === 0
    const disabled_graph = props.has_graphable_data === false
    const table_label = disabled_table ? "Select some attributes from the result to enable table and graph views." : ""
    const graph_label = disabled_graph ? "Select some attributes containing numbers." : ""

    const show_graph = !disabled_table && !disabled_graph

    return <div className="results-view-tabs">
        <ActionIcon
            variant={selected_tab === "json" ? "primary" : "subtle"}
            onClick={() => on_select_tab("json")}
            size="lg"
            title="JSON View"
        >
            <IconJson />
        </ActionIcon>

        <Tooltip label={table_label} position="bottom" disabled={!disabled_table}>
            <ActionIcon
                disabled={disabled_table}
                variant={selected_tab === "table" ? "primary" : "subtle"}
                onClick={() => on_select_tab("table")}
                size="lg"
                title={!disabled_table ? "Table View" : undefined}
            >
                <IconTable />
            </ActionIcon>
        </Tooltip>

        <Tooltip label={table_label || graph_label} position="bottom" disabled={show_graph}>
            <ActionIcon
                disabled={!show_graph}
                variant={selected_tab === "graph" ? "primary" : "subtle"}
                onClick={() => on_select_tab("graph")}
                size="lg"
                title={show_graph ? "Graph View" : undefined}
            >
                <IconGraph />
            </ActionIcon>
        </Tooltip>

    </div>
}
