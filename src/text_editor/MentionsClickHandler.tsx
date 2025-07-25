import { useLocation } from "preact-iso"
import { useEffect } from "preact/hooks"

import { parse_id } from "core/data/id"

import pub_sub from "../pub_sub"
import { ROUTES } from "../routes"


// This component listens for mention clicks and redirects the user to the
// corresponding page of that data component.
export function MentionsClickHandler()
{
    const location = useLocation()

    useEffect(() => pub_sub.sub("mention_clicked", data =>
    {
        if (!data.data_component_id) return

        const id = parse_id(data.data_component_id, false)
        location.route(ROUTES.DATA_COMPONENT.VIEW(id))
    }), [])

    return null
}
