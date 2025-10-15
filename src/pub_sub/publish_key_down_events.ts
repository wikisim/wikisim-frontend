import pub_sub from "."

function add_key_down_listener()
{
    // Prevent adding the listener multiple times in development with hot module
    // replacement, which would cause multiple listeners to be added.
    // @ts-ignore
    if (window.__key_down_listener_added) return
    // @ts-ignore
    window.__key_down_listener_added = true

    window.document.addEventListener("keydown", (event) =>
    {
        pub_sub.pub("key_down", {
            key: event.key,
            code: event.code,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            timestamp: Date.now(),
            event,
        })
    })

    window.document.addEventListener("keyup", (event) =>
    {
        pub_sub.pub("key_up", {
            key: event.key,
            code: event.code,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            timestamp: Date.now(),
            event,
        })
    })
}

add_key_down_listener()
