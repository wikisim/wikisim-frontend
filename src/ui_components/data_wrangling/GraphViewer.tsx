import { ChartData, ChartDataset } from "chart.js"
import { useMemo } from "preact/hooks"
import { Line } from "react-chartjs-2"

import { ResultPoint } from "core/expectation/interface"

import { get_line_graph_colour } from "../../constants"
import { ColumnData } from "./extract_selected_data"
import { MapSelectedPathToName } from "./interface"


interface GraphViewerProps
{
    data_columns: ColumnData[]
    selected_path_names: MapSelectedPathToName
}
export function GraphViewer(props: GraphViewerProps)
{
    const { data_columns: extracted_data } = props

    // Prepare LabelsAndResults for ScenarioResultsDisplayGraphical
    const graph_props = useMemo<ChartData<"line", ResultPoint[], unknown>>(() => {
        // The extracted_data has all the columns having the same length, so
        // just use the first one and, for now, use the indexes as labels.
        const labels = extracted_data[0]?.values.map((_, i) => i + 1) || []
        const datasets: ChartDataset<"line", ResultPoint[]>[] = []

        extracted_data.forEach((col, index) =>
        {
            // As long as one value is a number, treat the whole column as numbers
            const is_numeric_column = col.values.some(v => typeof v === "number")
            if (!is_numeric_column) return
            const data: ResultPoint[] = col.values.map(v => (typeof v === "number" ? v : Number(v)))
            datasets.push({
                type: "line",
                label: props.selected_path_names[JSON.stringify(col.path)],
                data,
                borderColor: get_line_graph_colour(index),
                backgroundColor: get_line_graph_colour(index, 0.4),
                yAxisID: "y",
                pointRadius: 4,
                pointHoverRadius: 6,
            })
        })

        return { labels, datasets }
    }, [extracted_data])

    return <Line data={graph_props} />
}
