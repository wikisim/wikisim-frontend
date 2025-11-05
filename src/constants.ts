

export const colour_actual = "rgb(28, 126, 214)" // --requires-manual-sync-colour-primary-blue-rgb
export const colour_expected = "rgb(255, 192, 120)" // --requires-manual-sync-colour-warning
export const colour_mismatch = "rgb(250, 82, 82)" // --requires-manual-sync-colour-error
export const colour_mismatch_line = "rgb(255, 168, 168)" // --requires-manual-sync-colour-invalid


const colours = [
    to_rgba(colour_actual),
    to_rgba(colour_expected),
    "rgba(47, 158, 68, 1)",    // success green (#2f9e44)
    to_rgba(colour_mismatch),
    "rgba(102, 51, 153, 1)",   // purple (#663399)
    "rgba(255, 102, 0, 1)",    // bright orange (#ff6600)
    "rgba(0, 123, 167, 1)",    // teal (#007ba7)
    "rgba(153, 0, 76, 1)",     // dark pink (#99004c)
]
export function get_line_graph_colour(index: number, opacity: number = 1): string
{
    const colour = colours[index % colours.length]!
    if (opacity === 1) return colour

    // Convert "rgba(r, g, b, 1)" to "rgba(r, g, b, opacity)"
    return colour.replace("1)", `${opacity})`)
}

function to_rgba(rgb: string): string
{
    // Convert "rgb(r, g, b)" to "rgba(r, g, b, 1)"
    return rgb.replace("rgb", "rgba").replace(")", ", 1)")
}
