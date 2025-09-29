import { Switch } from "@mantine/core"
import { h } from "preact"
import { TargetedEvent, useEffect, useState } from "preact/compat"

import pub_sub from "../pub_sub"
import "./ToggleTwo.css"


interface ToggleTwoProps
{
    disabled?: boolean
    active: boolean
    label: (v: boolean) => string | h.JSX.Element
    set_active: (v: boolean) => void
    labelPosition?: "left" | "right"
}
export function ToggleTwo(props: ToggleTwoProps)
{
    const { active, set_active } = props

    const [focused, set_focused] = useState(false)

    useEffect(() => pub_sub.sub("key_down", e =>
    {
        if (e.key === "Enter" && focused) set_active(!active)
    }), [focused, set_active, active])

    return <div className="toggle-two">
        <Switch
            disabled={props.disabled}
            checked={active}
            onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            {
                set_active(event.currentTarget.checked)
            }}
            onFocus={() => set_focused(true)}
            onBlur={() => set_focused(false)}
            withThumbIndicator={false}
            color="var(--mantine-color-green-filled)"
            labelPosition={props.labelPosition || "right"}
            label={props.label(active)}
        />
    </div>
}
