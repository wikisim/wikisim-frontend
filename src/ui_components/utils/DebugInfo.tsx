import GUI from "lil-gui"
import { useEffect, useRef, useState } from "preact/hooks"

import pub_sub from "../../pub_sub"



export function DebugInfo()
{
    const [_, set_debug_state] = useState<{ [key: string]: unknown }>({})
    const gui_ref = useRef<GUI | null>(null)
    const history_ref = useRef<{ [key: string]: number[] }>({})
    const gui_update_folder_ref = useRef<{ [key: string]: () => void }>({})
    const max_history = 100 // Keep last 100 values

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

            // If value is a number, track it for graphing
            if (typeof data.value !== "number" || !gui_ref.current) return updated

            const history = history_ref.current[data.label] || []
            if (!history_ref.current[data.label])
            {
                // Add controller for this value
                const folder = gui_ref.current.addFolder(data.label)
                const value_controller = folder.add({ value: data.value }, "value").listen().disable()

                // Create a simple text-based sparkline in the GUI
                const graph_obj = { graph: "" }
                const graph_controller = folder.add(graph_obj, "graph").listen().disable()

                // Save update_folder function for later use
                gui_update_folder_ref.current[data.label] = () =>
                {
                    const values = history_ref.current[data.label] || []

                    // Update folder with last value info
                    const last_value = values.last() || 0
                    value_controller.setValue(last_value)

                    // Update graph
                    const min = Math.min(...values)
                    const max = Math.max(...values)
                    const range = max - min || 1

                    // Create simple bar chart using Unicode blocks
                    const bars = "▁▂▃▄▅▆▇█"
                    graph_obj.graph = values.map(v => {
                        const normalized = (v - min) / range
                        const index = Math.floor(normalized * (bars.length - 1))
                        return bars[index]
                    }).join("")

                    graph_controller.updateDisplay()
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
