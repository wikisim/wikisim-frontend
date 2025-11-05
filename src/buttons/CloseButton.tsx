import { ActionIcon, Tooltip } from "@mantine/core"
import IconSquareX from "@tabler/icons-react/dist/esm/icons/IconSquareX"
import { useState } from "preact/hooks"


interface Props
{
    label?: string
    style?: React.CSSProperties
    disabled?: boolean | string
    on_click: () => void
}

export default function CloseButton(props: Props)
{
    const label = typeof props.disabled === "string" ? props.disabled : (props.label || "Close")
    const [_hovered, set_hovered] = useState(false)

    return <div
        onPointerEnter={() => set_hovered(true)}
        onPointerLeave={() => set_hovered(false)}
    >
        <Tooltip label={label} position="bottom" style={props.style}>
            <ActionIcon
                disabled={!!props.disabled}
                onClick={props.on_click}
                variant={"subtle"}
                size="lg"
            >
                <IconSquareX />
            </ActionIcon>
        </Tooltip>
    </div>
}
