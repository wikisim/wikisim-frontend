
import { Button } from "@mantine/core"

import { Scenario } from "core/data/interface"

import BinButton from "../../buttons/BinButton"
import HelpText from "../../buttons/HelpText"
import { ExpectationMetMessage } from "../../ui_components/ExpectationMet"
import { ResultsViewType } from "../../ui_components/results_display/interface"



interface ScenarioGraphProps
{
    scenario: Scenario
    latest_result: string | undefined
    on_upsert_scenario: (updated_scenario: Partial<Scenario>) => void
    selected_results_view_tab: ResultsViewType
}
export function ScenarioExpectationsForm(props: ScenarioGraphProps)
{
    const has_expectation = !!props.scenario.expected_result

    const not_on_json_view = props.selected_results_view_tab !== "json"

    return <div className="row" style={{ justifyContent: "center", alignItems: "center", gap: "var(--vgap-small)" }}>
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
                disabled={!props.latest_result || not_on_json_view}
                title={not_on_json_view ? "Switch to JSON view to use result as expectation" : undefined}
                size="xs"
                style={{ marginLeft: "0.5em", marginRight: "0.5em" }}
                onClick={() =>
                {
                    props.on_upsert_scenario({ expected_result: props.latest_result })
                }}
            >
                {!has_expectation ? "Use result as expectation" : "Update expectation"}
            </Button>
        {/* </HelpToolTip> */}

        <HelpText message={<>
            {not_on_json_view && <div style={{ color: "var(--mantine-color-gray-6)" }}>
                Switch to JSON view to set or update expectations.
            </div>}

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
            disabled={not_on_json_view}
            on_click={() => props.on_upsert_scenario({ expected_result: undefined })}
            label="Clear expectations"
        />}
    </div>
}
