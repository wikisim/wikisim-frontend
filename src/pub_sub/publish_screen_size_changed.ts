import pub_sub from "."
import { get_screen_characteristics } from "../utils/screen"


function add_screen_resize_listener()
{
    // Prevent adding the listener multiple times in development with hot module
    // replacement, which would cause multiple listeners to be added.
    // @ts-ignore
    if (window.__screen_resize_listener_added) return
    // @ts-ignore
    window.__screen_resize_listener_added = true

    window.addEventListener("resize", () =>
    {
        pub_sub.pub("screen_size_changed", get_screen_characteristics())
    })
}


function add_screen_orientation_change_listener()
{
    // Prevent adding the listener multiple times in development with hot module
    // replacement, which would cause multiple listeners to be added.
    // @ts-ignore
    if (window.__screen_orientation_change_listener_added) return
    // @ts-ignore
    window.__screen_orientation_change_listener_added = true

    const callback = () => pub_sub.pub("screen_size_changed", get_screen_characteristics())

    window.addEventListener("orientationchange", callback)
    // window.screen.orientation.addEventListener("change", callback)
}


add_screen_resize_listener()
add_screen_orientation_change_listener()
