import { useEffect, useState } from "preact/hooks"

import {
    type DataComponent,
    type NewDataComponent,
    type Scenario,
} from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"

import BinButton from "../../buttons/BinButton"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import "./ScenariosForm.css"


interface ScenariosFormProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function ScenariosForm(props: ScenariosFormProps)
{
    const scenarios = props.draft_component.scenarios || []

    // useEffect(() =>
    // {
    //     props.on_change({ scenarios: [] })
    // }, [])

    const input_names = (props.draft_component.function_arguments || []).map(arg => arg.name)

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

            return <>
                <ScenarioForm
                    key={key}
                    ordinal={index + 1}
                    total_scenarios={scenarios.length}
                    input_names={input_names}
                    scenario={scenario}
                    on_change={on_change}
                    delete_entry={delete_entry}
                    is_draft_row={is_draft_row}
                />

                <div className="scenario-divider" />
            </>
        })}
    </div>
}


interface ScenarioFormProps
{
    ordinal: number
    total_scenarios: number
    scenario: Scenario
    input_names: string[]
    on_change: (updated_scenario: Partial<Scenario>) => void
    delete_entry: () => void
    is_draft_row: boolean
}

function ScenarioForm(props: ScenarioFormProps)
{
    const { scenario, on_change } = props
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

    return <div className="column" style={{ gap: "var(--common-close-form-hgap)" }}>
        <div className="scenario-form-header row">
            <div>
                {props.is_draft_row ? "New Scenario" : `Scenario ${props.ordinal} of ${props.total_scenarios}`}
            </div>
            {/* <TextEditorV1
                label="Name"
                initial_content={scenario.name || ""}
                on_change={e =>
                {
                    const name = e.currentTarget.value.trim()
                    on_change({ name })
                }}
                single_line={true}
                editable={true}
            /> */}

            {!scenario_is_empty(scenario) && <div className="scenario-delete-button">
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

            {props.input_names.map(input_name =>
            {
                return <TextEditorV1
                    key={input_name}
                    label={input_name}
                    initial_content={scenario.values[input_name] || ""}
                    on_change={e =>
                    {
                        const value = e.currentTarget.value.trim()
                        const updated_values = { ...scenario.values, [input_name]: value }
                        on_change({ values: updated_values })
                    }}
                    single_line={true}
                    editable={true}
                />
            })}
        </div>

        {/* <ErrorMessage show={!!error} message={error || ""} /> */}
    </div>
}


function scenario_is_empty(arg: Scenario): boolean
{
    return (!arg.description || browser_convert_tiptap_to_plain(arg.description).trim() === "")
        && Object.values(arg.values).every(v => v.trim() === "")
}

function is_scenario(arg: Scenario | null): arg is Scenario
{
    return arg !== null
}
