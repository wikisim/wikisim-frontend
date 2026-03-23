import { useLocation } from "preact-iso"
import { useEffect, useState } from "preact/hooks"

import Loading from "../ui_components/Loading"


interface DataComponentPageRedirectToIdOnlyProps
{
    redirect_to: string
    description: string
}
export function DataComponentPageRedirectToIdOnly(props: DataComponentPageRedirectToIdOnlyProps)
{
    const { redirect_to } = props
    const location = useLocation()
    const [seconds, set_seconds] = useState(10)

    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            set_seconds(s =>
            {
                if (s <= 1)
                {
                    location.route(redirect_to)
                    clearInterval(interval)
                    return s
                }
                return s - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return <div className="page-container">
        <p>Click here <a href={redirect_to}>to view the {props.description}</a> of this page.</p>
        <p>Redirecting in {seconds}<Loading /></p>
    </div>
}
