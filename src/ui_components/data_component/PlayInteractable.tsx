import { Button } from "@mantine/core"
import IconPlayerPlay from "@tabler/icons-react/dist/esm/icons/IconPlayerPlay"
import { useEffect, useMemo, useState } from "preact/hooks"

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


    // Listen for messages from the iframe
    useEffect(() =>
    {
        function handle_event(event: MessageEvent)
        {
            if (!event.data || typeof event.data !== "object") return

            // Update the sim_parameters in the URL

            // Example of code the iframe should use to update the sim_parameters in the parent window:
            //     window.parent.postMessage(
            //         { type: "UPDATE_SIM_PARAMETERS", payload: { sim_parameters: document.location.search.slice(1) } },
            //         "*"
            //     )
            if (event.data.type === "UPDATE_SIM_PARAMETERS")
            {
                const sim_parameters = event.data.payload.sim_parameters as string
                if (typeof sim_parameters !== "string") return
                const encoded = encodeURIComponent(sim_parameters)

                const url = new URL(window.location.href)
                url.searchParams.set("sim_parameters", encoded)
                window.history.replaceState(null, "", url.toString())
            }

            else if (event.data.type === "OPEN_URL" && event.data.url)
            {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const url = event.data.url
                const target = event.data.target as string || "_blank"
                const allowed_targets = ["_blank", "_self"]
                if (typeof url !== "string" || !allowed_targets.includes(target)) return
                window.open(url, target)
            }
        }
        window.addEventListener("message", handle_event)

        return () => window.removeEventListener("message", handle_event)
    }, [])


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
