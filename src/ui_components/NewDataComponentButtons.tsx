import { Button } from "@mantine/core"
import IconNewSection from "@tabler/icons-react/dist/esm/icons/IconNewSection"

import { ROUTES } from "../routes"
import "./NewDataComponentButtons.css"



export function NewDataComponentButtons(props: { button_size?: "md" })
{
    const { button_size = "lg" } = props

    return <div className="new-data-component-buttons">
        Create page in
        <Button
            component="a"
            href={ROUTES.DATA_COMPONENT.NEW()}
            className="browse-all-button"
            size={button_size}
            variant="primary"
        >
            Wiki&nbsp;<IconNewSection />
        </Button>

        <Button
            component="a"
            href={ROUTES.DATA_COMPONENT.NEW(true)}
            className="browse-all-button"
            size={button_size}
            variant="primary-user"
        >
            user space&nbsp;<IconNewSection />
        </Button>
    </div>
}
