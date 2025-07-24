

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T
{
    let last_call_time: number | null = null
    let timeout_id: ReturnType<typeof setTimeout> | null = null

    return function (...args: Parameters<T>)
    {
        if (timeout_id) clearTimeout(timeout_id)

        const time_until_next_call = wait - (Date.now() - (last_call_time ?? 0))
        // If the last time we called the function was never or more than `wait`
        // milliseconds ago, we can call it immediately.
        if (!last_call_time || (time_until_next_call <= 0))
        {
            last_call_time = Date.now()
            func(...args)
            return
        }

        // Otherwise we set a timeout to update it later assuming no other calls
        // come in before then.
        timeout_id = setTimeout(() =>
        {
            last_call_time = Date.now()
            func(...args)
        }, time_until_next_call)
    } as T
}
