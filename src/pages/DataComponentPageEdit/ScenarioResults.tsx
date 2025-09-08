import {
    CategoryScale,
    ChartData,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from "chart.js"
import { useEffect, useState } from "preact/hooks"
import { Line } from "react-chartjs-2"

import { DataComponent, NewDataComponent, Scenario } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"

import { EvaluationResponse } from "../../evaluator/interface"
import { evaluate_code_in_sandbox } from "../../evaluator/sandboxed_javascript"
import { ErrorMessage } from "../../ui_components/ErrorMessage"



interface ScenarioResultsProps
{
    is_draft_row: boolean
    component: DataComponent | NewDataComponent
    scenario: Scenario
}
export function ScenarioResults(props: ScenarioResultsProps)
{
    if (props.is_draft_row)
    {
        // We just want a single pixel high placeholder to keep the layout stable
        return <div style={{ height: "1px" }} />
    }

    const javascript = prepare_scenario_javascript(props)

    const [result, set_result] = useState<EvaluationResponse>()

    useEffect(() =>
    {
        async function run_calc()
        {
            const result = await evaluate_code_in_sandbox({ value: javascript })
            set_result(result)
        }
        run_calc()

    }, [javascript])

    return <div>
        {result?.error && <ErrorMessage show={true} message={result.error} />}
        {result?.result && <ScenarioResultsDisplay result={result.result} />}
    </div>
}



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
}

export function ScenarioResultsDisplay(props: ScenarioResultsDisplayProps)
{
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json = JSON.parse(props.result)
    const data = assert_json_is_labels_and_results(json)
    if (!data) return <pre style={{ textAlign: "center", padding: "30px 0" }}>
        Result = {props.result}
    </pre>

    const graph_data: ChartData<"line", number[], unknown> =
    {
        labels: data.labels,
        datasets:
        [
            {
                type: "line",
                label: "Scenario Result",
                data: data.results,
                borderColor: "rgb(53, 162, 235)",
                backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
        ],
    }

    return <>
        {/* {props.result} */}
        <Line data={graph_data} />
    </>
}


function assert_json_is_labels_and_results(json: any): { labels: number[], results: number[] } | false
{
    if (typeof json !== "object" || json === null) return false

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { labels, results } = json
    if (!Array.isArray(labels) || !Array.isArray(results)) return false

    if (!labels.every(l => typeof l === "number")) return false
    if (!results.every(l => typeof l === "number")) return false

    return { labels, results }
}
