import { ActionIcon, Tooltip } from "@mantine/core"
// Have to import these icons using direct paths because otherwise vite loads
// all 5,000+ icons into the dev environment.
import IconFileUpload from "@tabler/icons-react/dist/esm/icons/IconFileUpload"
import IconPencil from "@tabler/icons-react/dist/esm/icons/IconPencil"


interface Props
{
    disabled?: boolean | string
    editing: boolean
    set_editing: (editing: boolean) => void
}

export default function EditOrSaveButton(props: Props)
{
    const { editing, set_editing } = props
    const label = (
        typeof props.disabled === "string" ? props.disabled
        : editing ? "Save Version" : "Edit"
    )

    return (
        <Tooltip label={label} position="bottom">
            <ActionIcon
                disabled={!!props.disabled}
                onClick={() => set_editing(!editing)}
                variant="subtle"
                size="lg"
            >
                {editing ? <IconFileUpload /> : <IconPencil />}
            </ActionIcon>
        </Tooltip>
    )
}
