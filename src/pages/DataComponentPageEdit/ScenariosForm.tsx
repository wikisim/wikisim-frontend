import { Checkbox } from "@mantine/core"
import { TargetedEvent } from "preact/compat"
import { useEffect, useState } from "preact/hooks"

import { DEFAULTS } from "core/data/defaults"
import {
    FunctionArgument,
    ScenarioValueUsage,
    type DataComponent,
    type NewDataComponent,
    type Scenario,
} from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"

import BinButton from "../../buttons/BinButton"
import HelpText from "../../buttons/HelpText"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import { WarningMessage } from "../../ui_components/ErrorMessage"
import { ScenarioResults } from "./ScenarioResults"
import "./ScenariosForm.css"


interface ScenariosFormProps
{
    component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function ScenariosForm(props: ScenariosFormProps)
{
    const scenarios = props.component.scenarios || []

    const new_scenario_obj: Scenario = {
        id: Date.now(), // temporary id until committed
        description: "<p></p>", // tiptap empty document
        values: {},
    }

    // Important: render the "new" row inside the same mapped list as existing rows
    // with a stable key so Preact doesn't unmount/remount the scenario on first edit.
    const scenarios_with_draft = [...scenarios, new_scenario_obj]

    return <div className="scenarios">
        <h4>Scenarios</h4>

        {scenarios_with_draft.map((scenario, index) =>
        {
            const is_draft_row = index === scenarios.length

            const on_change = (updated_scenario: Partial<Scenario>) =>
            {
                if (is_draft_row)
                {
                    // First edit of draft row: commit it to the array
                    const committed = { ...new_scenario_obj, ...updated_scenario }
                    const updated_scenarios = [
                        ...scenarios,
                        committed,
                    ]
                    props.on_change({ scenarios: updated_scenarios })
                }
                else
                {
                    // Edit of existing row: update in place
                    const updated_scenarios = scenarios.map(arg =>
                    {
                        if (arg.id === scenario.id)
                        {
                            const modified = { ...arg, ...updated_scenario }
                            return scenario_is_empty(modified) ? null : modified
                        }
                        return arg
                    }).filter(is_scenario)
                    props.on_change({ scenarios: updated_scenarios })
                }
            }

            const delete_entry = () =>
            {
                if (is_draft_row) return

                const updated_scenarios = scenarios.filter(arg => arg.id !== scenario.id)
                props.on_change({ scenarios: updated_scenarios })
            }

            // Key choice keeps the DOM node stable across the draft->committed transition.
            // We use the numeric id (new_scenario_obj.id) for the draft, which becomes the same id
            // when committed on first edit.
            const key = scenario.id

            return <div className="row_to_column scenario-divider" key={key}>
                <div className="data-component-form-column column" style={{ gap: "var(--common-mid-gap)" }}>
                    <ScenarioForm
                        ordinal={index + 1}
                        total_scenarios={scenarios.length}
                        inputs={props.component.function_arguments || []}
                        scenario={scenario}
                        on_change={on_change}
                        delete_entry={delete_entry}
                        is_draft_row={is_draft_row}
                    />
                </div>

                <div className="data-component-form-column column">
                    <ScenarioResults
                        is_draft_row={is_draft_row}
                        scenario={scenario}
                        component={props.component}
                    />
                </div>
            </div>
        })}
    </div>
}


interface ScenarioFormProps
{
    ordinal: number
    total_scenarios: number
    scenario: Scenario
    inputs: FunctionArgument[]
    on_change: (updated_scenario: Partial<Scenario>) => void
    delete_entry: () => void
    is_draft_row: boolean
}

function ScenarioForm(props: ScenarioFormProps)
{
    const { scenario, on_change, is_draft_row } = props
    const [force_rerender_on_delete, set_force_rerender_on_delete] = useState(false)

    useEffect(() =>
    {
        if (force_rerender_on_delete)
        {
            set_force_rerender_on_delete(false)
            props.delete_entry()
        }
    }, [force_rerender_on_delete])
    if (force_rerender_on_delete) return null

    const handle_delete = () =>
    {
        set_force_rerender_on_delete(true)
    }

    // const error = props.is_draft_row ? null : calc_scenario_error(scenario, props.name_counts)
    const inputs_iterated_over = Object.values(scenario.values).filter(v => v.usage === "iterate_over").length

    return <>
        <div className="scenario-form-header row">
            <div>
                {is_draft_row ? "New Scenario" : `Scenario ${props.ordinal} of ${props.total_scenarios}`}
            </div>

            {!is_draft_row && <div className="scenario-delete-button">
                <BinButton
                    on_click={handle_delete}
                    disabled={scenario_is_empty(scenario)}
                />
            </div>}
        </div>

        <div className="scenario-content">
            <TextEditorV2
                label="Description"
                initial_content={scenario.description || ""}
                on_update={description => on_change({ description })}
                single_line={false}
                editable={true}
            />

            <div>Input values</div>

            {props.inputs.map(({ name: input_name, default_value }) =>
            {
                const existing = scenario.values[input_name]
                const iterate_over = existing?.usage === "iterate_over"
                const enable_iterate_over = (
                    iterate_over || (!!existing && inputs_iterated_over < 1)
                )

                return <div className="column" style={{ gap: "var(--common-close-gap)" }} key={input_name}>
                    {!is_draft_row && <WarningMessage
                        show={!default_value && (!existing || !existing.value)}
                        message={!existing
                            ? `No input named "${input_name}" exists any more.  Please delete this scenario value or re-add a function input called "${input_name}" above.`
                            : `No value set, input default is empty.`
                        }
                    />}

                    <div className="row">
                        <TextEditorV1
                            key={input_name}
                            label={input_name}
                            initial_content={existing?.value || ""}
                            on_change={e =>
                            {
                                const value = e.currentTarget.value.trim()
                                const usage = existing?.usage || DEFAULTS.scenario_value_usage
                                const updated_values = { ...scenario.values, [input_name]: { value, usage } }
                                if (value === "") delete updated_values[input_name]
                                on_change({ values: updated_values })
                            }}
                            single_line={true}
                            editable={true}
                        />

                        <div className="row" style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}>
                            Iterate
                            <Checkbox
                                onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                                {
                                    const value = existing?.value || ""
                                    const usage: ScenarioValueUsage = e.currentTarget.checked ? "iterate_over" : "as_is"
                                    const updated_values = { ...scenario.values, [input_name]: { value, usage } }
                                    on_change({ values: updated_values })
                                }}
                                checked={iterate_over}
                                disabled={!enable_iterate_over}
                            />
                            <HelpText message={<>
                                If you set the value of this input to an array or range of values,
                                then use this option to run this scenario over those values rather
                                than treat them as a single value to pass to the input.
                                For example using <code>[1, 2, 3]</code> with this option on will run the scenario 3 times,
                                once with each value, whereas with this option off it will run once
                                with the array <code>[1, 2, 3]</code> as the input value.
                            </>} />
                        </div>
                    </div>
                </div>
            })}
        </div>

        {/* <ErrorMessage show={!!error} message={error || ""} /> */}
    </>
}


function scenario_is_empty(arg: Scenario): boolean
{
    return (!arg.description || browser_convert_tiptap_to_plain(arg.description).trim() === "")
        && Object.values(arg.values).every(v => v.value.trim() === "")
}

function is_scenario(arg: Scenario | null): arg is Scenario
{
    return arg !== null
}
