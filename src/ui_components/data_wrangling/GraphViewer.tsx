import { ActionIcon, Modal } from "@mantine/core"
import IconSettings from "@tabler/icons-react/dist/esm/icons/IconSettings"
import { ChartData, ChartDataset, ChartOptions } from "chart.js"
import { useEffect, useMemo, useState } from "preact/hooks"
import { Line } from "react-chartjs-2"

import { MapSelectedPathToName, Scenario, ScenarioGraph } from "core/data/interface"
import { ResultPoint } from "core/expectation/interface"

import { inverse_lerp, lerp } from "../../../lib/core/src/utils/lerp"
import { get_line_graph_colour } from "../../constants"
import pub_sub from "../../pub_sub"
import { is_mobile_device } from "../../utils/is_mobile_device"
import { get_screen_characteristics } from "../../utils/screen"
import { ColumnData } from "./extract_selected_data"
import "./GraphViewer.css"


interface ChartProps
{
    data: ChartData<"line", ResultPoint[], unknown>
    options?: ChartOptions<"line">
}


interface GraphViewerProps
{
    data_columns: ColumnData[]
    selected_path_names: MapSelectedPathToName
    graph: ScenarioGraph | undefined
    on_upsert_scenario: (updated_scenario: Partial<Scenario>) => void
    editing: boolean
}
export function GraphViewer(props: GraphViewerProps)
{
    const { data_columns, graph } = props

    const [hovering, set_hovered] = useState(false)
    const [show_graph_configuration_modal, set_show_graph_configuration_modal] = useState(false)

    const [screen_size, set_screen_size] = useState(get_screen_characteristics())
    useEffect(() => pub_sub.sub("screen_size_changed", set_screen_size), [])
    const screen_width_t = inverse_lerp(500, 800, screen.width)

    // Prepare LabelsAndResults for ScenarioResultsDisplayGraphical
    const chart_props = useMemo<ChartProps>(() => {
        // The data_columns has all the columns having the same length, so
        // unless graph.x_axis_path is set then just use the first one and, for
        // now, use the indexes as labels.
        const x_axis_column = get_column_for_path(graph, data_columns)
        let labels: string[] | undefined = x_axis_column ? x_axis_column.values.map(v => String(v)) : undefined
        labels = labels || data_columns[0]?.values.map((_, i) => `${i + 1}`) || []

        const datasets: ChartDataset<"line", ResultPoint[]>[] = []

        data_columns.forEach((col, index) =>
        {
            if (!col.numeric_values) return
            // Skip the x-axis column
            if (JSON.stringify(col.path) === graph?.x_axis_path) return

            datasets.push({
                type: "line",
                label: props.selected_path_names[JSON.stringify(col.path)],
                // hidden: true,
                data: col.numeric_values,
                borderColor: get_line_graph_colour(index),
                backgroundColor: get_line_graph_colour(index, 0.4),
                yAxisID: "y",
                pointRadius: lerp(2, 4, screen_width_t),
                pointHoverRadius: lerp(3, 6, screen_width_t),
            })
        })

        const options: ChartOptions<"line"> = {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: x_axis_column
                            ? props.selected_path_names[JSON.stringify(x_axis_column.path)]
                            : undefined,
                    },
                },
            }
        }

        return { data: { labels, datasets }, options }
    }, [graph, data_columns, screen_width_t])


    const is_hovering_class = (hovering || is_mobile_device()) ? " is_hovered" : ""
    const options: ChartOptions<"line"> = {
        aspectRatio: screen_size.width < 500 ? 1.3 : undefined,
        ...chart_props.options,
    }


    return <div
        onPointerEnter={() => set_hovered(true)}
        onPointerLeave={() => set_hovered(false)}
    >
        {props.editing && <div className={"graph_settings" + is_hovering_class}>
            <ActionIcon
                onClick={() => set_show_graph_configuration_modal(!show_graph_configuration_modal)}
                size="lg"
                title="Configure graphs"
            >
                <IconSettings />
            </ActionIcon>
        </div>}
        <Line
            // Use the orientation as part of the key to force re-rendering when
            // orientation changes
            key={screen_size.orientation}
            data={chart_props.data}
            options={options}
        />

        <GraphConfigurationModal
            opened={show_graph_configuration_modal}
            on_close={() => set_show_graph_configuration_modal(false)}
            data_columns={data_columns}
            selected_path_names={props.selected_path_names}
            graph={graph}
            on_upsert_scenario={props.on_upsert_scenario}
        />
    </div>
}



interface GraphConfigurationModalProps
{
    opened: boolean
    on_close: () => void
    data_columns: ColumnData[]
    selected_path_names: MapSelectedPathToName
    graph: ScenarioGraph | undefined
    on_upsert_scenario: (updated_scenario: Partial<Scenario>) => void
}
function GraphConfigurationModal(props: GraphConfigurationModalProps)
{
    const x_axis_column = get_column_for_path(props.graph, props.data_columns)

    return <Modal
        opened={props.opened}
        onClose={props.on_close}
        centered
        size="lg"
        title={<h2>Edit Graph</h2>}
    >
        <div className="vertical-gap" />

        <div>
            Select x-axis labels
        </div>

        <div>
            <XAxisRadioOption
                key="default_x_axis"
                checked={x_axis_column === undefined}
                on_change={() =>
                {
                    props.on_upsert_scenario({
                        graphs: [{
                            ...props.graph,
                            x_axis_path: undefined,
                        }],
                    })
                }}
                label="default (indexes)"
            />

            {props.data_columns.map((col, index) => (
                <XAxisRadioOption
                    key={index}
                    checked={props.graph?.x_axis_path === JSON.stringify(col.path)}
                    on_change={() =>
                    {
                        props.on_upsert_scenario({
                            graphs: [{
                                ...props.graph,
                                x_axis_path: JSON.stringify(col.path),
                            }],
                        })
                    }}
                    label={props.selected_path_names[JSON.stringify(col.path)] || JSON.stringify(col.path)}
                />
            ))}
        </div>

        <div className="vertical-gap" />
    </Modal>
}


function XAxisRadioOption(props: { checked: boolean, on_change: () => void, label: string })
{
    return <div>
        <label>
            <input
                type="radio"
                name="x_axis_path"
                checked={props.checked}
                onChange={props.on_change}
            />
            {props.label}
        </label>
    </div>
}


function get_column_for_path(graph: ScenarioGraph | undefined, data_columns: ColumnData[]): ColumnData | undefined
{
    if (graph?.x_axis_path)
    {
        const x_axis_column = data_columns.find(col =>
            JSON.stringify(col.path) === graph.x_axis_path
        )
        return x_axis_column
    }

    return undefined
}
