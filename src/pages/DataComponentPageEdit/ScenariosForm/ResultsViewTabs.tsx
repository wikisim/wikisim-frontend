import { ActionIcon, Tooltip } from "@mantine/core"
import IconJson from "@tabler/icons-react/dist/esm/icons/IconJson"
import IconTable from "@tabler/icons-react/dist/esm/icons/IconTable"

// import TableIconSVG from "../../../assets/icons/table.svg"
// import IconGraph from "../../../assets/icons/graph.svg"
import { IconGraph } from "../../../assets/icons"
import "./ResultsViewTab.css"


export function ResultsViewTabs(props: { disabled: boolean })
{
    const table_label = props.disabled ? "Select some attributes from the result to enable table and graph views." : ""

    return <div className="results-view-tabs">
        <ActionIcon
            variant="subtle"
            size="lg"
            title="JSON View"
        >
            <IconJson />
        </ActionIcon>

        <Tooltip label={table_label} position="bottom" disabled={!props.disabled}>
            <ActionIcon
                disabled={props.disabled}
                // onClick={props.on_click}
                variant="subtle"
                size="lg"
            >
                <IconTable />
            </ActionIcon>
        </Tooltip>

        <Tooltip label={table_label} position="bottom" disabled={!props.disabled}>
            <ActionIcon
                disabled={props.disabled}
                variant="subtle"
                size="lg"
            >
                <IconGraph />
            </ActionIcon>
        </Tooltip>

    </div>
}
