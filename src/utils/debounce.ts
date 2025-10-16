

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T & { commit: () => void }
{
    let last_call_time: number | null = null
    let timeout_id: ReturnType<typeof setTimeout> | null = null
    let outstanding_args: { args: Parameters<T> | null } = { args: null }

    const debounced = function (...args: Parameters<T>)
    {
        if (timeout_id) clearTimeout(timeout_id)
        if (last_call_time === null) last_call_time = Date.now()

        outstanding_args.args = null

        const time_until_next_call = wait - (Date.now() - last_call_time)
        // If the last time we called the function was more than `wait`
        // milliseconds ago, we can call it immediately.
        if (time_until_next_call <= 0)
        {
            last_call_time = null
            func(...args)
            return
        }

        // Otherwise we set a timeout to update it later assuming no other calls
        // come in before then.
        outstanding_args.args = args

        timeout_id = setTimeout(() =>
        {
            last_call_time = null
            if (outstanding_args.args) func(...outstanding_args.args)
            outstanding_args.args = null
        }, time_until_next_call)
    } as T

    ;(debounced as T & { commit: () => void }).commit = () =>
    {
        if (timeout_id) clearTimeout(timeout_id)
        timeout_id = null
        last_call_time = null
        if (outstanding_args.args) func(...outstanding_args.args)
        outstanding_args.args = null
    }

    return debounced as T & { commit: () => void }
}
