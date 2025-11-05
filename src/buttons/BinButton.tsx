import { ActionIcon, Tooltip } from "@mantine/core"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconTrashX from "@tabler/icons-react/dist/esm/icons/IconTrashX"
import IconTrashXFilled from "@tabler/icons-react/dist/esm/icons/IconTrashXFilled"
import { useEffect, useState } from "preact/hooks"


interface Props
{
    label?: string
    style?: React.CSSProperties
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
        <Tooltip label={label} position="bottom" style={props.style}>
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


interface ConfirmBinButtonProps extends Props
{
    confirmation_label?: string
}
export function ConfirmBinButton(props: ConfirmBinButtonProps)
{
    const [confirming, set_confirming] = useState(false)

    useEffect(() =>
    {
        if (!confirming) return

        const timeout = setTimeout(() => set_confirming(false), 5000)
        return () => clearTimeout(timeout)
    }, [confirming])


    if (confirming)
    {
        return <BinButton
            highlighted={true}
            disabled={props.disabled}
            label={props.confirmation_label ?? "Click again to confirm delete"}
            style={{
                backgroundColor: "var(--colour-danger-background)",
                color: "var(--colour-danger-text)",
            }}
            on_click={() =>
            {
                set_confirming(false)
                props.on_click()
            }}
        />
    }
    else
    {
        return <BinButton
            disabled={props.disabled}
            label={props.label}
            on_click={() => set_confirming(true)}
        />
    }
}
