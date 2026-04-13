import { DataComponent } from "core/data/interface"

import { ROUTES } from "../routes"


export function Link(props: { component: Pick<DataComponent, "id" | "plain_title" | "owner_id">, use_version?: boolean } )
{
    const { component } = props
    const { plain_title, owner_id } = component

    const id = props.use_version ? component.id : component.id.as_IdOnly()

    return <a href={ROUTES.DATA_COMPONENT.VIEW({ id, owner_id })}>
        {plain_title || ROUTES.DATA_COMPONENT.VIEW({ id, owner_id })}
    </a>
}
