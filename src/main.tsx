import { MantineProvider, Modal } from "@mantine/core"
import "@mantine/core/styles.css"
import { JSX, render } from "preact"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"

import "./monkey_patch"


interface PublishableEvents
{
    search_for_reference: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
    }
    search_result_selected: {
        // Identifier of which DOM component is requesting the search
        search_requester_id: string
        data_component_id: number
    }
}
type PublishableEventTypes = keyof PublishableEvents
type AllSubscribers = { [K in keyof PublishableEvents]?: ((data: PublishableEvents[K]) => void)[] }
const ALL_SUBSCRIBERS: AllSubscribers = {}
const pub_sub = {
    pub: <K extends PublishableEventTypes>(event: K, data: PublishableEvents[K]) =>
    {
        const subscribers = ALL_SUBSCRIBERS[event]
        if (!subscribers) return
        subscribers.forEach(callback => {
            try {
                callback(data)
            } catch (e) {
                console.error(`Error in subscriber for event "${event}":`, e)
            }
        })
    },
    sub: <K extends PublishableEventTypes>(event: K, callback: (data: PublishableEvents[K]) => void) =>
    {
        if (!ALL_SUBSCRIBERS[event])
        {
            ALL_SUBSCRIBERS[event] = []
        }
        ALL_SUBSCRIBERS[event].push(callback)

        const unsubscribe = () =>
        {
            console.log(`Unsubscribing from event "${event}"`, ALL_SUBSCRIBERS[event])
            const subscribers = ALL_SUBSCRIBERS[event]!
            ALL_SUBSCRIBERS[event] = subscribers.filter(cb => cb !== callback) as typeof subscribers
            console.log(`Unsubscribed from event "${event}"`, ALL_SUBSCRIBERS[event])
        }

        return unsubscribe
    },
}



