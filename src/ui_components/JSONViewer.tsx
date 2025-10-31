import { useCallback, useMemo, useState } from "preact/hooks"

import "./JSONViewer.css"


const indent_size = 4 * 3

export function JSONViewer(props: { data: unknown, initial_collapsed_to_level?: number })
{
    return <div className="json-viewer">
        <RecursiveJSONViewer
            data={props.data}
            current_path={[]}
            initial_collapsed_to_level={props.initial_collapsed_to_level || 1}
            trailing_comma={false}
        />
    </div>
}


interface RecursiveJSONViewerProps
{
    data: unknown
    current_path: (string | number)[]
    initial_collapsed_to_level: number
    trailing_comma: boolean
}
function RecursiveJSONViewer(props: RecursiveJSONViewerProps)
{
    const { data, current_path, initial_collapsed_to_level } = props

    if (data === null)
    {
        return <><span className="json-null">null</span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "string")
    {
        return <><span className="json-string">"{data}"</span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "number")
    {
        return <><span className="json-number">{data}</span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "boolean")
    {
        return <><span className="json-boolean">{data.toString()}</span>{props.trailing_comma ? "," : ""}</>
    }
    else if (Array.isArray(data))
    {
        return <JSONArrayViewer
            data={data}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={props.trailing_comma}
        />
    }
    else if (typeof data === "object")
    {
        return <JSONObjectViewer
            data={data as Record<string, unknown>}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={props.trailing_comma}
        />
    }
    else
    {
        return <span>Unsupported data type "{typeof data}"</span>
    }
}


interface JSONObjectViewerProps
{
    data: Record<string, unknown>
    current_path: (string | number)[]
    initial_collapsed_to_level: number
    trailing_comma: boolean
}
function JSONObjectViewer(props: JSONObjectViewerProps)
{
    const { data, current_path, initial_collapsed_to_level } = props
    const [is_collapsed, set_is_collapsed] = useState<boolean>(initial_collapsed_to_level < current_path.length)
    const [is_hovered, set_is_hovered] = useState<boolean>(false)

    const toggle_initial_collapsed_to_level = useCallback((e: MouseEvent) =>
    {
        e.stopPropagation()
        set_is_collapsed(c => !c)
    }, [])

    const on_pointer_enter = useCallback(() => set_is_hovered(true), [])
    const on_pointer_leave = useCallback(() => set_is_hovered(false), [])

    const keys = useMemo(() => Object.keys(data), [data])

    const key_name = current_path.length > 0 ? current_path[current_path.length - 1] : ""
    const key_str = typeof key_name === "string" && key_name && `"${key_name}": `

    return <div
        className={"json-object-viewer json-collapsible" + (is_hovered ? " is_hovered" : "")}
    >
        <div
            className="json-brace"
            onClick={toggle_initial_collapsed_to_level}
            onPointerEnter={on_pointer_enter}
            onPointerLeave={on_pointer_leave}
        >
            {key_str}{is_collapsed ? ("{ ... }" + (props.trailing_comma ? "," : "")) : "{"}
        </div>
        {!is_collapsed && <>
            <div
                className="json-object-contents"
                style={css_indent(1)}
                onClick={e => e.stopPropagation()}
            >
                {keys.map((key, index) => <JSONObjectItem
                    key={key}
                    index={index}
                    keys={keys}
                    value={data[key]}
                    current_path={[...current_path, key]}
                    initial_collapsed_to_level={initial_collapsed_to_level}
                />)}
            </div>
            <div
                className="json-brace"
                onClick={toggle_initial_collapsed_to_level}
                onPointerEnter={on_pointer_enter}
                onPointerLeave={on_pointer_leave}
            >
                {"}" + (props.trailing_comma ? "," : "")}
            </div>
        </>}
    </div>
}


interface JSONObjectItemProps
{
    index: number
    keys: string[]
    value: unknown
    current_path: (string | number)[]
    initial_collapsed_to_level: number
}
function JSONObjectItem(props: JSONObjectItemProps)
{
    const { keys, value, current_path, initial_collapsed_to_level, index } = props
    const key = keys[index]!

    const [is_collapsed, set_is_collapsed] = useState<boolean>(initial_collapsed_to_level < current_path.length)

    const is_collapsible = value_is_nested(value)

    const toggle_initial_collapsed_to_level = useCallback((e: MouseEvent) =>
    {
        e.stopPropagation()
        if (!is_collapsible) return
        set_is_collapsed(c => !c)
    }, [is_collapsible])

    return <div
        className={"json-object-item" + ((is_collapsible ? " " : " not-") + "json-collapsible")}
        onPointerDown={toggle_initial_collapsed_to_level}
    >
        {!is_collapsible && <><span className="json-object-key">"{key}"</span>:&nbsp;</>}
        <RecursiveJSONViewer
            data={value}
            current_path={[...current_path, key]}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={index < keys.length - 1}
        />
    </div>
}


interface JSONArrayViewerProps
{
    data: unknown[]
    current_path: (string | number)[]
    initial_collapsed_to_level: number
    trailing_comma: boolean
}
function JSONArrayViewer(props: JSONArrayViewerProps)
{
    const { data, current_path, initial_collapsed_to_level } = props
    const [is_collapsed, set_is_collapsed] = useState<boolean>(initial_collapsed_to_level < current_path.length)

    const toggle_initial_collapsed_to_level = useCallback((e: MouseEvent) =>
    {
        e.stopPropagation()
        set_is_collapsed(c => !c)
    }, [])

    const key_name = current_path.length > 0 ? current_path[current_path.length - 1] : ""
    const key_str = key_name && `"${key_name}": `

    return <div className="json-array-viewer json-collapsible">
        <div className="json-bracket" onClick={toggle_initial_collapsed_to_level}>
            {key_str}{is_collapsed ? ("[ ... ]" + (props.trailing_comma ? "," : "")) : "["}
        </div>
        { !is_collapsed && <>
            <div className="json-array-contents" style={css_indent(1)}>
                {data.map((item, index) =>
                    <div key={index} className="json-array-item">
                        <RecursiveJSONViewer
                            data={item}
                            current_path={[...current_path, index]}
                            initial_collapsed_to_level={initial_collapsed_to_level}
                            trailing_comma={index < data.length - 1}
                        />
                    </div>
                )}
            </div>
            <div className="json-bracket">
                {"]" + (props.trailing_comma ? "," : "")}
            </div>
        </>}
    </div>
}


function value_is_nested(value: unknown): boolean
{
    if (value === null) return false
    if (Array.isArray(value)) return true
    return typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype)
}


function css_indent(level: number): Record<string, string>
{
    return {
        paddingLeft: `${(level + 1) * indent_size}px`
    }
}


export function JsonViewerDemo()
{
    const sample_data = {
        name: "Example",
        version: 1,
        isActive: true,
        items: [
            { id: 1, value: "Item 1" },
            { id: 2, value: "Item 2", details: { description: "This is item 2", tags: ["tag1", "tag2"] } },
            { id: 3, value: "Item 3" },
        ],
        metadata: {
            created: "2024-01-01T12:00:00Z",
            modified: null,
            contributors: [
                { name: "Alice", role: "author" },
                { name: "Bob", role: "editor" },
            ],
        },
    }

    return <div style={{ padding: "20px" }}>
        <h2>JSON Viewer Demo Object</h2>
        <JSONViewer data={sample_data} />

        <h2>JSON Viewer Demo List</h2>
        <JSONViewer data={sample_data.items} />
    </div>
}
