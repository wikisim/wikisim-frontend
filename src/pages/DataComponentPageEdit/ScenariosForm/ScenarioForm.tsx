import { Button, Checkbox } from "@mantine/core"
import { TargetedEvent } from "preact/compat"
import { useCallback, useEffect } from "preact/hooks"

import type {
    FunctionArgument,
    Scenario,
    TempScenarioValues
} from "core/data/interface"

import { IconRepeat, IconUsePreviousResult } from "../../../assets/icons"
import { ConfirmBinButton } from "../../../buttons/BinButton"
import { HelpToolTip } from "../../../buttons/HelpText"
import { TextEditorV1 } from "../../../text_editor/TextEditorV1"
import { TextEditorV2 } from "../../../text_editor/TextEditorV2"
import { ReadOnly } from "../../../text_editor/sanitise_html"
import { WarningMessage } from "../../../ui_components/ErrorMessage"
import { debounce } from "../../../utils/debounce"
import "./ScenarioForm.css"
import { scenario_is_empty } from "./utils"


interface ScenarioFormProps
{
    ordinal: number
    total_scenarios: number
    scenario: Scenario
    function_arguments: FunctionArgument[]
    on_upsert_scenario: (updated_scenario: Partial<Scenario>) => void
    delete_entry: () => void
    debugging: boolean
    set_debugging: (debugging: boolean) => void
    is_draft_row: boolean
    scenario_row_opened: boolean
    set_scenario_row_opened: (opened: boolean) => void
}

export function ScenarioForm(props: ScenarioFormProps)
{
    const { scenario, on_upsert_scenario, is_draft_row, scenario_row_opened: opened } = props

    const on_update_description = useCallback(debounce((description: string) =>
    {
        on_upsert_scenario({ description })
    }, 500)
    , [on_upsert_scenario])

    const on_update_values = useCallback((updated_values: TempScenarioValues) =>
    {
        return on_upsert_scenario({ values_by_temp_id: updated_values })
    }, [on_upsert_scenario])

    const debounced_on_update_values = useCallback(debounce(on_update_values, 600), [on_update_values])

    useEffect(() => () =>
    {
        on_update_description.commit()
        debounced_on_update_values.commit()
    }, [on_update_description, debounced_on_update_values])

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
                on_change={on_update_values}
                debounced_on_change={debounced_on_update_values}
            />
        </div>}

        {/* <ErrorMessage show={!!error} message={error || ""} /> */}
    </>
}


