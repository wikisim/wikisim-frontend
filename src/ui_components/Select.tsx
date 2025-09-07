// The only purpose of this component is to make the Mantine Select component
// look like the other text inputs in the application.
import { Select as MantineSelect } from "@mantine/core"

import "./input_elements.shared.css"
import "./Select.css"


type Props = React.ComponentProps<typeof MantineSelect> & { style?: React.CSSProperties }

export function Select(props: Props)
{
    const { label, style, ...rest } = props

    return <div className="wikisim-select has_value" style={style || {}}>
        {label && <label>{label}</label>}
        <MantineSelect {...rest} />
    </div>
}
