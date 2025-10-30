import { ActionIcon, Tooltip } from "@mantine/core"
import { JSX } from "preact/jsx-runtime"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconInfoCircle from "@tabler/icons-react/dist/esm/icons/IconInfoCircle"
import IconInfoCircleFilled from "@tabler/icons-react/dist/esm/icons/IconInfoCircleFilled"
import { useRef, useState } from "preact/hooks"

import { is_mobile_device } from "../utils/is_mobile_device"


const IS_MOBILE = is_mobile_device()

interface Props
{
    message: string | JSX.Element
}

export default function HelpText(props: Props)
{
    const [active, set_active] = useState(false)

    const message = props.message

    return <div
        onPointerEnter={() => !IS_MOBILE && set_active(true)}
        onPointerLeave={() => !IS_MOBILE && set_active(false)}
        onPointerDown={() => IS_MOBILE && set_active(!active)}
    >
        <Tooltip
            label={message}
            position="bottom"
            opened={active}
            withArrow={true}
            multiline={true}
            style={{ maxWidth: IS_MOBILE ? 300 : 600 }}
        >
            <ActionIcon
                variant={active ? "primary" : "subtle"}
                size="lg"
            >
                {active ? <IconInfoCircleFilled /> : <IconInfoCircle />}
            </ActionIcon>
        </Tooltip>
    </div>
}


interface HelpToolTipProps
{
    delay?: number
    close_delay?: number
    message: string | JSX.Element
    children?: JSX.Element
}

export function HelpToolTip(props: HelpToolTipProps)
{
    const { delay = 300, close_delay = 0 } = props
    const [active, set_active] = useState(false)
    const timeout_ref = useRef<NodeJS.Timeout>()

    const message = props.message

    return <div
        onPointerEnter={() =>
        {
            if (IS_MOBILE) return
            timeout_ref.current = setTimeout(() => set_active(true), delay)
        }}
        onPointerLeave={() =>
        {
            if (IS_MOBILE) return
            clearTimeout(timeout_ref.current)
            timeout_ref.current = setTimeout(() => set_active(false), close_delay)
        }}
        onPointerDown={() =>
        {
            // NOT mobile
            if (!IS_MOBILE) return
            clearTimeout(timeout_ref.current)

            const new_active = !active
            set_active(new_active)

            if (!new_active) return
            if (close_delay === 0) return
            timeout_ref.current = setTimeout(() => set_active(false), close_delay)
        }}
    >
        <Tooltip
            // We handle delays ourselves to have different behaviour on mobile
            // openDelay={delay}
            // closeDelay={close_delay}
            label={message}
            position="bottom"
            opened={active}
            withArrow={true}
            multiline={true}
            style={{ maxWidth: IS_MOBILE ? 300 : 600 }}
        >
            {props.children}
        </Tooltip>
    </div>
}
