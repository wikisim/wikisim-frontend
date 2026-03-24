import { IconAlternative } from "../../assets/icons"
import { app_store } from "../../state/store"
import { Link } from "../Link"

import "./AccordingTo.css"


export function AccordingTo(props: { component: { according_to_id?: number } })
{
    const according_to_id = props.component.according_to_id
    if (!according_to_id) return null

    const state = app_store()
    const async_according_to_component = state.data_components.data_component_by_id_and_maybe_version[according_to_id]
    const according_to_component = async_according_to_component?.component
    if (!according_to_component) return <div>Not found: component of id {according_to_id}</div>

    return <div className="according-to-info">
        <IconAlternative size={15} />
        According to{" "}
        <Link component={according_to_component} />
    </div>
}
