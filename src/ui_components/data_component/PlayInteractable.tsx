import { Button } from "@mantine/core"
import IconPlayerPlay from "@tabler/icons-react/dist/esm/icons/IconPlayerPlay"
import { useMemo, useState } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import { JSX } from "preact"
import Loading from "../Loading"
import "./PlayInteractable.css"


export function PlayInteractable(props: { component: DataComponent })
{
    const { component } = props
    const [playing, set_playing] = useState(false)

    if (component.value_type !== "interactable") return null
    if (!component.result_value) return null


    const sim_parameters = useMemo(() =>
    {
        // Get `sim_parameters` from URL search parameters and pass it to the
        // iframe as a query parameter
        const url = new URL(window.location.href)
        const sim_parameters = url.searchParams.get("sim_parameters")
        const decoded = sim_parameters ? decodeURIComponent(sim_parameters) : null
        return decoded ? "?" + decoded : ""
    }, [component.id.to_str()])


    return <div
        className={`section play-interactable ${playing ? "playing" : ""}`}
        onClick={() => set_playing(true)}
    >
        {!playing && <Button onClick={() => set_playing(true)}>
            <IconPlayerPlay /> &nbsp;Play
        </Button>}
        {playing && <div style={{ width: 130 }}>Loading&nbsp;<Loading /></div>}
        {playing && <>
            <iframe
                src={`https://wikisim-server.wikisim.deno.net/${component.id.to_str()}/${sim_parameters}` }
                className="play-interactable-iframe"
                sandbox="allow-scripts allow-same-origin"
            />
            <div className="play-interactable-close-button">
                <Button
                    onClick={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                    {
                        e.stopPropagation()
                        e.stopImmediatePropagation()
                        set_playing(false)
                    }}
                    title={`Close "${component.plain_title}"`}
                    variant="light"
                >
                    Close
                </Button>
            </div>
        </>}
    </div>
}
