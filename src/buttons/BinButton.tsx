import { ActionIcon, Tooltip } from "@mantine/core"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconTrashX from "@tabler/icons-react/dist/esm/icons/IconTrashX"
import IconTrashXFilled from "@tabler/icons-react/dist/esm/icons/IconTrashXFilled"
import { useState } from "preact/hooks"


interface Props
{
    label?: string
    disabled?: boolean | string
    highlighted?: boolean
    on_click: () => void
}

export default function BinButton(props: Props)
{
    const label = typeof props.disabled === "string" ? props.disabled : (props.label || "Delete")
    const [hovered, set_hovered] = useState(false)

    return <div
        onPointerEnter={() => set_hovered(true)}
        onPointerLeave={() => set_hovered(false)}
    >
        <Tooltip label={label} position="bottom">
            <ActionIcon
                disabled={!!props.disabled}
                onClick={props.on_click}
                variant={(hovered || props.highlighted) ? "danger" : "subtle"}
                size="lg"
            >
                {hovered ? <IconTrashX /> : <IconTrashXFilled />}
            </ActionIcon>
        </Tooltip>
    </div>
}
