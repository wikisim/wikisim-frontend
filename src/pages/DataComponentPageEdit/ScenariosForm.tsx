import { Checkbox } from "@mantine/core"
import { TargetedEvent } from "preact/compat"
import { useMemo, useState } from "preact/hooks"

import type {
    DataComponent,
    FunctionArgument,
    NewDataComponent,
    Scenario,
    ScenarioValues,
} from "core/data/interface"
import { browser_convert_tiptap_to_plain } from "core/rich_text/browser_convert_tiptap_to_plain"

import { ConfirmBinButton } from "../../buttons/BinButton"
import { HelpToolTip } from "../../buttons/HelpText"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../text_editor/TextEditorV2"
import { WarningMessage } from "../../ui_components/ErrorMessage"
import OpenCloseSection from "../../ui_components/OpenCloseSection"
import { debounce } from "../../utils/debounce"
import { ScenarioResultsAndExpectations } from "./ScenarioResultsAndExpectations"
import "./ScenariosForm.css"
import { UpdatesFnOrValue } from "./interface"


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
        id: Date.now(), // temporary id until committed
        description: "<p></p>", // tiptap empty document
        values: {},
    }), [scenarios.length])

    // Important: render the "new" row inside the same mapped list as existing rows
    // with a stable key so Preact doesn't unmount/remount the scenario on first edit.
    const scenarios_with_draft = [...scenarios, new_scenario_obj]

    return <div className="scenarios">
        <div
            className="data-component-form-column row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
            onPointerDown={() => set_opened(!opened)}
        >
            <h4>Scenarios</h4>
            <OpenCloseSection opened={opened} />
        </div>

        {opened && scenarios_with_draft.map((scenario, index) =>
        {
            const is_draft_row = index === scenarios.length

            return <ScenarioRow
                key={scenario.id}
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



interface ScenarioRowProps
{
    new_scenario_obj: Scenario
    scenario: Scenario
    index: number
    is_draft_row: boolean
    total_scenarios: number
    component: DataComponent | NewDataComponent
    on_change: (updated_component: UpdatesFnOrValue, compare_meta_fields?: boolean) => void
}
function ScenarioRow(props: ScenarioRowProps)
{
    const scenario_id = props.scenario.id
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
                    if (arg.id === scenario_id)
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

            const updated_scenarios = (current.scenarios || []).filter(arg => arg.id !== scenario_id)
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
                inputs={component.function_arguments || []}
                scenario={props.scenario}
                on_change={on_change}
                delete_entry={delete_entry}
                debugging={debugging}
                set_debugging={set_debugging}
                is_draft_row={is_draft_row}
            />
        </div>

        <div className="data-component-form-column column">
            <ScenarioResultsAndExpectations
                is_draft_row={is_draft_row}
                component={component}
                scenario={props.scenario}
                debugging={debugging}
                on_change={on_change}
            />
        </div>
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
    debugging: boolean
    set_debugging: (debugging: boolean) => void
    is_draft_row: boolean
}

function ScenarioForm(props: ScenarioFormProps)
{
    const { scenario, on_change, is_draft_row } = props

    const on_update_description = useMemo(() =>
        debounce((description: string) => on_change({ description }), 300)
    , [on_change])

    // const error = props.is_draft_row ? null : calc_scenario_error(scenario, props.name_counts)
    const inputs_iterated_over = Object.values(scenario.values).filter(v => v.iterate_over).length

    return <>
        <div className="scenario-form-header row" style={{ maxHeight: "35px" }}>
            <div>
                {is_draft_row ? "New Scenario" : `Scenario ${props.ordinal} of ${props.total_scenarios}`}
            </div>

            {!is_draft_row && <div className="scenario-options">
                <HelpToolTip
                    message={`When enabled, a debugger statement will be added to the start of the function code.  Open your developer terminal and enable "Pause on Debugger" to step through the code as it runs for this scenario.`}
                >
                    <Checkbox
                        label="Debug"
                        onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                        {
                            props.set_debugging(e.currentTarget.checked)
                        }}
                        checked={props.debugging}
                    />
                </HelpToolTip>
                <ConfirmBinButton
                    on_click={props.delete_entry}
                    disabled={scenario_is_empty(scenario)}
                    label={`Delete scenario ${props.ordinal}`}
                />
            </div>}
        </div>

        <div className="scenario-content">
            <TextEditorV2
                label="Description"
                initial_content={scenario.description || ""}
                on_update={on_update_description}
                single_line={false}
                editable={true}
            />

            <div>Input values</div>

            {props.inputs.map(({ name: input_name, default_value }) =>
            {
                const existing = scenario.values[input_name]
                const enable_iterate_over = (
                    existing?.iterate_over || (!!existing && inputs_iterated_over < 1)
                )

                return <div className="column" style={{ gap: "var(--vgap-small)" }} key={input_name}>
                    {!is_draft_row && <WarningMessage
                        show={!default_value && (!existing || !existing.value)}
                        message={`Please set a value for "${input_name}" as it has no default.`}
                    />}

                    <div className="row">
                        <TextEditorV1
                            key={input_name}
                            label={input_name}
                            initial_content={existing?.value || ""}
                            on_change={e =>
                            {
                                const value = e.currentTarget.value.trim()
                                const iterate_over = existing?.iterate_over
                                const updated_values: ScenarioValues = { ...scenario.values, [input_name]: { value, iterate_over } }
                                if (value === "") delete updated_values[input_name]
                                on_change({ values: updated_values })
                            }}
                            single_line={true}
                            editable={true}
                        />

                        <div className="row" style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}>
                            <HelpToolTip
                                message={<>
                                    If this input value is an array or range of values that can be iterated over,
                                    then use this "Iterate" option to run this scenario over those values.
                                    <br/>
                                    <br/>
                                    For example using <code>[1, 2, 3]</code> or <code>range(1, 4)</code>
                                    with this "Iterate" option on will run the scenario 3 times,
                                    once with each value, whereas with this option off it will run only once
                                    and use the array <code>[1, 2, 3]</code> as the input value.
                                </>}
                            >
                                <Checkbox
                                    label="Iterate"
                                    onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                                    {
                                        const value = existing?.value || ""
                                        const iterate_over = e.currentTarget.checked || undefined
                                        const updated_values = { ...scenario.values, [input_name]: { value, iterate_over } }
                                        on_change({ values: updated_values })
                                    }}
                                    checked={existing?.iterate_over || false}
                                    disabled={!enable_iterate_over}
                                />
                            </HelpToolTip>
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
