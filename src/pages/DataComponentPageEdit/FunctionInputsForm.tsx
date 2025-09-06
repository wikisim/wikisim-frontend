import { useEffect, useState } from "preact/hooks"

import {
    type DataComponent,
    type FunctionArgument,
    type NewDataComponent,
} from "core/data/interface"
import {
    calc_function_argument_error,
    calc_function_arguments_errors,
} from "core/data/is_data_component_invalid"

import BinButton from "../../buttons/BinButton"
import { TextEditorV1 } from "../../text_editor/TextEditorV1"
import { ErrorMessage } from "../../ui_components/ErrorMessage"
import { Select } from "../../ui_components/Select"
import "./FunctionInputsForm.css"


interface FunctionInputsFormProps
{
    draft_component: DataComponent | NewDataComponent
    on_change: (updated_component: Partial<DataComponent | NewDataComponent>) => void
}
export function FunctionInputsForm(props: FunctionInputsFormProps)
{
    const function_arguments = props.draft_component.function_arguments || []

    const { name_counts } = calc_function_arguments_errors(function_arguments)

    const new_input_obj: FunctionArgument = {
        id: Date.now(), // temporary id until committed
        name: "",
        value_type: "number",
    }

    // Important: render the "new" row inside the same mapped list as existing rows
    // with a stable key so Preact doesn't unmount/remount the input on first edit.
    const inputs_with_draft = [...function_arguments, new_input_obj]

    return <div className="function-arguments">
        <h4>Inputs</h4>

        {inputs_with_draft.map((input, index) =>
        {
            const is_draft_row = index === function_arguments.length

            const on_change = (updated_input: Partial<FunctionArgument>) =>
            {
                if (is_draft_row)
                {
                    // First edit of draft row: commit it to the array
                    const committed = { ...new_input_obj, ...updated_input }
                    const updated_function_arguments = [
                        ...function_arguments,
                        committed,
                    ]
                    props.on_change({ function_arguments: updated_function_arguments })
                }
                else
                {
                    // Edit of existing row: update in place
                    const updated_function_arguments = function_arguments.map(arg =>
                    {
                        if (arg.id === input.id)
                        {
                            const modified = { ...arg, ...updated_input }
                            return function_argument_is_empty(modified) ? null : modified
                        }
                        return arg
                    }).filter(is_function_argument)
                    props.on_change({ function_arguments: updated_function_arguments })
                }
            }

            const delete_entry = () =>
            {
                if (is_draft_row) return

                const updated_function_arguments = function_arguments.filter(arg => arg.id !== input.id)
                props.on_change({ function_arguments: updated_function_arguments })
            }

            // Key choice keeps the DOM node stable across the draft->committed transition.
            // We use the numeric id (new_input_obj.id) for the draft, which becomes the same id
            // when committed on first edit.
            const key = input.id

            return <FunctionInputForm
                key={key}
                name_counts={name_counts}
                input={input}
                on_change={on_change}
                delete_entry={delete_entry}
                is_draft_row={is_draft_row}
            />
        })}
    </div>
}


interface FunctionInputFormProps
{
    input: FunctionArgument
    name_counts: {[name: string]: number}
    on_change: (updated_input: Partial<FunctionArgument>) => void
    delete_entry: () => void
    is_draft_row: boolean
}

function FunctionInputForm(props: FunctionInputFormProps)
{
    const { input, on_change } = props
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

    const error = props.is_draft_row ? null : calc_function_argument_error(input, props.name_counts)

    return <div className="function-argument-form">
        <div className="function-argument-form-row">
            <TextEditorV1
                label="Name"
                initial_content={input.name}
                on_change={e =>
                {
                    const name = e.currentTarget.value.trim()
                    on_change({ name })
                }}
                single_line={true}
                editable={true}
            />

            <Select
                label="Type"
                data={[
                    { value: "number", label: "Number" }
                ]}
                size="md"
                style={{ minWidth: 120 }}
                value={input.value_type}
                onChange={value_type =>
                {
                    if (value_type === null) return
                    on_change({ value_type: value_type as FunctionArgument["value_type"] })
                }}
            />

            <TextEditorV1
                label="Default value"
                initial_content={input.default_value || ""}
                on_change={e =>
                {
                    const default_value = e.currentTarget.value.trim()
                    on_change({ default_value })
                }}
                single_line={true}
                editable={true}
            />

            <div className="function-argument-delete-button">
                <BinButton
                    on_click={handle_delete}
                    disabled={function_argument_is_empty(input)}
                />
            </div>
        </div>

        <ErrorMessage show={!!error} message={error || ""} />
    </div>
}


function function_argument_is_empty(arg: FunctionArgument): boolean
{
    return arg.name.trim() === ""
        && (!arg.description || arg.description.trim() === "")
        && (!arg.default_value || arg.default_value.trim() === "")
}

function is_function_argument(arg: FunctionArgument | null): arg is FunctionArgument
{
    return arg !== null
}
