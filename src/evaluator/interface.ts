import { FunctionArgument, ValueType } from "core/data/interface"


export interface EvaluationRequest
{
    value: string
    value_type?: ValueType
    function_arguments?: FunctionArgument[]
    timeout?: number // Optional timeout in milliseconds, default is 100 ms
}

export type MinimalEvaluationResponse =
{
    evaluation_id: number
} & (
    {
        result: string
        error: null
    } | {
        result: null
        error: string
    }
)


export type EvaluationResponse = MinimalEvaluationResponse &
{
    requested_at: number
    start_time: number
    time_taken_ms: number
}
