import { Button } from "@mantine/core"
import IconNewSection from "@tabler/icons-react/dist/esm/icons/IconNewSection"

import { ROUTES } from "../routes"
import "./NewDataComponentButtons.css"



export function NewDataComponentButtons()
{
    return <div className="new-data-component-buttons">
        Create page in
        <Button
            component="a"
            href={ROUTES.DATA_COMPONENT.NEW()}
            className="browse-all-button"
            size="lg"
            variant="primary"
        >
            Wiki&nbsp;<IconNewSection />
        </Button>

        <Button
            component="a"
            href={ROUTES.DATA_COMPONENT.NEW(true)}
            className="browse-all-button"
            size="lg"
            variant="primary-user"
        >
            user space&nbsp;<IconNewSection />
        </Button>
    </div>
}
