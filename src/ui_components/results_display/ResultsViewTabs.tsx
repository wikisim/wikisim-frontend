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
}
export function ResultsViewTabs(props: ResultsViewTabsProps)
{
    const { selected_tab, on_select_tab } = props
    const disabled = props.valid_selected_paths.length === 0
    const table_label = disabled ? "Select some attributes from the result to enable table and graph views." : ""

    return <div className="results-view-tabs">
        <ActionIcon
            variant={selected_tab === "json" ? "primary" : "subtle"}
            onClick={() => on_select_tab("json")}
            size="lg"
            title="JSON View"
        >
            <IconJson />
        </ActionIcon>

        <Tooltip label={table_label} position="bottom" disabled={!disabled}>
            <ActionIcon
                disabled={disabled}
                variant={selected_tab === "table" ? "primary" : "subtle"}
                onClick={() => on_select_tab("table")}
                size="lg"
                title={!disabled && "Table View"}
            >
                <IconTable />
            </ActionIcon>
        </Tooltip>

        <Tooltip label={table_label} position="bottom" disabled={!disabled}>
            <ActionIcon
                disabled={disabled}
                variant={selected_tab === "graph" ? "primary" : "subtle"}
                onClick={() => on_select_tab("graph")}
                size="lg"
                title={!disabled && "Graph View"}
            >
                <IconGraph />
            </ActionIcon>
        </Tooltip>

    </div>
}
