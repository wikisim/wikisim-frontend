import { DataComponent } from "../../lib/core/src/data/interface"
import { ROUTES } from "../routes"


export function Link(props: { component: DataComponent })
{
    const { component } = props

    return <a href={ROUTES.DATA_COMPONENT.VIEW(component)}>
        {component.plain_title || ROUTES.DATA_COMPONENT.VIEW(component)}
    </a>
}
