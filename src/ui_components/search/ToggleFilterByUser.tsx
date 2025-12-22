import { useCallback } from "preact/hooks"

import { app_store } from "../../state/store"
import Loading from "../Loading"
import { ToggleTwo } from "../ToggleTwo"


interface ToggleFilterByUserProps
{
    filter_by_user_id: string | undefined
    set_filter_by_user_id: (user_id: string) => void
}
export function ToggleFilterByUser(props: ToggleFilterByUserProps)
{
    const { filter_by_user_id, set_filter_by_user_id } = props

    const state = app_store()
    const user_signed_in = state.user_auth_session.session?.user

    const toggle_filter_by_user_id = useCallback(() =>
    {
        if (filter_by_user_id) set_filter_by_user_id("")
        else if (user_signed_in?.id) set_filter_by_user_id(user_signed_in.id)
    }, [filter_by_user_id, set_filter_by_user_id, user_signed_in])


    const other_user_id = filter_by_user_id && user_signed_in?.id !== filter_by_user_id ? filter_by_user_id : undefined
    const async_other_user = other_user_id ? state.users.request_user(other_user_id) : undefined

    const filter_by_user_message = filter_by_user_id
        ? (user_signed_in?.id === filter_by_user_id
            ? "Only your pages"
            : <>Only pages of {async_other_user?.user?.name || <Loading/>}</>)
        : "All pages (Wiki, yours and others)"

    // {user_signed_in && <ToggleTwo
    //     active={!!user_signed_in.id && show_only_user_pages}
    //     label={active => active ? "Only your pages" : `All pages (Wiki, yours, and others)`}
    //     set_active={active => set_show_only_user_pages(active)}
    // />}


    return <ToggleTwo
        active={!!filter_by_user_id}
        disabled={!user_signed_in && !filter_by_user_id}
        label={() => filter_by_user_message}
        set_active={toggle_filter_by_user_id}
    />
}


interface ToggleFilterByOurUserProps
{
    show_only_user_pages: boolean
    set_show_only_user_pages: (show_only: boolean) => void
}
export function ToggleFilterByOurUser(props: ToggleFilterByOurUserProps)
{
    const state = app_store()
    const user_signed_in = state.user_auth_session.session?.user

    if (!user_signed_in) return null

    return <ToggleTwo
        active={!!user_signed_in.id && props.show_only_user_pages}
        label={active => active ? "Only your pages" : `All pages (Wiki, yours, and others)`}
        set_active={active => props.set_show_only_user_pages(active)}
    />
}
