import "@mantine/core/styles.css"
import { JSX } from "preact"
import { useMemo, useRef, useState } from "preact/hooks"

import "../monkey_patch"
import pub_sub from "../pub_sub"
import "./TextEditorV1.css"


interface SingleLineTextInputProps
{
    editable: boolean
    label: string
    value: string
    on_change?: (e: JSX.TargetedEvent<HTMLTextAreaElement | HTMLInputElement, Event>) => void
    on_blur?: (e: JSX.TargetedFocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void
    single_line?: boolean
    start_focused?: false | "focused" | "focused_and_text_selected"
    trigger_search_on_at_symbol?: boolean
    on_key_down?: (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void
    /**
     * @deprecated Use `label` instead.
     */
    placeholder?: undefined
}


export function TextEditorV1(all_props: SingleLineTextInputProps)
{
    const {
        editable = false,
        label,
        single_line = false,
        trigger_search_on_at_symbol = false,
        on_key_down,
        ...props
    } = all_props
    const allow_multiline = !single_line

    // Handle bringing focus to the input on first render
    const first_render = useRef(Date.now())
    const cursor_position_on_blur_to_search = useRef<number | undefined>(undefined)
    const handle_ref = useMemo(() => (el: HTMLTextAreaElement | HTMLInputElement | null) => {
        if (!el) return

        // Handle if cursor_position_on_blur_to_search is set
        if (cursor_position_on_blur_to_search.current !== undefined)
        {
            // If the input is focused, set the cursor position to the stored position
            if (el === document.activeElement)
            {
                el.setSelectionRange(cursor_position_on_blur_to_search.current, cursor_position_on_blur_to_search.current)
                cursor_position_on_blur_to_search.current = undefined // Reset after using it
            }
        }

        // Handle props.start_focused
        if (props.start_focused && (first_render.current >= (Date.now() - 100)))
        {
            el.focus()
            if (props.start_focused === "focused_and_text_selected")
            {
                el.select() // Select all the text in the input
            }
        }
    }, [props.start_focused, first_render])


    const [focused, set_focused] = useState(false)
    const [value, set_value] = useState(props.value)

    const handle_on_change = useMemo(() => (e: JSX.TargetedEvent<HTMLTextAreaElement | HTMLInputElement, Event>) =>
    {
        set_value(e.currentTarget.value)
        if (props.on_change) props.on_change(e)
    }, [props.on_change])

    const handle_on_focus = useMemo(() => () =>
    {
        set_focused(true)
    }, [props.start_focused])

    const handle_on_blur = useMemo(() => (e: JSX.TargetedFocusEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    {
        set_focused(false)
        if (props.on_blur) props.on_blur(e)
    }, [props.on_blur])

    const has_value = value && value.length > 0

    // Handler to auto-grow textarea
    function handle_input(e: any)
    {
        if (allow_multiline && e.target)
        {
            e.target.style.height = "auto"
            const fudge = 2 // Based on padding and border (requires -22 px) and mantine styles (+24px it seems?)
            e.target.style.height = e.target.scrollHeight + fudge + "px"
        }
    }

    /**
     * This function ensures that when a user types "@" in the input
     * ~~(and this "@" is not following a letter like from an email address)~~
     * then it will trigger the "search_for_reference" event which will open a search
     * window and allow the user to select a reference from the search results.
     * The selected reference will be inserted into the input at the cursor position.
     *
     * It also records the cursor position so that when the input is focused
     * again after the search is completed, it will place the cursor at the
     * position where the "@" was typed.
     */
    const handle_on_key_up = useMemo(() => (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    {
        // Only continue if last character entered is an "@"
        if (e.key !== "@") return
        if (!trigger_search_on_at_symbol) return
        e.stopImmediatePropagation()

        // Find current cursor position
        const cursor_position = e.currentTarget.selectionStart ?? 0
        // // Get the text before the cursor
        // const text_before_cursor = e.currentTarget.value.slice(cursor_position - 2, cursor_position -1)
        // // If the penultimate character before the cursor is a letter, i.e. the
        // // user might be typing name@domain.com and they've typed do not trigger
        // // the "search_for_reference" event
        // if (/[a-zA-Z]$/.test(text_before_cursor)) return

        const search_requester_id = label + "_" + Math.random().toString(10).slice(2, 10) // Generate a random source ID
        pub_sub.pub("search_for_reference", { search_requester_id })
        const unsubscribe = pub_sub.sub("search_for_reference_completed", data =>
        {
            if (data.search_requester_id !== search_requester_id) return
            unsubscribe()

            cursor_position_on_blur_to_search.current = cursor_position + data.data_component_id.toString().length

            // Insert the selected search result into the input
            set_value(current_value => {
                const new_value = (
                    current_value.slice(0, cursor_position)
                    + data.data_component_id
                    + current_value.slice(cursor_position)
                )
                return new_value
            })
        })
    }, [])

    return (
        <div className="text-editor-v1">
            {allow_multiline ? (
                <textarea
                    {...props}
                    disabled={!editable}
                    value={value}
                    onKeyDown={on_key_down}
                    onKeyUp={handle_on_key_up}
                    onChange={handle_on_change}
                    onInput={handle_input}
                    onFocus={handle_on_focus}
                    onBlur={handle_on_blur}
                    // This `ref={el => handle_ref(el)}` is
                    // used to ensure the input is focused correctly on first render.
                    // Because otherwise sometimes the input is not focused
                    // on first render for example when a text input is added to the Mantine Modal.
                    // The alternative is to use setTimeout to wrap the contents
                    // of the `handle_ref` function.
                    ref={el => handle_ref(el)}
                    style={{
                        padding: "12px 12px 10px 12px",
                        fontSize: 16,
                        border: "1px solid #ced4da",
                        borderRadius: 4,
                        outline: focused ? "2px solid #228be6" : "none",
                        transition: "outline 0.2s",
                        resize: "none", // Hide resize handle
                        minWidth: "220px", // Minimum width to match single line input
                    }}
                />
            ) : (
                <input
                    {...props}
                    disabled={!editable}
                    value={value}
                    onKeyDown={on_key_down}
                    onKeyUp={handle_on_key_up}
                    onChange={handle_on_change}
                    onFocus={handle_on_focus}
                    onBlur={handle_on_blur}
                    // This `ref={el => handle_ref(el)}` is
                    // used to ensure the input is focused correctly on first render.
                    // Because otherwise sometimes the input is not focused
                    // on first render for example when a text input is added to the Mantine Modal.
                    // The alternative is to use setTimeout to wrap the contents
                    // of the `handle_ref` function.
                    ref={el => handle_ref(el)}
                    style={{
                        padding: "12px 12px 8px 12px",
                        fontSize: 16,
                        border: "1px solid #ced4da",
                        borderRadius: 4,
                        outline: focused ? "2px solid #228be6" : "none",
                        transition: "outline 0.2s",
                        minWidth: "220px", // Minimum width to match single line input
                    }}
                />
            )}
            <label
                style={{
                    position: "absolute",
                    left: 12,
                    top: has_value || focused ? -10 : 12,
                    fontSize: has_value || focused ? 12 : 16,
                    color: focused ? "#228be6" : "#868e96",
                    background: "white",
                    padding: has_value || focused ? "0 4px" : "0",
                    pointerEvents: "none",
                    transition: "all 0.2s"
                }}
            >
                {label}
            </label>
        </div>
    )
}
