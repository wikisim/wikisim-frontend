import IconBrandBluesky from "@tabler/icons-react/dist/esm/icons/IconBrandBluesky"
import IconBrandGithub from "@tabler/icons-react/dist/esm/icons/IconBrandGithub"
import { VNode } from "preact"
import { useEffect, useState } from "preact/hooks"

import pub_sub from "../pub_sub"
import "./Footer.css"

export function Footer()
{
    const [jsx, set_jsx] = useState<VNode<unknown> | null>(null)

    useEffect(() => pub_sub.sub("set_page_footer", (data) =>
    {
        set_jsx(data.jsx)
    }), [])

    return (
        <footer id="app-footer">
            {jsx}
            <div />
            <div className="footer-links">
                <a href="https://bsky.app/profile/wikisim.org" target="_blank" rel="noopener noreferrer">
                    <IconBrandBluesky size={18} />
                    BlueSky
                </a>
                <a href="https://github.com/wikisim/wikisim-frontend" target="_blank" rel="noopener noreferrer">
                    <IconBrandGithub size={18} />
                    GitHub
                </a>
            </div>
        </footer>
    );
}
