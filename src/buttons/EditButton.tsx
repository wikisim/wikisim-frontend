import { ActionIcon, Tooltip } from "@mantine/core"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconFileUpload from "@tabler/icons-react/dist/esm/icons/IconFileUpload"
import IconPencil from "@tabler/icons-react/dist/esm/icons/IconPencil"


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
