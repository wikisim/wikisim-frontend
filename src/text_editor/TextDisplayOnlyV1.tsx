import { Tooltip } from "@mantine/core"
import IconExclamationCircle from "@tabler/icons-react/dist/esm/icons/IconExclamationCircle"
import { useEffect, useRef } from "preact/hooks"

import "../ui_components/input_elements.shared.css"
import "./TextEditorV1.css"


interface TextDisplayOnlyV1Props
{
    label: string
    value: string
    /**
     * If not set, will default to false if the value contains newlines,
     * otherwise will default to true.
     */
    single_line?: boolean
    invalid_value?: false | string
    className?: string
}


export function TextDisplayOnlyV1(all_props: TextDisplayOnlyV1Props)
{
    const {
        label,
        value,
        single_line,
        invalid_value = false,
        ...props
    } = all_props
    const allow_multiline = !(single_line ?? !value.includes("\n"))

    const has_value = value && value.length > 0

    let class_name = "text-editor-v1 "
    if (has_value) class_name += "has_value "
    if (invalid_value) class_name += "invalid_value "
    if (props.className) class_name += props.className + " "

    // Auto-resize the textarea height to fit content
    const textarea_ref = useRef<HTMLTextAreaElement>(null)
    useEffect(() =>
    {
        if (!textarea_ref.current) return
        textarea_ref.current.style.height = "auto"
        textarea_ref.current.style.height = textarea_ref.current.scrollHeight + "px"
    }, [value])


    return <Tooltip
        disabled={!invalid_value}
        label={invalid_value}
        position="bottom"
    >
        <div className={class_name}>
            {allow_multiline ? (
                <textarea
                    {...props}
                    ref={textarea_ref}
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
