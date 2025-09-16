import { format_function_input_value_string } from "./format_function"
import { EvaluationRequest, EvaluationResponse } from "./interface"
import { Evaluator as Evaluator2, evaluate_code_in_sandbox } from "./sandboxed_javascript"


export async function calculate_result_value(basic_request: EvaluationRequest): Promise<EvaluationResponse | null>
{
    if (basic_request.value_type === "function")
    {
        return format_function_input_value_string(basic_request)
    }

    return evaluate_code_in_sandbox(basic_request)
}

export const Evaluator = Evaluator2
