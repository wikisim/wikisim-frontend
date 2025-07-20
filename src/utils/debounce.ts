

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T
{
    let last_call: { time: number, result: ReturnType<T> } | null = null

    return function (...args: Parameters<T>): ReturnType<T>
    {
        if (!last_call || last_call.time < Date.now() - wait) {
            // If the last time we called the function was more than `wait` milliseconds ago,
            // we can call it immediately.
            last_call = {
                time: Date.now(),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                result: func(...args),
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return last_call.result
        }
        // Otherwise we return the last result
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return last_call.result
    } as T
}
