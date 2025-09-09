import { ActionIcon, Tooltip } from "@mantine/core"
import { JSX } from "preact/jsx-runtime"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconInfoCircle from "@tabler/icons-react/dist/esm/icons/IconInfoCircle"
import IconInfoCircleFilled from "@tabler/icons-react/dist/esm/icons/IconInfoCircleFilled"
import { useState } from "preact/hooks"

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
    message: string | JSX.Element
    children?: JSX.Element
}

export function HelpToolTip(props: HelpToolTipProps)
{
    const { delay = 700 } = props
    const [active, set_active] = useState(false)

    const message = props.message

    return <div
        onPointerEnter={() => !IS_MOBILE && setTimeout(() => set_active(true), delay)}
        onPointerLeave={() => !IS_MOBILE && set_active(false)}
        onPointerDown={() => IS_MOBILE && setTimeout(() => set_active(!active), active ? 0 : delay)}
    >
        <Tooltip
            openDelay={delay}
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
