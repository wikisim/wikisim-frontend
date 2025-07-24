import { useEffect, useState } from "preact/hooks"


export class CountdownTimer
{
    private start_time: number
    private seconds_elapsed: number
    private seconds_remaining: number

    private interval: ReturnType<typeof setInterval> | null = null
    private subscribers: Array<(seconds_left: number) => void> = []
    private destroyed: boolean = false

    constructor(seconds: number)
    {
        this.start_time = Date.now()
        this.seconds_elapsed = 0
        this.seconds_remaining = seconds
        this.start()
    }

    subscribe(callback: (seconds_left: number) => void)
    {
        this.subscribers.push(callback)
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback)
        }
    }

    start()
    {
        if (this.destroyed) return
        this.start_time = Date.now()
        this.interval = setInterval(() =>
        {
            this.seconds_elapsed = (Date.now() - this.start_time) / 1000
            const seconds_left = this.seconds_remaining - this.seconds_elapsed
            if (seconds_left <= 0)
            {
                clearInterval(this.interval!)
                this.subscribers.forEach(callback => callback(0))
            }
            else
            {
                this.subscribers.forEach(callback => callback(seconds_left))
            }
        }, 100)
    }

    stop()
    {
        if (this.destroyed) return
        if (this.interval)
        {
            clearInterval(this.interval)
            this.interval = null
            this.seconds_remaining -= this.seconds_elapsed
        }
    }

    destroy()
    {
        this.stop()
        this.subscribers = []
        this.destroyed = true
    }
}



export default function Countdown(props: { seconds: number } | { timer: CountdownTimer })
{
    const timer = "timer" in props ? props.timer : new CountdownTimer(props.seconds)

    const [seconds_left, set_seconds_left] = useState(0)
    useEffect(() => timer.subscribe(set_seconds_left), [timer])

    if (seconds_left <= 0) return null

    return <span>{seconds_left.toFixed(0)}</span>
}
