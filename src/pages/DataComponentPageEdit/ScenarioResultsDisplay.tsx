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
import { HelpToolTip } from "../../buttons/HelpText"


const colour_actual = "rgb(28, 126, 214)" // --colour-primary-blue
const colour_expected = "rgb(255, 192, 120)" // --colour-warning
const colour_mismatch = "rgb(250, 82, 82)" // --colour-error
const colour_mismatch_line = "rgb(255, 168, 168)" // --colour-invalid


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface ScenarioResultsDisplayProps
{
    result: string
    expected_result: string | undefined
}

export function ScenarioResultsDisplay(props: ScenarioResultsDisplayProps)
{
    const data = result_string_to_graphable(props.result)
    const expected_data = result_string_to_graphable(props.expected_result)

    if (!data)
    {
        const match = props.expected_result
            ? props.result === props.expected_result
            : undefined

        return <pre style={{ textAlign: "center", padding: "30px 0" }}>
            Result = {props.result}<br/>
            {props.expected_result && `Expected = ${props.expected_result}`}<br/>
            <ExpectationsMet met={match} />
        </pre>
    }

    const merged_data = merge_data(data, expected_data)

    const graph_props: ChartData<"line", ResultPoint[], unknown> =
    {
        labels: merged_data.labels,
        datasets: [
            {
                type: "line",
                label: "Scenario Result",
                data: merged_data.results,
                borderColor: merged_data.any_error ? colour_mismatch_line : colour_actual,
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
        <ExpectationsMet mismatch={merged_data.any_error} />
    </>
}


function merge_data(data: LabelsAndResults, expected_data: LabelsAndResults | false): MergedLabelsAndResults & { any_error?: boolean, result_colours?: string[] }
{
    const merged = compare_results_to_expectations(data, expected_data)

    if (!merged.expected) return merged

    let any_error = false
    const result_colours: string[] = merged.expected.matched.map(matched =>
    {
        any_error = any_error || !matched
        return matched ? colour_actual : colour_mismatch
    })

    return { ...merged, any_error, result_colours }
}


function ExpectationsMet(props: { met?: boolean, mismatch?: boolean })
{
    if (props.met === undefined && props.mismatch === undefined) return null

    const met = props.met ?? !props.mismatch

    return <HelpToolTip
        message={met ? "The results match the expectations" : "The results do not match the expectations"}
    >
        <div style={{
            textAlign: "center",
            marginTop: "0.5em",
            color: "white",
            borderRadius: "var(--radius-border)",
            padding: "0.2em 0.5em",
            backgroundColor: met ? "var(--colour-success)" : "var(--colour-error)"
        }}>
            {met ? "Pass" : "Fail"}
        </div>
    </HelpToolTip>
}
