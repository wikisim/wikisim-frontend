import { ActionIcon } from "@mantine/core"
import IconCaretDownFilled from "@tabler/icons-react/dist/esm/icons/IconCaretDownFilled"
import IconCaretUpFilled from "@tabler/icons-react/dist/esm/icons/IconCaretUpFilled"


export default function OpenCloseSection(props: { opened: boolean })
{
    return <ActionIcon size="xl" variant="subtle">
        {props.opened ? <IconCaretUpFilled /> : <IconCaretDownFilled />}
    </ActionIcon>
}
