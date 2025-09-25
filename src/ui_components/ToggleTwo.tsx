import { Switch } from "@mantine/core"
import { TargetedEvent } from "preact/compat"


import "./ToggleTwo.css"


interface ToggleTwoProps
{
    active: boolean
    label: (v: boolean) => string
    set_active: (v: boolean) => void
}
export function ToggleTwo(props: ToggleTwoProps)
{
    const { active, set_active } = props

    return <div className="toggle-two">
        <Switch
            checked={active}
            onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            {
                set_active(event.currentTarget.checked)
            }}
            withThumbIndicator={false}
            color="var(--mantine-color-green-filled)"
            labelPosition="left"
            label={props.label(active)}
        />
    </div>
}