function InputValuesForm(props: {
    is_draft_row: boolean
    scenario: Scenario
    function_arguments: FunctionArgument[]
    on_change: (updated_values: TempScenarioValues) => void
    debounced_on_change: (updated_values: TempScenarioValues) => void
})
{
    const { is_draft_row, scenario, function_arguments, on_change, debounced_on_change } = props

    const inputs_iterated_over = Object.values(scenario.values_by_temp_id).filter(v => v.iterate_over).length
    const inputs_using_previous_result = Object.values(scenario.values_by_temp_id).filter(v => v.use_previous_result).length
    const any_inputs_iterated_over = inputs_iterated_over > 0

    return <>
        <div>Input values</div>

        {function_arguments.map(({ local_temp_id, name: input_name, default_value }) =>
        {
            const existing = scenario.values_by_temp_id[local_temp_id]
            const enable_iterate_over = (
                existing?.iterate_over || inputs_iterated_over < 1
            )
            const enable_use_previous_result = (
                !existing?.iterate_over && inputs_iterated_over > 0 && (
                    existing?.use_previous_result || inputs_using_previous_result < 1
                )
            )

            return <div className="column" style={{ gap: "var(--vgap-small)" }} key={local_temp_id}>
                {!is_draft_row && <WarningMessage
                    show={!default_value && (!existing || !existing.value)}
                    message={`Please set a value for "${input_name}" as it has no default.`}
                />}

                <div className="row">
                    <TextEditorV1
                        key={local_temp_id}
                        label={input_name}
                        initial_content={existing?.value || ""}
                        on_change={e =>
                        {
                            const value = e.currentTarget.value.trim()
                            const iterate_over = existing?.iterate_over
                            const use_previous_result = existing?.use_previous_result
                            const updated_values: TempScenarioValues = {
                                ...scenario.values_by_temp_id,
                                [local_temp_id]: { value, iterate_over, use_previous_result }
                            }

                            if (value === "") delete updated_values[local_temp_id]
                            debounced_on_change(updated_values)
                        }}
                        single_line={undefined}
                        editable={true}
                        // Using 500 now as a quick fix for large (long /
                        // many line) input values, revisit and change freely
                        // later as needed.
                        max_height={500}
                        className="input-value-textarea"
                    />

                    {enable_iterate_over && <div
                        className="row"
                        style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}
                    >
                        <Checkbox
                            label={<LabelRepeatJsx disabled={!enable_iterate_over } />}
                            onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                            {
                                const value = existing?.value || ""
                                const iterate_over = e.currentTarget.checked || undefined
                                const updated_values: TempScenarioValues = {
                                    ...scenario.values_by_temp_id,
                                    [local_temp_id]: { value, iterate_over }
                                }
                                on_change(updated_values)
                            }}
                            checked={existing?.iterate_over || false}
                            disabled={!enable_iterate_over}
                        />
                    </div>}

                    {!existing?.iterate_over && any_inputs_iterated_over && <div
                        className="row"
                        style={{ alignItems: "center", gap: "4px", flexGrow: 0 }}
                    >
                        <Checkbox
                            label={<LabelUsePreviousResultJsx disabled={!enable_use_previous_result } />}
                            onChange={(e: TargetedEvent<HTMLInputElement, Event>) =>
                            {
                                const value = existing?.value || ""
                                const use_previous_result = e.currentTarget.checked || undefined
                                const updated_values: TempScenarioValues = {
                                    ...scenario.values_by_temp_id,
                                    [local_temp_id]: { value, use_previous_result }
                                }
                                on_change(updated_values)
                            }}
                            checked={existing?.use_previous_result || false}
                            disabled={!enable_use_previous_result}
                        />
                    </div>}
                </div>
            </div>
        })}
    </>
}


function LabelRepeatJsx(props: { disabled: boolean })
{
    return <HelpToolTip
        message={props.disabled ? <></> : <>
            Use this "Repeat" option to run this scenario multiple times; this is
            the same as having multiple rows in a spreadsheet for this input.
            <br/>
            <br/>
            For example set the input value to <code>range(3, 6)</code> (which produces the array <code>[3, 4, 5]</code>)
            and use this "Repeat" option to run the scenario 3 times:
            first with a value of <code>3</code>, a second time with <code>4</code> and a final time with <code>5</code>.
            <br/>
            <br/>
            With this Repeat option off it will run only once
            and use the array <code>[3, 4, 5]</code> as the input value.
        </>}
        delay={700}
        close_delay={700}
    >
        <div>
            <IconRepeat disabled={props.disabled} no_title={true} />
        </div>
    </HelpToolTip>
}


function LabelUsePreviousResultJsx(props: { disabled: boolean } ) //false | "other modifier active" | "other input active" })
{
    return <HelpToolTip
        // message={props.disabled === "other modifier active"
        // ? <>This input is set to repeat so can not be set to use the previous result</>
        // : props.disabled === "other input active"
        // ? <>Only one input can use the previous result</>
        message={props.disabled ? <>"Use Previous Result" option disabled</> : <>
            The "Use Previous Result" option will take the previous result
            from the function and use it as the next value for this input; this is the same as
            when the cells in a spreadsheet row use values from the previous row.
            <br/>
            <br/>
            For example, with this function to model plant growth:
            <pre>{`(time, plants = 0) => {\n   return time + plants * 2\n}`}</pre>
            If <code>time</code> is set to <code>[1, 2, 3]</code> and
            has "Repeat" option enabled then the result is <code>[1, 2, 3]</code>.
            Instead, with the "Use Previous Result" option enabled for <code>plants</code> the
            result would be <code>[1, 4, 11]</code>.
        </>}
        delay={700}
        close_delay={700}
    >
        <div>
            <IconUsePreviousResult disabled={!!props.disabled} no_title={true} />
        </div>
    </HelpToolTip>
}
