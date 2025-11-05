import {
    CategoryScale,
    ChartData,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from "chart.js"
import { Line } from "react-chartjs-2"

import { LabelsAndResults } from "core/evaluation/interface"
import { result_string_to_graphable } from "core/evaluation/parse_result"
import { compare_results_to_expectations } from "core/expectation/compare_results_to_expectations"
import { MergedLabelsAndResults, ResultPoint } from "core/expectation/interface"
import { colour_actual, colour_expected, colour_mismatch, colour_mismatch_line } from "../../constants"


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface ScenarioResultsDisplayGraphicalProps
{
    expected_result: string | undefined
    expectation_met: boolean | undefined
    data: LabelsAndResults
}
export function ScenarioResultsDisplayGraphical(props: ScenarioResultsDisplayGraphicalProps)
{
    const expected_data = result_string_to_graphable(props.expected_result)
    const merged_data = merge_data(props.data, expected_data)

    const graph_props: ChartData<"line", ResultPoint[], unknown> =
    {
        labels: merged_data.labels,
        datasets: [
            {
                type: "line",
                label: "Scenario Result",
                data: merged_data.results,
                borderColor: props.expectation_met === false ? colour_mismatch_line : colour_actual,
                backgroundColor: merged_data.result_colours ?? colour_actual,
                yAxisID: "y",
                pointRadius: 4,
                pointHoverRadius: 6,
                // fill: true,
            }
        ],
    }

    if (merged_data.expected)
    {
        graph_props.datasets.push({
            type: "line",
            label: "Expected Result",
            data: merged_data.expected.results,
            borderColor: colour_expected,
            backgroundColor: "white",
            borderDash: [5, 5],
            yAxisID: "y",
        })
    }

    return <>
        {/* {props.result} */}
        <Line data={graph_props} />
    </>
}


function merge_data(data: LabelsAndResults, expected_data: LabelsAndResults | false): MergedLabelsAndResults & { result_colours?: string[] }
{
    const merged = compare_results_to_expectations(data, expected_data)

    if (!merged.expected) return merged

    const result_colours: string[] = merged.expected.matched.map(matched =>
    {
        return matched ? colour_actual : colour_mismatch
    })

    return { ...merged, result_colours }
}
