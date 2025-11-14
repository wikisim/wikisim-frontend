import { ActionIcon } from "@mantine/core"
import IconCaretDownFilled from "@tabler/icons-react/dist/esm/icons/IconCaretDownFilled"
import IconCaretUpFilled from "@tabler/icons-react/dist/esm/icons/IconCaretUpFilled"


export default function OpenCloseSection(props: { opened: boolean, on_pointer_down?: (e: PointerEvent) => void })
{
    return <ActionIcon size="xl" variant="subtle" onPointerDown={props.on_pointer_down}>
        {props.opened ? <IconCaretUpFilled /> : <IconCaretDownFilled />}
    </ActionIcon>
}
