import { useEffect, useState } from "preact/hooks"

import { DataComponent, NewDataComponent, Scenario } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { EvaluationResponse } from "core/evaluator/interface"
import { calculate_if_expectation_met } from "core/expectation/calculate_if_expectation_met"

import { ErrorMessage } from "../../ui_components/ErrorMessage"
import { ScenarioResultsDisplay } from "../../ui_components/results_display/ScenarioResultsDisplay"
import { ScenarioExpectationsForm } from "./ScenarioExpectationsForm"



interface ScenarioResultsAndExpectationsProps
{
    is_draft_row: boolean
    component: DataComponent | NewDataComponent
    scenario: Scenario
    debugging: boolean
    on_change: (updated_scenario: Partial<Scenario>) => void
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean | ((o: boolean) => boolean)) => void
}
export function ScenarioResultsAndExpectations(props: ScenarioResultsAndExpectationsProps)
{
    if (props.is_draft_row)
    {
        // We just want a single pixel high placeholder to keep the layout stable
        return <div style={{ height: "1px" }} />
    }

    const javascript = prepare_scenario_javascript({
        component: props.component,
        scenario: props.scenario,
        debugging: props.debugging,
    })

    const [result, set_result] = useState<EvaluationResponse>()


    useEffect(() =>
    {
        async function run_calc()
        {
            const result = await evaluate_code_in_browser_sandbox({
                js_input_value: javascript,
                requested_at: performance.now(),
            })
            set_result(result)
        }
        run_calc()

    }, [javascript])


    useEffect(() =>
    {
        const { expected_result, expectation_met } = props.scenario
        if (result?.result && expected_result)
        {
            const expectation_met = calculate_if_expectation_met(result, expected_result)
            // console .log("Expectation met?", expectation_met, { result, expected_result, data, expected_data })
            props.on_change({ expectation_met })
        }
        // Ensure that if the expected_result is removed, we also clear expectation_met
        else if (expectation_met !== undefined)
        {
            props.on_change({ expectation_met: undefined })
        }
    }, [result?.result, props.scenario.expected_result])


    return <>
        {result?.error && <ErrorMessage show={true} message={result.error} />}
        {result?.result && <ScenarioResultsDisplay
            result={result.result}
            expected_result={props.scenario.expected_result}
            expectation_met={props.scenario.expectation_met}
            scenario_row_opened={props.scenario_row_opened}
            set_scenario_row_opened={props.set_scenario_row_opened}
        />}
        {props.scenario_row_opened && <ScenarioExpectationsForm
            scenario={props.scenario}
            latest_result={result?.result || undefined}
            on_change={props.on_change}
        />}
    </>
}
