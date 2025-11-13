import { Button } from "@mantine/core"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import { DataComponent, NewDataComponent } from "core/data/interface"
import { get_function_signature } from "core/evaluator/format_function"

import "./ReadOnlyFunction.css"
import { ReadOnly } from "./sanitise_html"


export function ReadOnlyFunction(props: { component: DataComponent | NewDataComponent, max_height?: number })
{
    const {
        component: { value_type, input_value = "", function_arguments },
        max_height,
    } = props

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
    const [has_overflow, set_has_overflow] = useState(false)
    const container_ref = useRef<HTMLDivElement>(null)

    useEffect(() =>
    {
        if (!max_height || !container_ref.current || show_all) return

        const check_overflow = () =>
        {
            const container = container_ref.current
            if (!container) return

            // Check if scrollHeight exceeds max_height which indicates overflow
            // Edge case bug: will be true if content is exactly equal to max_height as well
            const is_overflowing = container.scrollHeight >= max_height
            set_has_overflow(is_overflowing)
        }

        // Check initially and whenever content changes
        check_overflow()

        // Use ResizeObserver to detect if content size changes dynamically
        const resize_observer = new ResizeObserver(check_overflow)
        resize_observer.observe(container_ref.current)

        return () => resize_observer.disconnect()
    }, [max_height, function_as_tiptap_html, show_all])


    return <div className="read-only-function" ref={container_ref}>
        <ReadOnly html={function_as_tiptap_html} is_code={true} max_height={show_all ? undefined : max_height} />
        {max_height !== undefined && has_overflow &&
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
