import { Scenario } from "core/data/interface"
import { EvaluationResponse } from "core/evaluator/interface"
import { calculate_if_expectation_met } from "core/expectation/calculate_if_expectation_met"

import { HelpToolTip } from "../buttons/HelpText"
import "./ExpectationMet.css"


export function ExpectationMetMessage(props: { met: boolean, on_click?: () => void })
{
    const { met } = props

    return <div
        onClick={props.on_click}
        className={"expectation-met-message" + (met ? " expectation-met" : " expectation-failed")}
    >
        {met ? "Pass" : "Fail"}
    </div>
}


export function ExpectationMet(props: { met?: boolean, on_click?: () => void })
{
    const { met } = props
    if (met === undefined) return null

    return <HelpToolTip
        message={met ? "The results match the expectations" : "The results do not match the expectations"}
    >
        <ExpectationMetMessage
            on_click={props.on_click}
            met={met}
        />
    </HelpToolTip>
}


interface ExpectationsMetProps
{
    scenarios: Scenario[]
    all_scenario_results: { [scenario_index: number]: EvaluationResponse }
}
export function ExpectationsMet(props: ExpectationsMetProps)
{
    const { all_scenario_results, scenarios } = props

    const running_scenarios = Object.keys(all_scenario_results).length < scenarios.length
    let have_expectations = 0
    let failures = 0
    scenarios.forEach((scenario, index) =>
    {
        if (scenario.expected_result === undefined) return
        have_expectations++
        const result = all_scenario_results[index]
        if (result === undefined) return // not run yet
        if (!calculate_if_expectation_met(result, scenario.expected_result)) failures++
    })
    const no_expectations = have_expectations === 0
    if (no_expectations) return null

    const status = failures ? "failures" : (running_scenarios ? "running" : "passed")

    const running = status === "running"
    const passed = status === "passed"

    return <HelpToolTip
        message={running
            ? "Running tests to check expectations are met"
            : passed
                ? "All expectations were met"
                : "One or more expectations were not met"
        }
    >
        <div style={{
            textAlign: "center",
            // marginTop: "0.5em",
            cursor: "pointer",
            color: running ? "black" : "white",
            borderRadius: "var(--radius-border)",
            padding: "0.2em 0.5em",
            backgroundColor: (running ? "var(--colour-border)" :
                (passed ? "var(--colour-success)" : "var(--colour-error)"))
        }}>
            {running ? "Running tests..." : (passed ? "All passed" : `${failures}/${scenarios.length} Failed`)}
        </div>
    </HelpToolTip>
}
