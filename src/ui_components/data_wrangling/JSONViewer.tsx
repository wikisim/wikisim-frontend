import { useCallback, useMemo, useState } from "preact/hooks"

import { Json } from "core/supabase/interface"

import "./JSONViewer.css"
import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"
import { factory_paths_match } from "./factory_paths_match"
import { JSONPath, SelectedJSONPath } from "./interface"


const indent_spaces = 2

interface JSONViewerProps
{
    data: Json
    initial_collapsed_to_level?: number

    on_hovering_path?: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path?: JSONPath

    max_wildcards?: number
    on_selected_path?: (path: JSONPath, is_leaf_value: boolean) => void
    selected_paths?: SelectedJSONPath[]
}
export function JSONViewer(props: JSONViewerProps)
{
    const hovered_path_str = useMemo(() =>
    {
        if (!props.hovered_path) return ""
        const hovered_path_with_wildcards = convert_array_paths_to_wildcards(props.hovered_path)
        return JSON.stringify(hovered_path_with_wildcards)
    }, [props.hovered_path])

    const selected_path_strs = useMemo(() =>
    {
        const strings = props.selected_paths?.map(sp => JSON.stringify(sp.path)) || []
        return new Set(strings)
    }, [props.selected_paths])

    return <div className="json-viewer-container">
        <div className="json-viewer">
            <RecursiveJSONViewer
                data={props.data}
                current_path={[]}
                initial_collapsed_to_level={props.initial_collapsed_to_level || 1}
                trailing_comma={false}
                on_hovering_path={props.on_hovering_path || (() => {})}
                hovered_path_str={hovered_path_str}
                max_wildcards={props.max_wildcards}
                on_selected_path={props.on_selected_path || (() => {})}
                selected_path_strs={selected_path_strs}
            />
            <div className="overflow-gap" />
        </div>

        <div className="overflow-fade-out" />
    </div>
}


interface RecursiveJSONViewerProps
{
    data: unknown
    current_path: JSONPath
    initial_collapsed_to_level: number
    trailing_comma: boolean
    on_hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path_str: string
    max_wildcards: number | undefined
    on_selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>

