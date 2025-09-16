import { useEffect, useState } from "preact/hooks"

import { DataComponent, NewDataComponent, Scenario } from "core/data/interface"
import { result_string_to_graphable } from "core/evaluation/parse_result"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"
import { evaluate_code_in_browser_sandbox } from "core/evaluator/browser_sandboxed_javascript"
import { EvaluationResponse } from "core/evaluator/interface"
import { compare_results_to_expectations } from "core/expectation/compare_results_to_expectations"

import { ErrorMessage } from "../../ui_components/ErrorMessage"
import { ScenarioExpectations } from "./ScenarioExpectations"
import { ScenarioResultsDisplay } from "./ScenarioResultsDisplay"



interface ScenarioResultsAndExpectationsProps
{
    is_draft_row: boolean
    component: DataComponent | NewDataComponent
    scenario: Scenario
    on_change: (updated_scenario: Partial<Scenario>) => void
}
export function ScenarioResultsAndExpectations(props: ScenarioResultsAndExpectationsProps)
{
    if (props.is_draft_row)
    {
        // We just want a single pixel high placeholder to keep the layout stable
        return <div style={{ height: "1px" }} />
    }

    const javascript = prepare_scenario_javascript(pick(props, "component", "scenario"))

    const [result, set_result] = useState<EvaluationResponse>()


    useEffect(() =>
    {
        async function run_calc()
        {
            const result = await evaluate_code_in_browser_sandbox({
                js_input_value: javascript,
                value_type: props.component.value_type,
                requested_at: performance.now(),
            })
            set_result(result)
        }
        run_calc()

    }, [javascript])


    useEffect(() =>
    {
        const { expected_result } = props.scenario
        if (result?.result && expected_result)
        {
            const data = result_string_to_graphable(result.result)
            const expected_data = result_string_to_graphable(expected_result)

            let match: boolean | undefined
            if (!data)
            {
                match = expected_result
                    ? result.result === expected_result
                    : undefined
            }
            else
            {
                const merged = compare_results_to_expectations(data, expected_data)
                match = merged.expected?.matched.every(d => d)
            }
            // console .log("Expectation met?", match, { result, expected_result, data, expected_data })
            props.on_change({ expectation_met: match })
        }
    }, [result?.result, props.scenario.expected_result])


    return <>
        {result?.error && <ErrorMessage show={true} message={result.error} />}
        {result?.result && <ScenarioResultsDisplay
            result={result.result}
            expected_result={props.scenario.expected_result}
            expectation_met={props.scenario.expectation_met}
        />}
        <ScenarioExpectations
            component={props.component}
            scenario={props.scenario}
            latest_result={result?.result || undefined}
            on_change={props.on_change}
        />
    </>
}


function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>
{
    const ret: Partial<T> = {}
    keys.forEach(key => {
        ret[key] = obj[key]
    })
    return ret as Pick<T, K>
}
