
export interface EvaluationRequest
{
    value: string
    timeout?: number // Optional timeout in milliseconds, default is 100 ms
}

export type EvaluationResponse =
{
    evaluation_id: number
    requested_at: number
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
