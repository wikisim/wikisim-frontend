import pub_sub from "."


function add_key_up_key_down_listener()
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

add_key_up_key_down_listener()



//++++++++++++++++++++++++++++++ Key Pressed State +++++++++++++++++++++++++++++
// This should probably live in a different file / directory as it's about
// turning the key events into state.
interface KeyStates
{
    metaKey: boolean
    ctrlKey: boolean
    shiftKey: boolean
    altKey: boolean
}
export type CurrentlyPressedKeys = Record<string, boolean> & KeyStates
const currently_pressed_keys: Record<string, boolean> & KeyStates = {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
}

pub_sub.sub("key_down", (event) =>
{
    currently_pressed_keys[event.code] = true
    currently_pressed_keys.metaKey = event.metaKey
    currently_pressed_keys.ctrlKey = event.ctrlKey
    currently_pressed_keys.shiftKey = event.shiftKey
    currently_pressed_keys.altKey = event.altKey
})

pub_sub.sub("key_up", (event) =>
{
    currently_pressed_keys[event.code] = false
    currently_pressed_keys.metaKey = event.metaKey
    currently_pressed_keys.ctrlKey = event.ctrlKey
    currently_pressed_keys.shiftKey = event.shiftKey
    currently_pressed_keys.altKey = event.altKey
})


export function get_currently_pressed_keys(): CurrentlyPressedKeys
{
    return currently_pressed_keys
}
