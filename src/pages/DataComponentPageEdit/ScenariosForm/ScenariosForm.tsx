import { useMemo, useState } from "preact/hooks"

import type {
    DataComponent,
    NewDataComponent,
    Scenario
} from "core/data/interface"

import OpenCloseSection from "../../../ui_components/OpenCloseSection"
import { ScenarioResultsAndExpectations } from "../ScenarioResultsAndExpectations"
import { UpdatesFnOrValue } from "../interface"
import { ScenarioForm } from "./ScenarioForm"
import "./ScenariosForm.css"
import { scenario_is_empty } from "./utils"


interface ScenariosFormProps
{
    component: DataComponent | NewDataComponent
    on_change: (updated_component: UpdatesFnOrValue, compare_meta_fields?: boolean) => void
}
export function ScenariosForm(props: ScenariosFormProps)
{
    const [opened, set_opened] = useState(false)

    const scenarios = props.component.scenarios || []

    const new_scenario_obj: Scenario = useMemo(() => ({
        local_temp_id: Date.now().toString(), // temporary id until committed
        description: "<p></p>", // tiptap empty document
        values_by_temp_id: {},
    }), [scenarios.length])

    // Important: render the "new" row inside the same mapped list as existing rows
    // with a stable key so Preact doesn't unmount/remount the scenario on first edit.
    const scenarios_with_draft = [...scenarios, new_scenario_obj]

    return <div className="scenarios">
        <div
            className="data-component-form-column row"
            style={{ alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onPointerDown={() => set_opened(!opened)}
        >
            <h4>Scenarios</h4>
            <OpenCloseSection opened={opened} />
        </div>

        {opened && scenarios_with_draft.map((scenario, index) =>
        {
            const is_draft_row = index === scenarios.length

            return <ScenarioRowForm
                key={scenario.local_temp_id}
                new_scenario_obj={new_scenario_obj}
                scenario={scenario}
                index={index}
                is_draft_row={is_draft_row}
                total_scenarios={scenarios.length}
                component={props.component}
                on_change={props.on_change}
            />
        })}
    </div>
}



interface ScenarioRowFormProps
{
    new_scenario_obj: Scenario
    scenario: Scenario
    index: number
    is_draft_row: boolean
    total_scenarios: number
    component: DataComponent | NewDataComponent
    on_change: (updated_component: UpdatesFnOrValue, compare_meta_fields?: boolean) => void
}
function ScenarioRowForm(props: ScenarioRowFormProps)
{
    const scenario_id = props.scenario.local_temp_id
    const [scenario_row_opened, set_scenario_row_opened] = useState(!props.is_draft_row)
    const [debugging, set_debugging] = useState(false)

    const on_change = useMemo(() => (updated_scenario: Partial<Scenario>) =>
    {
        props.on_change(current =>
        {
            const scenarios = current.scenarios || []

            if (props.is_draft_row)
            {
                // First edit of draft row: commit it to the array
                const committed = { ...props.new_scenario_obj, ...updated_scenario }
                const updated_scenarios = [
                    ...scenarios,
                    committed,
                ]
                return { scenarios: updated_scenarios }
            }
            else
            {
                // Edit of existing row: update in place
                const updated_scenarios = scenarios.map(arg =>
                {
                    if (arg.local_temp_id === scenario_id)
                    {
                        const modified = { ...arg, ...updated_scenario }
                        return scenario_is_empty(modified) ? null : modified
                    }
                    return arg
                }).filter(is_scenario)
                return { scenarios: updated_scenarios }
            }
        })
    }, [
        props.is_draft_row, props.new_scenario_obj,
        props.on_change, scenario_id,
    ])


    const { is_draft_row, component, total_scenarios } = props


    const delete_entry = useMemo(() => () =>
    {
        props.on_change(current =>
        {
            if (is_draft_row) return current // no need to do anything

            const updated_scenarios = (current.scenarios || []).filter(arg => arg.local_temp_id !== scenario_id)
            return { scenarios: updated_scenarios }
        })
    }, [is_draft_row])


    // Key choice keeps the DOM node stable across the draft->committed transition.
    // We use the numeric id (new_scenario_obj.id) for the draft, which becomes the same id
    // when committed on first edit.
    const key = scenario_id

    return <div className="row_to_column scenario-divider" key={key}>
        <div
            className="data-component-form-column column"
            style={{ gap: "var(--vgap-mid)" }}
        >
            <ScenarioForm
                ordinal={props.index + 1}
                total_scenarios={total_scenarios}
                function_arguments={component.function_arguments || []}
                scenario={props.scenario}
                on_change={on_change}
                delete_entry={delete_entry}
                debugging={debugging}
                set_debugging={set_debugging}
                is_draft_row={is_draft_row}
                scenario_row_opened={scenario_row_opened}
                set_scenario_row_opened={set_scenario_row_opened}
            />
        </div>

        <div className="data-component-form-column column">
            <ScenarioResultsAndExpectations
                is_draft_row={is_draft_row}
                component={component}
                scenario={props.scenario}
                debugging={debugging}
                on_change={on_change}
                scenario_row_opened={scenario_row_opened}
                set_scenario_row_opened={set_scenario_row_opened}
            />
        </div>
    </div>
}

function is_scenario(arg: Scenario | null): arg is Scenario
{
    return arg !== null
}
