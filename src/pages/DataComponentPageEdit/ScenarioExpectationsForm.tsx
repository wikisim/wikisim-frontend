
import { Button } from "@mantine/core"

import { Scenario } from "core/data/interface"

import BinButton from "../../buttons/BinButton"
import HelpText from "../../buttons/HelpText"
import { ExpectationMetMessage } from "../../ui_components/ExpectationMet"



interface ScenarioGraphProps
{
    scenario: Scenario
    latest_result: string | undefined
    on_change: (updated_scenario: Partial<Scenario>) => void
}
export function ScenarioExpectationsForm(props: ScenarioGraphProps)
{
    const has_expectation = !!props.scenario.expected_result

    return <div className="row" style={{ justifyContent: "center", alignItems: "center", gap: "var(--gap-close)" }}>
        {/* <HelpToolTip
            message={<>
                You can save these results as expectations of how function should
                behave with this scenario's input values.
                When set, if the function is edited later,
                the scenario will be re-evaluated and the results compared to
                these expectations.
                If the results differ, the scenario will be marked as failing
                and you will be alerted when editing the function.
            </>}
        > */}
            <Button
                disabled={!props.latest_result}
                size="xs"
                style={{ marginLeft: "0.5em", marginRight: "0.5em" }}
                onClick={() =>
                {
                    props.on_change({ expected_result: props.latest_result })
                }}
            >
                {!has_expectation ? "Use results as expectations" : "Update expectations"}
            </Button>
        {/* </HelpToolTip> */}

        <HelpText message={<>
            You can save these results as expectations of how function should
            behave with this scenario's input values.
            When set, if the function is edited later,
            the scenario will be re-evaluated and the results compared to
            these expectations.
            If the results are the same, the scenario will be shown as passing with
            a <ExpectationMetMessage met={true} />
            If the results differ, the scenario will been shown as failing with
            a <ExpectationMetMessage met={false} />
        </>} />

        {has_expectation && <BinButton
            on_click={() => props.on_change({ expected_result: undefined })}
            label="Clear expectations"
        />}
    </div>
}
