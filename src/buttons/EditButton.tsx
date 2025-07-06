import { ActionIcon, Tooltip } from "@mantine/core"
import { IconFileUpload, IconPencil } from "@tabler/icons-react"


export default function EditButton(props: { editing: boolean, set_editing: (editing: boolean) => void })
{
    const { editing, set_editing } = props

    return (
        <Tooltip label={editing ? "Save Version" : "Edit"}>
            <ActionIcon
                onClick={() => set_editing(!editing)}
                variant="subtle"
                size="lg"
                color="blue"
            >
                {editing ? <IconFileUpload /> : <IconPencil />}
            </ActionIcon>
        </Tooltip>
    )
}
