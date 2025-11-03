import { useCallback, useMemo, useState } from "preact/hooks"

import "./JSONViewer.css"
import { JSONPath, SelectedJSONPath } from "./interface"
import { factory_is_path_selected } from "./is_path_selected"


const indent_size = 4 * 3

interface JSONViewerProps
{
    data: unknown
    initial_collapsed_to_level?: number
    hovering_path?: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path?: (path: JSONPath, is_leaf_value: boolean) => void
    selected_paths?: SelectedJSONPath[]
}
export function JSONViewer(props: JSONViewerProps)
{
    const selected_path_strs = useMemo(() =>
    {
        const strings = props.selected_paths?.map(sp => JSON.stringify(sp.path)) || []
        return new Set(strings)
    }, [props.selected_paths])

    return <div className="json-viewer">
        <RecursiveJSONViewer
            data={props.data}
            current_path={[]}
            initial_collapsed_to_level={props.initial_collapsed_to_level || 1}
            trailing_comma={false}
            hovering_path={props.hovering_path || (() => {})}
            selected_path={props.selected_path || (() => {})}
            selected_path_strs={selected_path_strs}
        />
    </div>
}


interface RecursiveJSONViewerProps
{
    data: unknown
    current_path: JSONPath
    initial_collapsed_to_level: number
    trailing_comma: boolean
    hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
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
            hovering_path={props.hovering_path}
            selected_path={props.selected_path}
            selected_path_strs={props.selected_path_strs}
        />
    }
    else if (typeof data === "object")
    {
        return <JSONObjectViewer
            data={data as Record<string, unknown>}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={props.trailing_comma}
            hovering_path={props.hovering_path}
            selected_path={props.selected_path}
            selected_path_strs={props.selected_path_strs}
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
    current_path: JSONPath
    initial_collapsed_to_level: number
    trailing_comma: boolean
    hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
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

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        set_is_hovered(true)
        props.hovering_path(current_path, false)
    }, [props.hovering_path, JSON.stringify(current_path)])

    const on_pointer_leave = useCallback((e: PointerEvent) =>
    {
        e.stopImmediatePropagation()
        set_is_hovered(false)
    }, [])

    const keys = useMemo(() => Object.keys(data), [data])

    const path_element = current_path[current_path.length - 1]
    const key_name = path_element && "key" in path_element ? path_element.key : ""
    const key_str = typeof key_name === "string" && key_name && `"${key_name}": `

    return <div
        className={"json-object-viewer json-collapsible" + (is_hovered ? " is_hovered" : "")}
        onPointerOver={on_pointer_over}
        onPointerLeave={on_pointer_leave}
    >
        <div
            className="json-brace"
            onClick={toggle_initial_collapsed_to_level}
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
                    current_path={[...current_path, { key }]}
                    initial_collapsed_to_level={initial_collapsed_to_level}
                    hovering_path={props.hovering_path}
                    selected_path={props.selected_path}
                    selected_path_strs={props.selected_path_strs}
                />)}
            </div>
            <div
                className="json-brace"
                onClick={toggle_initial_collapsed_to_level}
                onPointerOver={on_pointer_over}
            >
                {"}" + (props.trailing_comma ? "," : "")}
            </div>
        </>}
    </div>
}


interface JSONArrayViewerProps
{
    data: unknown[]
    current_path: JSONPath
    initial_collapsed_to_level: number
    trailing_comma: boolean
    hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
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

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.hovering_path(current_path, false)
        // set_is_hovered(true)
    }, [props.hovering_path, JSON.stringify(current_path)])

    const path_element = current_path[current_path.length - 1]
    const key_name = path_element && "key" in path_element ? path_element.key : ""
    const key_str = key_name && `"${key_name}": `

    return <div className="json-array-viewer json-collapsible">
        <div
            className="json-bracket"
            onClick={toggle_initial_collapsed_to_level}
            onPointerOver={on_pointer_over}
        >
            {key_str}{is_collapsed ? ("[ ... ]" + (props.trailing_comma ? "," : "")) : "["}
        </div>
        { !is_collapsed && <>
            <div className="json-array-contents" style={css_indent(1)}>
                {data.map((item, index) => <JSONArrayItem
                    key={index}
                    index={index}
                    array_length={data.length}
                    item={item}
                    current_path={[...current_path, { index }]}
                    initial_collapsed_to_level={initial_collapsed_to_level}
                    hovering_path={props.hovering_path}
                    selected_path={props.selected_path}
                    selected_path_strs={props.selected_path_strs}
                />)}
            </div>
            <div className="json-bracket">
                {"]" + (props.trailing_comma ? "," : "")}
            </div>
        </>}
    </div>
}


interface JSONObjectItemProps
{
    index: number
    keys: string[]
    value: unknown
    current_path: JSONPath
    initial_collapsed_to_level: number
    hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
}
function JSONObjectItem(props: JSONObjectItemProps)
{
    const { keys, value, current_path, initial_collapsed_to_level, index } = props
    const key = keys[index]!

    const is_collapsible = value_is_nested(value)
    const is_leaf_value = !is_collapsible

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.hovering_path(current_path, is_leaf_value)
    }, [props.hovering_path, current_path, is_leaf_value])

    const on_pointer_down = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.selected_path(current_path, is_leaf_value)
    }, [props.selected_path, current_path, is_leaf_value])

    const is_path_selected = useMemo(() => factory_is_path_selected(current_path), [current_path])
    const is_selected = useMemo(() => is_path_selected(props.selected_path_strs), [is_path_selected, props.selected_path_strs])
    const is_selected_class = is_selected ? " is_selected" : ""

    return <div
        className={"json-object-item" + ((is_collapsible ? " " : " not-") + "json-collapsible")}
        onPointerOver={on_pointer_over}
        onPointerDown={on_pointer_down}
    >
        {!is_collapsible && <>
            <span className={"json-object-key" + is_selected_class}>
                "{key}"
            </span>:&nbsp;
        </>}
        <RecursiveJSONViewer
            data={value}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={index < keys.length - 1}
            hovering_path={props.hovering_path}
            selected_path={props.selected_path}
            selected_path_strs={props.selected_path_strs}
        />
    </div>
}


interface JSONArrayItemProps
{
    index: number
    array_length: number
    item: unknown
    current_path: JSONPath
    initial_collapsed_to_level: number
    hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
}
function JSONArrayItem(props: JSONArrayItemProps)
{
    const { array_length, item, current_path, initial_collapsed_to_level, index } = props

    const is_collapsible = value_is_nested(item)
    const is_leaf_value = !is_collapsible

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.hovering_path(current_path, is_leaf_value)
    }, [props.hovering_path, current_path, is_leaf_value])

    const on_pointer_down = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.selected_path(current_path, is_leaf_value)
    }, [props.selected_path, current_path, is_leaf_value])

    const is_path_selected = useMemo(() => factory_is_path_selected(current_path), [current_path])
    const is_selected = useMemo(() => is_path_selected(props.selected_path_strs), [is_path_selected, props.selected_path_strs])
    const is_selected_class = is_selected ? " is_selected" : ""

    return <div
        key={index}
        className={"json-array-item" + is_selected_class}
        onPointerOver={on_pointer_over}
        onPointerDown={on_pointer_down}
    >
        <RecursiveJSONViewer
            data={item}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={index < (array_length - 1)}
            hovering_path={props.hovering_path}
            selected_path={props.selected_path}
            selected_path_strs={props.selected_path_strs}
        />
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