interface SingleLineTextInputProps
{
    label: string
    value: string
    on_change?: (e: JSX.TargetedEvent<HTMLTextAreaElement | HTMLInputElement, Event>) => void
    on_blur?: (e: JSX.TargetedFocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void
    allow_multiline?: boolean
    start_focused?: false | "focused" | "focused_and_text_selected"
    /**
     * @deprecated Use `label` instead.
     */
    placeholder?: undefined
}


function TextInput(all_props: SingleLineTextInputProps)
{
    const { label, allow_multiline, ...props } = all_props

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

    const handle_on_focus = useMemo(() => (e: JSX.TargetedFocusEvent<HTMLTextAreaElement | HTMLInputElement>) =>
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
        // type guard
        if (!e.currentTarget) return
        // Only continue if last character entered is an "@"
        if (e.key !== "@") return

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
        const unsubscribe = pub_sub.sub("search_result_selected", data =>
        {
            if (data.search_requester_id !== search_requester_id) return
            if (data.data_component_id === undefined) return
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
        <div style={{
            position: "relative",
            marginTop: 5,
            marginBottom: 24,
            width: "fit-content" // Adjust width to fit content
        }}>
            {allow_multiline ? (
                <textarea
                    {...props}
                    value={value}
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
                    value={value}
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

function App ()
{
    const [title, set_title] = useState("")
    const [description, set_description] = useState("")

    return <MantineProvider
        theme={{
            fontFamily: `"Exo 2", sans-serif`,
            colors: {
                // Define custom colors if needed
            }
        }}
    >
        <div>
            <h1>WikiSim</h1>
            <p>An open source platform for back of the envelope calculations, data, and models of complex problems.</p>
            <p>WikiSim is a work in progress. Please check back later.</p>
        </div>

        {`${new Date().toLocaleTimeString()} ${new Date().getMilliseconds()}`}

        <TextInput
            label="Title"
            value={title}
            on_blur={(e: any) => set_title(e.target.value)}
            start_focused="focused_and_text_selected"
        />
        {title}
        <TextInput
            label="Description"
            value={description}
            allow_multiline={true}
            on_blur={(e: any) => set_description(e.target.value)}
        />
        {description}
        <SearchWindow/>
    </MantineProvider>
}

render(<App />, document.getElementById("app")!)


function SearchWindow()
{
    const [search_window_is_open, set_search_window_is_open] = useState(false)
    const [search_term, set_search_term] = useState("")
    const [search_requester_id, set_search_requester_id] = useState("")
    const trimmed_search_term = search_term.trim()

    useEffect(() => {
        const unsubscribe = pub_sub.sub("search_for_reference", ({ search_requester_id }) => {
            set_search_window_is_open(true)
            set_search_requester_id(search_requester_id)
        })
        // Cleanup function to unsubscribe when the component unmounts
        return unsubscribe
    }, [])

    useEffect(() => {
        const unsubscribe = pub_sub.sub("search_result_selected", () => {
            set_search_window_is_open(false)
            set_search_requester_id("")
        })
        // Cleanup function to unsubscribe when the component unmounts
        return unsubscribe
    }, [])

    const throttle_set_search_term = useMemo(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null
        return (term: string) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                set_search_term(term)
                timeout = null
            }, 300) // Throttle to 300ms
        }
    }, [])


    return <Modal
        opened={search_window_is_open}
        onClose={() => set_search_window_is_open(false)}
        title=""
    >
        {search_window_is_open && <div>
            <TextInput
                label="Search"
                value={search_term}
                on_change={e => throttle_set_search_term(e.currentTarget.value)}
                allow_multiline={false}
                start_focused="focused_and_text_selected"
            />

            <SearchResults
                search_term={trimmed_search_term}
                search_requester_id={search_requester_id}
            />
        </div>}

    </Modal>
}


function SearchResults(props: { search_term: string, search_requester_id: string })
{
    const search_term = props.search_term.trim()
    const { search_requester_id } = props

    const [results, set_results] = useState<SearchResultsResponse>({
        search_term: "",
        search_start_time: 0,
        search_requester_id: "",
        result_rows: []
    })


    useEffect(() => {
        const search_start_time = Date.now() // Unique ID for this search

        if (search_term.trim() === "") {
            set_results({
                search_term: "",
                search_start_time,
                search_requester_id,
                result_rows: []
            })
            return
        }

        let cancel_search = false

        mock_search_async_api({search_term, search_requester_id, search_start_time}).then(new_results => {
            if (cancel_search) return
            set_results(current_results => {
                // Return which ever results are newer based on search_id
                return current_results.search_start_time > new_results.search_start_time
                    ? current_results
                    : new_results
            })
        })

        return () => cancel_search = true
    }, [search_term])


    return <div>
        {search_term && (search_term !== results.search_term
            ? `Searching for "${search_term}"`
            : `Search results for "${results.search_term}"`)
        }

        {results.search_term &&
            (results.result_rows.length > 0 ? (
                <table>
                    {results.result_rows.map((row, index) => (
                        <tr
                            key={index}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                pub_sub.pub("search_result_selected", {
                                    search_requester_id,
                                    data_component_id: row.data_component_id,
                                })
                            }}
                        >
                            <td>{row.title}</td>
                        </tr>
                    ))}
                </table>
            ) : (
                <p>No results found.</p>
            ))
        }
    </div>
}


interface SearchResultsRequest
{
    search_term: string
    search_requester_id: string
}
interface SearchResultObj
{
    data_component_id: number
    title: string
}
interface SearchResultsResponse extends SearchResultsRequest
{
    search_start_time: number
    result_rows: SearchResultObj[]
}
function mock_search_async_api (request: SearchResultsRequest & { search_start_time: number }): Promise<SearchResultsResponse>
{
    const { search_term, search_start_time, search_requester_id } = request

    return new Promise(resolve => {
        setTimeout(() => {
            // Mock search results
            const mock_results: SearchResultObj[] = [
                {title: `Result for "${search_term}" 1`, data_component_id: 1},
                {title: `Result for "${search_term}" 2`, data_component_id: 2},
                {title: `Result for "${search_term}" 3`, data_component_id: 3},
            ]
            resolve({
                search_term,
                search_start_time,
                search_requester_id,
                result_rows: mock_results
            })
        }, search_term.length < 2 ? 5000 : 1000) // Simulate network delay
    })
}
