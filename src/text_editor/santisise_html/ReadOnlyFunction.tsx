import { Button } from "@mantine/core"
import { useMemo, useState } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"
import { get_function_signature } from "core/evaluator/format_function"

import "./ReadOnlyFunction.css"
import { ReadOnly } from "./sanitise_html"


export function ReadOnlyFunction(props: { component: DataComponent | NewDataComponent, max_height?: number })
{
    const { component: { value_type, input_value = "", function_arguments } } = props

    if (value_type !== "function")
    {
        return <></>
    }

    const function_as_tiptap_html = useMemo(() =>
    {
        const function_signature = get_function_signature(function_arguments || [])
        const function_signature_tiptap = `<p>${function_signature} => {</p>`

        const indented_input_value = input_value
            .replaceAll("<p>", "<p> &nbsp; &nbsp;")
            .replaceAll("<br>", "<br>&nbsp; &nbsp;")

        return function_signature_tiptap + indented_input_value + "<p>}</p>"
    }, [function_arguments, input_value])

    const [show_all, set_show_all] = useState(false)

    return <div className="read-only-function">
        <ReadOnly html={function_as_tiptap_html} is_code={true} max_height={show_all ? undefined : props.max_height} />
        {props.max_height &&
            <div className="end-fade-and-button">
                <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => set_show_all(!show_all)}
                >
                    {show_all ? "Show Less" : "Show All"}
                </Button>
            </div>
        }
    </div>
}
