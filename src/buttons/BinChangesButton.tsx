import BinButton from "./BinButton"


interface Props
{
    disabled?: boolean | string
    highlighted?: boolean
    on_click: () => void
}

export default function BinChangesButton(props: Props)
{
    return <BinButton {...props} label="Discard Changes" />
}
