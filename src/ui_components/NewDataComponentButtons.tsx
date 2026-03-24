import { Button } from "@mantine/core"
import IconNewSection from "@tabler/icons-react/dist/esm/icons/IconNewSection"

import { NewDataComponentArgs, ROUTES } from "../routes"
import "./NewDataComponentButtons.css"



export function NewDataComponentButtons(props: { button_size?: "sm" | "md" | "lg" } )
{
    const { button_size = "lg" } = props

    return <div className="new-data-component-buttons">
        Create page in
        <NewWikiDataComponentButton button_size={button_size} />

        <Button
            component="a"
            href={ROUTES.DATA_COMPONENT.NEW({ is_user_component: true })}
            className="browse-all-button"
            size={button_size}
            variant="primary-user"
        >
            user space&nbsp;<IconNewSection />
        </Button>
    </div>
}


interface NewWikiDataComponentButtonProps
{
    button_size?: "sm" | "md" | "lg"
    title?: string
    disabled?: boolean
    args?: NewDataComponentArgs
}
export function NewWikiDataComponentButton(props: NewWikiDataComponentButtonProps)
{
    const { button_size = "lg", title = "Wiki" } = props

    return <Button
        component="a"
        href={ROUTES.DATA_COMPONENT.NEW(props.args)}
        className="browse-all-button"
        size={button_size}
        variant="primary"
        disabled={props.disabled}
    >
        {title}&nbsp;<IconNewSection />
    </Button>
}
