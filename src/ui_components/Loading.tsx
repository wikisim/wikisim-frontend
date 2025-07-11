import { useEffect, useState } from "preact/hooks"


function get_dots (dots_time_interval_ms: number)
{
    // Create a string of 3 dots that cycles through 1, 2, 3, 4
    const count = 1 + (Math.floor(Date.now() / dots_time_interval_ms) % 4)
    return ".".repeat(count)
}

export default function Loading(props: { speed?: number })
{
    const dots_time_interval_ms = props.speed || 300

    const [dots, set_dots] = useState(get_dots(dots_time_interval_ms))

    useEffect(() => {
        const interval = setInterval(() =>
        {
            set_dots(get_dots(dots_time_interval_ms))
        }, (dots_time_interval_ms / 3))
        return () => clearInterval(interval)
    }, [dots_time_interval_ms])

    return <span>{dots}</span>
}
