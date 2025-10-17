import GUI from "lil-gui"
import { useEffect, useRef, useState } from "preact/hooks"
import Sparkline from "sparklines"

import pub_sub from "../../pub_sub"


export function L<T>(value: T, label: string): T
{
    pub_sub.pub("log_debug", { label, value })
    return value
}


const max_history = 100 // Keep last 100 values
const canvas_height = 20

export function DebugInfo()
{
    const [_, set_debug_state] = useState<{ [key: string]: unknown }>({})
    const gui_ref = useRef<GUI | null>(null)
    const history_ref = useRef<{ [key: string]: unknown[] }>({})
    const gui_update_folder_ref = useRef<{ [key: string]: () => void }>({})

    useEffect(() => {
        // Create GUI
        const gui = new GUI()
        gui.title("Debug Info")
        gui_ref.current = gui

        return () => {
            gui.destroy()
        }
    }, [])


    useEffect(() => pub_sub.sub("log_debug", (data: { label: string, value: unknown }) =>
    {
        set_debug_state((prev) => {
            const updated = { ...prev, [data.label]: data.value }

            if (!gui_ref.current) return updated

            const history = history_ref.current[data.label] || []
            if (!history_ref.current[data.label])
            {
                // Add controller for this value
                const folder = gui_ref.current.addFolder(data.label)
                const value_controller = folder.add({ value: data.value }, "value").listen().disable()

                if (typeof data.value === "number")
                {
                    // Create a sparkline graph.  Get an element from lil-gui to
                    // attach the sparkline to
                    const graph_obj = { graph: "" }
                    const graph_controller = folder.add(graph_obj, "graph").listen(false).disable()
                    const sparkline = new Sparkline(graph_controller.$widget, { width: max_history, height: canvas_height, lineColor: "#0074d9" })

                    // Save update_folder function for later use
                    gui_update_folder_ref.current[data.label] = () =>
                    {
                        const values = (history_ref.current[data.label] || []) as number[]

                        // Update folder with last value info
                        const last_value = values.last() || 0
                        value_controller.setValue(last_value)

                        // Update graph
                        const min = Math.min(...values)
                        const max = Math.max(...values)
                        const range = max - min || 1
                        const normalized_values = values.map(v => (v - min) / range)

                        // Generate sparkline PNG
                        sparkline.draw(normalized_values)
                    }
                }
                else
                {
                    // For non-numeric values, just update the value display
                    gui_update_folder_ref.current[data.label] = () =>
                    {
                        const values = history_ref.current[data.label] || []
                        const last_value = values.last()
                        value_controller.setValue(last_value)
                    }
                }
            }

            // Add value to history
            history_ref.current[data.label] = history
            history.push(data.value)
            if (history.length > max_history) history.shift()

            // Update the value and graph display every time new data arrives
            gui_update_folder_ref.current[data.label]?.()

            return updated
        })
    }), [])

    return null
}
