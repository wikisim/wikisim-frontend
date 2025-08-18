// The only purpose of this component is to make the Mantine Select component
// look like the other text inputs in the application.
import { Select as MantineSelect } from "@mantine/core"

import "./input_elements.shared.css"
import "./Select.css"


export function Select(props: React.ComponentProps<typeof MantineSelect>)
{
    const { label, ...rest } = props

    return <div className="wikisim-select has_value">
        {label && <label>{label}</label>}
        <MantineSelect {...rest} />
    </div>
}
