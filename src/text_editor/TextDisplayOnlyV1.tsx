import { Tooltip } from "@mantine/core"
import "@mantine/core/styles.css"
import IconExclamationCircle from "@tabler/icons-react/dist/esm/icons/IconExclamationCircle"

import "../monkey_patch"
import "../ui_components/input_elements.shared.css"
import "./TextEditorV1.css"


interface TextDisplayOnlyV1Props
{
    label: string
    value: string
    single_line?: boolean
    invalid_value?: false | string
    className?: string
}


export function TextDisplayOnlyV1(all_props: TextDisplayOnlyV1Props)
{
    const {
        label,
        value,
        single_line = false,
        invalid_value = false,
        ...props
    } = all_props
    const allow_multiline = !single_line

    const has_value = value && value.length > 0

    let class_name = "text-editor-v1 "
    if (has_value) class_name += "has_value "
    if (invalid_value) class_name += "invalid_value "
    if (props.className) class_name += props.className + " "

    return <Tooltip
        disabled={!invalid_value}
        label={invalid_value}
        position="bottom"
    >
        <div className={class_name}>
            {allow_multiline ? (
                <textarea
                    {...props}
                    disabled={true}
                    value={value}
                />
            ) : (
                <input
                    {...props}
                    disabled={true}
                    value={value}
                />
            )}
            <label>{label}</label>

            {invalid_value && <IconExclamationCircle className="error-icon" />}
        </div>
    </Tooltip>
}
