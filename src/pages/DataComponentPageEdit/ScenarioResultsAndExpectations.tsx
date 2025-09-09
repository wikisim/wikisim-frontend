import { useEffect, useState } from "preact/hooks"

import { DataComponent, NewDataComponent, Scenario } from "core/data/interface"
import { prepare_scenario_javascript } from "core/evaluation/prepare_scenario_javascript"

import { EvaluationResponse } from "../../evaluator/interface"
import { evaluate_code_in_sandbox } from "../../evaluator/sandboxed_javascript"
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

    return <>
        {result?.error && <ErrorMessage show={true} message={result.error} />}
        {result?.result && <ScenarioResultsDisplay
            result={result.result}
            expected_result={props.scenario.expected_result}
        />}
        <ScenarioExpectations
            component={props.component}
            scenario={props.scenario}
            latest_result={result?.result || undefined}
            on_change={props.on_change}
        />
    </>
}
