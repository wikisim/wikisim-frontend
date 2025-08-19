
export interface EvaluationRequest
{
    evaluation_id: string
    value: string
    timeout?: number // Optional timeout in milliseconds, default is 100 ms
}

export type EvaluationResponse =
{
    evaluation_id: string
    start_time: number
    time_taken_ms: number
} & (
    {
        result: string
        error: null
    } | {
        result: null
        error: string
    }
)
