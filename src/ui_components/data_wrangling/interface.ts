
export type JSONPath = ({ key: string } | { index: number | "*" })[]

export interface HoveringJSONPath
{
    path: JSONPath
    is_leaf_value: boolean
}

export type MapSelectedPathToName = { [path_str: string]: string }
