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
import stringify from "json-stringify-pretty-compact"
import { Line } from "react-chartjs-2"

import { LabelsAndResults } from "core/evaluation/interface"
import {
    assert_result_json_is_graphable,
    result_string_to_graphable,
    result_string_to_json,
} from "core/evaluation/parse_result"
import { compare_results_to_expectations } from "core/expectation/compare_results_to_expectations"
import { MergedLabelsAndResults, ResultPoint } from "core/expectation/interface"

import { useCallback } from "preact/hooks"
import { JSONViewerEventAndStateHandlers } from "./data_wrangling/event_and_state_handlers"
import { JSONViewer } from "./data_wrangling/JSONViewer"
import { ExpectationMet } from "./ExpectationMet"
import "./ScenarioResultsDisplay.css"


const colour_actual = "rgb(28, 126, 214)" // --requires-manual-sync-colour-primary-blue-rgb
const colour_expected = "rgb(255, 192, 120)" // --requires-manual-sync-colour-warning
const colour_mismatch = "rgb(250, 82, 82)" // --requires-manual-sync-colour-error
const colour_mismatch_line = "rgb(255, 168, 168)" // --requires-manual-sync-colour-invalid


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
    expectation_met: boolean | undefined
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean | ((o: boolean) => boolean)) => void
    json_viewer_event_and_state_handlers?: JSONViewerEventAndStateHandlers
}

export function ScenarioResultsDisplay(props: ScenarioResultsDisplayProps)
{
    const on_click_header = useCallback(() =>
    {
        props.set_scenario_row_opened(scenario_row_opened => !scenario_row_opened)
    }, [props.set_scenario_row_opened])

    return <div className="scenario-results-display">

        <ExpectationMet
            met={props.expectation_met}
            on_click={on_click_header}
        />

        {props.scenario_row_opened && <ScenarioResultsDisplayInner
            result={props.result}
            expected_result={props.expected_result}
            expectation_met={props.expectation_met}
            json_viewer_event_and_state_handlers={props.json_viewer_event_and_state_handlers}
        />}
    </div>
}


interface ScenarioResultsDisplayInnerProps
{
    result: string
    expected_result: string | undefined
    expectation_met: boolean | undefined
    json_viewer_event_and_state_handlers?: JSONViewerEventAndStateHandlers
}
function ScenarioResultsDisplayInner(props: ScenarioResultsDisplayInnerProps)
{
    const parsed_json = result_string_to_json(props.result)

    if (!parsed_json)
    {
        // Not sure if this will ever happen as the results should always be a
        // string of JSON
        return <>
            <pre className="wrap-pre-text">
                Result = {props.result}<br/>
            </pre>
            <pre className="wrap-pre-text">
                {props.expectation_met && `Result matched expected result` }
                {!props.expectation_met && props.expected_result && `Expected = ${props.expected_result}`}<br/>
            </pre>
        </>
    }

    const data = assert_result_json_is_graphable(parsed_json.parsed)
    if (!data)
    {
        const expected_json = result_string_to_json(props.expected_result || "")
        const expected_result_str = expected_json ? stringify(expected_json.parsed, { maxLength: 60 }) : props.expected_result

        return <>
            <pre>
                Result =
                {/* {stringify(parsed_json.parsed, { maxLength: 60 })}<br/> */}
                <JSONViewer
                    data={parsed_json.parsed}
                    initial_collapsed_to_level={2}
                    {...props.json_viewer_event_and_state_handlers}
                />
            </pre>
            <pre className="wrap-pre-text">
                {props.expectation_met && `Result matched expected result` }
                {!props.expectation_met && expected_result_str && `Expected = ${expected_result_str}`}<br/>
            </pre>
        </>
    }

    const expected_data = result_string_to_graphable(props.expected_result)
    const merged_data = merge_data(data, expected_data)

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
