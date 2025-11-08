import { useLocation } from "preact-iso"
import { useEffect } from "preact/hooks"

import { DataComponent } from "core/data/interface"

import { ROUTES } from "../../routes"
import { app_store } from "../../state/store"
import { get_async_user } from "../../state/users/accessor"
import { AsyncUser } from "../../state/users/interface"
import Loading from "../Loading"


/**
 * Check that if this component has an owner_id, that some kind of user_name
 * was provided in the props, if not, then redirect the page from this wiki
 * page to the user spaces page
 */
// export function ensure_owner_id_or_name_is_in_url(component_id: string, component: DataComponent, user_id_or_name: string | undefined)
// {
//     const location = useLocation()

//     useEffect(() =>
//     {
//         if (component.owner_id && user_id_or_name === undefined)
//         {
//             // const new_user_space_route = ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT({
//             //     user_id_or_name: component.owner_id,
//             //     id: component_id,
//             // })
//             // location.route(new_user_space_route, true)
//         }
//     }, [component_id, component.owner_id, user_id_or_name])
// }


export function ensure_owner_is_loaded(state: ReturnType<typeof app_store>, component: DataComponent)
{
    const async_user = component.owner_id !== undefined ? get_async_user(state, component.owner_id) : undefined

    let loading_user_jsx = null
    if (async_user && async_user.status === "loading")
    {
        loading_user_jsx = <div>Loading user<Loading /></div>
    }

    return { async_user, loading_user_jsx }
}


/**
 * Check that if this component has an owner_id, that the user_id_or_name
 * provided in the props matches the name of the user given by the owner_id
 * of the component, if not, then redirect the page from this page to the
 * user spaces page give by that name
 */
export function ensure_owner_name_matches_in_url(component_id: string, component: DataComponent, async_user: AsyncUser | undefined, user_id_or_name: string | undefined)
{
    const location = useLocation()

    useEffect(() =>
    {
        if (component.owner_id && async_user?.status === "loaded")
        {
            const user_name = async_user.user!.name
            if (user_id_or_name !== user_name)
            {
                const new_user_space_route = ROUTES.DATA_COMPONENT.VIEW_USER_COMPONENT({
                    user_id_or_name: user_name,
                    id: component_id,
                })
                location.route(new_user_space_route, true)
            }
        }
    }, [component_id, component.owner_id, async_user, user_id_or_name])
}
