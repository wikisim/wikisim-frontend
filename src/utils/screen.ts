
export interface ScreenCharacteristics
{
    width: number
    height: number
    orientation_angle: number
    orientation: "portrait" | "landscape"
}


export function get_screen_characteristics(): ScreenCharacteristics
{
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation_angle: window.screen.orientation.angle,
        orientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
    }
}
