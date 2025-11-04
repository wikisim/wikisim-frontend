import { Button, Checkbox } from "@mantine/core"
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
import { ReadOnly } from "../../text_editor/sanitise_html"
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
    const scenario_id = props.scenario.id
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


interface ScenarioFormProps
{
    ordinal: number
    total_scenarios: number
    scenario: Scenario
    function_arguments: FunctionArgument[]
    on_change: (updated_scenario: Partial<Scenario>) => void
    delete_entry: () => void
    debugging: boolean
    set_debugging: (debugging: boolean) => void
    is_draft_row: boolean
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean) => void
}

function ScenarioForm(props: ScenarioFormProps)
{
    const { scenario, on_change, is_draft_row, scenario_row_opened: opened } = props

    const on_update_description = useMemo(() =>
        debounce((description: string) => on_change({ description }), 300)
    , [on_change])

    // const error = props.is_draft_row ? null : calc_scenario_error(scenario, props.name_counts)

    return <>
        <div className="scenario-form-header row" style={{ maxHeight: "35px" }}>
            {is_draft_row && !opened && <Button
                variant={"outline"}
                onClick={() => props.set_scenario_row_opened(!opened)}
            >
                New Scenario
            </Button>}

            {(!is_draft_row || opened) && <div
                style={{ cursor: "pointer", flexGrow: 1 }}
                onClick={() => props.set_scenario_row_opened(!opened)}
            >
                {is_draft_row ? "New Scenario" : `Scenario ${props.ordinal} of ${props.total_scenarios}`}
            </div>}

            {opened && !is_draft_row && <div className="scenario-options">
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

        {!opened && <ReadOnly html={scenario.description} />}

        {opened && <div className="scenario-content">
            <TextEditorV2
                label="Description"
                initial_content={scenario.description || ""}
                on_update={on_update_description}
                single_line={false}
                editable={true}
            />

            <InputValuesForm
                is_draft_row={is_draft_row}
                scenario={scenario}
                function_arguments={props.function_arguments}
                on_change={(updated_values: ScenarioValues) => on_change({ values: updated_values })}
            />
        </div>}

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


function InputValuesForm(props: {
    is_draft_row: boolean
    scenario: Scenario
    function_arguments: FunctionArgument[]
    on_change: (updated_values: ScenarioValues) => void
})
{
    const { is_draft_row, scenario, function_arguments, on_change } = props

    const inputs_iterated_over = Object.values(scenario.values).filter(v => v.iterate_over).length
    const inputs_using_previous_result = Object.values(scenario.values).filter(v => v.use_previous_result).length

    return <>
        <div>Input values</div>

        {function_arguments.map(({ id, name: input_name, default_value }) =>
        {
            const existing = scenario.values[input_name]
            const enable_iterate_over = (
                existing?.iterate_over || inputs_iterated_over < 1
            )
            const enable_use_previous_result = (
                !existing?.iterate_over && inputs_iterated_over > 0 && (
                    existing?.use_previous_result || inputs_using_previous_result < 1
                )
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
                            on_change(updated_values)
                        }}
                        single_line={undefined}
                        editable={true}
                        // Using 500 now as a quick fix for large (long /
                        // many line) input values, revisit and change freely
                        // later as needed.
                        max_height={500}
                    />

                    <div className="row" style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}>
                        <HelpToolTip
                            message={<>
                                Use this "Repeat" option to run this scenario multiple times.
                                <br/>
                                <br/>
                                For example set the input value to <code>[3, 4, 5]</code> or <code>range(3, 6)</code>
                                and use this "Repeat" option to run the scenario 3 times:
                                first with a value of <code>3</code>, a second time with <code>4</code> and a final time with <code>5</code>.
                                <br/>
                                <br/>
                                With this Repeat option off it will run only once
                                and use the array <code>[3, 4, 5]</code> as the input value.
                            </>}
                            delay={700}
                            close_delay={1500}
                        >
                            <Checkbox
                                label="Repeat"
                                onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                                {
                                    const value = existing?.value || ""
                                    const iterate_over = e.currentTarget.checked || undefined
                                    const updated_values: ScenarioValues = { ...scenario.values, [input_name]: { value, iterate_over } }
                                    on_change(updated_values)
                                }}
                                checked={existing?.iterate_over || false}
                                disabled={!enable_iterate_over}
                            />
                        </HelpToolTip>
                    </div>

                    <div className="row" style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}>
                        <HelpToolTip
                            message={<>
                                The "Use Previous Result" option will take the result
                                from the function and use it as the next value for this input, the same as
                                when a spreadsheet cell uses the value from the previous row.
                                <br/>
                                <br/>
                                For example if we model plant growth,
                                we might have a function defined like this:
                                <pre>{`(time, plants = 1) => {\n   return plants * 4\n}`}</pre>
                                With <code>time</code> set to <code>[1, 2, 3]</code>
                                and its "Repeat" option enabled,
                                and the "Use Previous Result" option for <code>plants</code> enabled,
                                you would get the results <code>[4, 16, 64]</code>.
                                <br/>
                                If the "Use Previous Result" option was not enabled,
                                you would get <code>[4, 4, 4]</code>.
                            </>}
                            delay={700}
                            close_delay={1500}
                        >
                            <Checkbox
                                label="Use Previous Result"
                                onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                                {
                                    const value = existing?.value || ""
                                    const use_previous_result = e.currentTarget.checked || undefined
                                    const updated_values: ScenarioValues = { ...scenario.values, [input_name]: { value, use_previous_result } }
                                    on_change(updated_values)
                                }}
                                checked={existing?.use_previous_result || false}
                                disabled={!enable_use_previous_result}
                            />
                        </HelpToolTip>
                    </div>
                </div>
            </div>
        })}
    </>
}
