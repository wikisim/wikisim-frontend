import { valid_value_type } from "core/data/field_values_with_defaults"
import {
    DataComponent,
    NewDataComponent,
    VALUE_TYPES,
    ValueType,
} from "core/data/interface"

import { Select } from "@mantine/core"
import { to_sentence_case } from "../../utils/to_sentence_case"



export function ValueTypeDropdown(props: {
    draft_component: DataComponent | NewDataComponent
    on_change: (dc: Partial<DataComponent>) => void
})
{
    return <Select
        label="Type"
        data={value_type_options()}
        size="md"
        style={{ width: 200 }}
        value={valid_value_type(props.draft_component.value_type)}
        onChange={value =>
        {
            props.on_change({ value_type: value as ValueType })
        }}
    />
}


function value_type_options()
{
    return VALUE_TYPES
    // For now, only allow number and function types
    .filter(type => type === "number" || type === "function" || type === "interactable")
    .map(type =>
    {
        return ({ value: type, label: to_sentence_case(type) })
    })
}