    // Convenience props, could calculate from selected_path_strs but we already
    // have the logic in parent components
    is_selected?: boolean
}
function RecursiveJSONViewer(props: RecursiveJSONViewerProps)
{
    const { data, current_path, initial_collapsed_to_level } = props

    const is_selected_class = props.is_selected ? " is_selected" : ""

    if (data === null)
    {
        return <><span className={"json-null" + is_selected_class}>
            null
        </span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "string")
    {
        return <><span className={"json-string" + is_selected_class}>
            "{data}"
        </span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "number")
    {
        return <><span className={"json-number" + is_selected_class}>
            {data}
        </span>{props.trailing_comma ? "," : ""}</>
    }
    else if (typeof data === "boolean")
    {
        return <><span className={"json-boolean" + is_selected_class}>
            {data.toString()}
        </span>{props.trailing_comma ? "," : ""}</>
    }
    else if (Array.isArray(data))
    {
        return <JSONArrayViewer
            data={data}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={props.trailing_comma}
            on_hovering_path={props.on_hovering_path}
            hovered_path_str={props.hovered_path_str}
            max_wildcards={props.max_wildcards}
            on_selected_path={props.on_selected_path}
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
            on_hovering_path={props.on_hovering_path}
            hovered_path_str={props.hovered_path_str}
            max_wildcards={props.max_wildcards}
            on_selected_path={props.on_selected_path}
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
    on_hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path_str: string
    max_wildcards: number | undefined
    on_selected_path: (path: JSONPath, is_leaf_value: boolean) => void
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
        props.on_hovering_path(current_path, false)
    }, [props.on_hovering_path, JSON.stringify(current_path)])

    const on_pointer_leave = useCallback((e: PointerEvent) =>
    {
        e.stopImmediatePropagation()
        set_is_hovered(false)
    }, [])

    const keys = useMemo(() => Object.keys(data), [data])

    const indent = " ".repeat(current_path.length * indent_spaces)
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
            {indent}{key_str}{is_collapsed ? ((keys.length ? "{ ... }" : "{}") + (props.trailing_comma ? "," : "")) : "{"}
        </div>
        {!is_collapsed && <>
            <div
                className="json-object-contents"
                onClick={e => e.stopPropagation()}
            >
                {keys.map((key, index) => <JSONObjectItem
                    key={key}
                    index={index}
                    keys={keys}
                    value={data[key]}
                    current_path={[...current_path, { key }]}
                    initial_collapsed_to_level={initial_collapsed_to_level}
                    on_hovering_path={props.on_hovering_path}
                    hovered_path_str={props.hovered_path_str}
                    max_wildcards={props.max_wildcards}
                    on_selected_path={props.on_selected_path}
                    selected_path_strs={props.selected_path_strs}
                />)}
            </div>
            <div
                className="json-brace"
                onClick={toggle_initial_collapsed_to_level}
                onPointerOver={on_pointer_over}
            >
                {indent}{"}" + (props.trailing_comma ? "," : "")}
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
    on_hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path_str: string
    max_wildcards: number | undefined
    on_selected_path: (path: JSONPath, is_leaf_value: boolean) => void
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
        props.on_hovering_path(current_path, false)
        // set_is_hovered(true)
    }, [props.on_hovering_path, JSON.stringify(current_path)])

    const indent = " ".repeat(current_path.length * indent_spaces)
    const path_element = current_path[current_path.length - 1]
    const key_name = path_element && "key" in path_element ? path_element.key : ""
    const key_str = key_name && `"${key_name}": `

    return <div className="json-array-viewer json-collapsible">
        <div
            className="json-bracket"
            onClick={toggle_initial_collapsed_to_level}
            onPointerOver={on_pointer_over}
        >
            {indent}{key_str}{is_collapsed ? ((data.length ? "[ ... ]" : "[]") + (props.trailing_comma ? "," : "")) : "["}
        </div>
        { !is_collapsed && <>
            <div className="json-array-contents">
                {data.map((item, index) => <JSONArrayItem
                    key={index}
                    index={index}
                    array_length={data.length}
                    item={item}
                    current_path={[...current_path, { index }]}
                    initial_collapsed_to_level={initial_collapsed_to_level}
                    on_hovering_path={props.on_hovering_path}
                    hovered_path_str={props.hovered_path_str}
                    max_wildcards={props.max_wildcards}
                    on_selected_path={props.on_selected_path}
                    selected_path_strs={props.selected_path_strs}
                />)}
            </div>
            <div className="json-bracket">
                {indent}{"]" + (props.trailing_comma ? "," : "")}
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
    on_hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path_str: string
    max_wildcards: number | undefined
    on_selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
}
function JSONObjectItem(props: JSONObjectItemProps)
{
    const { keys, value, current_path, initial_collapsed_to_level, index } = props
    const key = keys[index]!
    const indent = " ".repeat(current_path.length * indent_spaces)

    const is_collapsible = value_is_nested(value)
    const is_leaf_value = !is_collapsible

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.on_hovering_path(current_path, is_leaf_value)
    }, [props.on_hovering_path, current_path, is_leaf_value])

    const on_pointer_down = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.on_selected_path(current_path, is_leaf_value)
    }, [props.on_selected_path, current_path, is_leaf_value])

    const paths_match = useMemo(() => factory_paths_match(current_path, props.max_wildcards), [current_path, props.max_wildcards])
    const is_hovered = paths_match(props.hovered_path_str)
    const is_selected = paths_match(props.selected_path_strs)

    const is_leaf_value_class = is_leaf_value ? " is_leaf_value" : ""
    const is_hovered_class = is_hovered ? " is_hovered" : ""
    const is_selected_class = is_selected ? " is_selected" : ""

    return <div
        className={"json-object-item" + ((is_collapsible ? " " : " not-") + "json-collapsible")}
        onPointerOver={on_pointer_over}
        onPointerDown={on_pointer_down}
    >
        {!is_collapsible && <>
            {indent}<span className={"json-object-key" + is_leaf_value_class + is_hovered_class + is_selected_class}>
                "{key}"
            </span><span className={is_selected_class}>:&nbsp;</span>
        </>}
        <RecursiveJSONViewer
            data={value}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={index < keys.length - 1}
            on_hovering_path={props.on_hovering_path}
            hovered_path_str={props.hovered_path_str}
            max_wildcards={props.max_wildcards}
            on_selected_path={props.on_selected_path}
            selected_path_strs={props.selected_path_strs}

            is_selected={is_selected}
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
    on_hovering_path: (path: JSONPath, is_leaf_value: boolean) => void
    hovered_path_str: string
    max_wildcards: number | undefined
    on_selected_path: (path: JSONPath, is_leaf_value: boolean) => void
    selected_path_strs: Set<string>
}
function JSONArrayItem(props: JSONArrayItemProps)
{
    const { array_length, item, current_path, initial_collapsed_to_level, index } = props

    const is_collapsible = value_is_nested(item)
    const is_leaf_value = !is_collapsible

    const indent = " ".repeat(is_leaf_value ? (current_path.length * indent_spaces) : 0)

    const on_pointer_over = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.on_hovering_path(current_path, is_leaf_value)
    }, [props.on_hovering_path, current_path, is_leaf_value])

    const on_pointer_down = useCallback((e: PointerEvent) =>
    {
        e.stopPropagation()
        props.on_selected_path(current_path, is_leaf_value)
    }, [props.on_selected_path, current_path, is_leaf_value])

    const paths_match = useMemo(() => factory_paths_match(current_path, props.max_wildcards), [current_path, props.max_wildcards])
    const is_hovered = paths_match(props.hovered_path_str)
    const is_selected = paths_match(props.selected_path_strs)

    const is_leaf_value_class = is_leaf_value ? " is_leaf_value" : ""
    const is_hovered_class = is_hovered ? " is_hovered" : ""
    const is_selected_class = is_selected ? " is_selected" : ""

    return <div
        key={index}
        className={"json-array-item" + is_leaf_value_class + is_hovered_class + is_selected_class}
        onPointerOver={on_pointer_over}
        onPointerDown={on_pointer_down}
    >
        {indent}<RecursiveJSONViewer
            data={item}
            current_path={current_path}
            initial_collapsed_to_level={initial_collapsed_to_level}
            trailing_comma={index < (array_length - 1)}
            on_hovering_path={props.on_hovering_path}
            hovered_path_str={props.hovered_path_str}
            max_wildcards={props.max_wildcards}
            on_selected_path={props.on_selected_path}
            selected_path_strs={props.selected_path_strs}

            is_selected={is_selected}
        />
    </div>
}


function value_is_nested(value: unknown): boolean
{
    if (value === null) return false
    if (Array.isArray(value)) return true
    return typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype)
}
