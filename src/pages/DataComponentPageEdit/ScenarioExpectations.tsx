
import { Button } from "@mantine/core"

import { Scenario } from "core/data/interface"

import BinButton from "../../buttons/BinButton"
import HelpText from "../../buttons/HelpText"




interface ScenarioGraphProps
{
    scenario: Scenario
    latest_result: string | undefined
    on_change: (updated_scenario: Partial<Scenario>) => void
}
export function ScenarioExpectations(props: ScenarioGraphProps)
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
            If the results differ, the scenario will be marked as failing
            and you will be alerted when editing the function.
        </>} />

        {has_expectation && <BinButton
            on_click={() => props.on_change({ expected_result: undefined })}
            label="Clear expectations"
        />}
    </div>
}
