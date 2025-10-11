import { Button } from "@mantine/core"
import { useState } from "preact/hooks"

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


    return <div
        className={`section play-interactable ${playing ? "playing" : ""}`}
        onClick={() => set_playing(true)}
    >
        {!playing && <Button onClick={() => set_playing(true)}>Play Interactable</Button>}
        {playing && <div style={{ width: 130 }}>Loading&nbsp;Interactable<Loading /></div>}
        {playing && <>
            <iframe
                src={`https://wikisim-server.wikisim.deno.net/${component.id.to_str()}/` }
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
