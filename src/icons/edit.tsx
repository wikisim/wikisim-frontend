import { IconBrandMantine } from "@tabler/icons-react"
import { useState } from "preact/hooks"


interface Props
{
    colour?: string
    hovered_colour?: string
    hovered_background?: string
}

export default function EditIcon(props: Props)
{
    const [hovered, set_hovered] = useState(false)

    const {
        colour = "#555",
        hovered_colour = "#fff",
        hovered_background = "rgb(28, 126, 214)" // matches the default for Mantine Button
    } = props

    const fill_colour = hovered ? hovered_colour : colour
    const backgroundColor = hovered ? hovered_background : ""

    return <IconBrandMantine
      size={80}
      stroke={1.5}
      color="var(--mantine-color-blue-filled)"
    />

    return <div
        onMouseEnter={() => set_hovered(true)}
        onMouseLeave={() => set_hovered(false)}
        style={{
            marginTop: 10, // matches the default for Mantine Button
            cursor: "pointer",
            padding: 6,
            borderRadius: 4, // matches the default for Mantine Button
            backgroundColor,
            width: "fit-content",
            lineHeight: 0, // removes default Mantine line-height
        }}
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25z" fill={fill_colour}/>
            <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill={fill_colour}/>
        </svg>
    </div>
}
