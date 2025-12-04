
import { MapSelectedPathToName, Scenario, ScenarioGraph } from "core/data/interface"

import { ColumnData } from "./extract_selected_data"
import { GraphViewer } from "./GraphViewer"


interface GraphsViewerProps
{
    data_columns: ColumnData[]
    selected_path_names: MapSelectedPathToName
    graphs: ScenarioGraph[] | undefined
    on_upsert_scenario: (updated_scenario: Partial<Scenario>) => void
    editing: boolean
}
export function GraphsViewer(props: GraphsViewerProps)
{
    const { data_columns: extracted_data, graphs } = props

    if (!graphs || graphs.length === 0) return <GraphViewer
        data_columns={extracted_data}
        selected_path_names={props.selected_path_names}
        graph={undefined}
        on_upsert_scenario={props.on_upsert_scenario}
        editing={props.editing}
    />

    return <div>
        {graphs.map((graph, index) => (
            <GraphViewer
                key={index}
                data_columns={extracted_data}
                selected_path_names={props.selected_path_names}
                graph={graph}
                on_upsert_scenario={props.on_upsert_scenario}
                editing={props.editing}
            />
        ))}
    </div>
}
