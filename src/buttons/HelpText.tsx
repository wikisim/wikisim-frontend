import { ActionIcon, Tooltip } from "@mantine/core"
import { JSX } from "preact/jsx-runtime"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconInfoCircle from "@tabler/icons-react/dist/esm/icons/IconInfoCircle"
import IconInfoCircleFilled from "@tabler/icons-react/dist/esm/icons/IconInfoCircleFilled"
import { useState } from "preact/hooks"


interface Props
{
    message: string | JSX.Element
}

export default function HelpText(props: Props)
{
    const [hovered, set_hovered] = useState(false)

    return <div
        onPointerEnter={() => set_hovered(true)}
        onPointerLeave={() => set_hovered(false)}
    >
        <Tooltip label={props.message} position="bottom">
            <ActionIcon
                variant={hovered ? "primary" : "subtle"}
                size="lg"
            >
                {hovered ? <IconInfoCircleFilled /> : <IconInfoCircle />}
            </ActionIcon>
        </Tooltip>
    </div>
}
