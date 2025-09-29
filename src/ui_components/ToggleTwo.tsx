import { Switch } from "@mantine/core"
import { h } from "preact"
import { TargetedEvent } from "preact/compat"

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

    return <div className="toggle-two">
        <Switch
            disabled={props.disabled}
            checked={active}
            onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            {
                set_active(event.currentTarget.checked)
            }}
            withThumbIndicator={false}
            color="var(--mantine-color-green-filled)"
            labelPosition={props.labelPosition || "right"}
            label={props.label(active)}
        />
    </div>
}
