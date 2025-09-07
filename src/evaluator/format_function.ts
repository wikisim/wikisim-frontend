import { FunctionArgument } from "core/data/interface"
import { deindent } from "core/utils/deindent"

import { EvaluationRequest, EvaluationResponse } from "./interface"


export function format_function_input_value_string(basic_request: EvaluationRequest): EvaluationResponse
{
    const formatted_function = function_signature(basic_request.function_arguments) + " => " + function_body(basic_request.value)

    return {
        result: formatted_function,
        error: null,

        // TODO: remove these fields from the EvaluationResponse interface
        evaluation_id: 0,
        requested_at: Date.now(),
        start_time: Date.now(),
        time_taken_ms: 0,
    }
}


function function_signature(function_arguments?: FunctionArgument[]): string
{
    const args = function_arguments || []
    const formatted_args = args.map(arg =>
    {
        if (arg.default_value)
        {
            return `${arg.name} = ${arg.default_value}`
        }
        return arg.name
    }).join(", ")

    return `(${formatted_args})`
}


function function_body(value: string): string
{
    const trimmed = deindent(value)

    if (trimmed.includes("\n"))
    {
        const lines = trimmed.split("\n")

        // Check if last line has a return statement
        const last_line = lines[lines.length - 1]!
        if (!last_line.trim().startsWith("return "))
        {
            lines[lines.length - 1] = "return " + last_line
        }

        const indented = lines.map(line => "    " + line).join("\n")

        return `{\n${indented}\n}`
    }

    return trimmed
}
