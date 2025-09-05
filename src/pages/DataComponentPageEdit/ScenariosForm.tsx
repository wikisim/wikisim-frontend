import {
    type DataComponent,
    type NewDataComponent,
    type Scenario,
} from "core/data/interface"

import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import "./ScenariosForm.css"


interface ScenariosFormProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function ScenariosForm(props: ScenariosFormProps)
{
    return null
    const scenarios = props.draft_component.scenarios || []

    const new_scenario_obj: Scenario = {
        id: scenarios.length,
        values: [],
    }

    // Important: render the "new" row inside the same mapped list as existing rows
    // with a stable key so Preact doesn't unmount/remount the input on first edit.
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

            // Key choice keeps the DOM node stable across the draft->committed transition.
            // We use the numeric id (new_scenario_obj.id) for the draft, which becomes the same id
            // when committed on first edit.
            const key = scenario.id

            return <ScenarioForm
                key={key}
                scenario={scenario}
                on_change={on_change}
            />
        })}
    </div>
}


function ScenarioForm({ scenario, on_change }: { scenario: Scenario, on_change: (updated_scenario: Partial<Scenario>) => void })
{
    return <div className="scenario-form">
        <TextEditorV1
            label="Name"
            initial_content={scenario.name || ""}
            on_change={e =>
            {
                const name = e.currentTarget.value.trim()
                on_change({ name })
            }}
            single_line={true}
            editable={true}
        />

        <TextEditorV1
            label="Description"
            initial_content={scenario.name || ""}
            on_change={e =>
            {
                const name = e.currentTarget.value.trim()
                on_change({ name })
            }}
            single_line={true}
            editable={true}
        />


    </div>
}


function scenario_is_empty(arg: Scenario): boolean
{
    return (!arg.name || arg.name.trim() === "")
        && (!arg.description || arg.description.trim() === "")
        && (arg.values.length === 0)
}

function is_scenario(arg: Scenario | null): arg is Scenario
{
    return arg !== null
}
