import { Button, Tooltip } from "@mantine/core"
import { useEffect, useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"

import { is_data_component } from "core/data/interface"

import { ROUTES } from "../routes"
import { app_store } from "../state/store"
import { DataComponentCard } from "../ui_components/DataComponentCard"
import { NewWikiDataComponentButton } from "../ui_components/NewDataComponentButtons"
import "./HomePage.css"


export function HomePage()
{
    const store = app_store()
    const {
        data_component_ids_for_home_page,
        data_component_by_id_and_maybe_version,
    } = store.data_components


    useEffect(() =>
    {
        // Check we have fetched some data_components
        const now = new Date()
        const is_recently_fetched = data_component_ids_for_home_page &&
            (now.getTime() - data_component_ids_for_home_page.fetched.getTime()) < 1000 * 60 * 10 // 10 minutes
        if (is_recently_fetched) return
        // If not, request them
        store.data_components.request_data_components_for_home_page()
    }, [])

    const ids = data_component_ids_for_home_page?.ids
    const data_components_for_home_page = !ids ? undefined : ids.map(id =>
        data_component_by_id_and_maybe_version[id.to_str()]
    )
    .map(component => component?.component)
    .filter(is_data_component)

    const curated_ids = data_component_ids_for_home_page?.curated_ids
    const curated_data_components_for_home_page = !curated_ids ? undefined : curated_ids.map(id =>
        data_component_by_id_and_maybe_version[id.to_str()]
    )
    .map(component => component?.component)
    .filter(is_data_component)
    console.log("curated_data_components_for_home_page", curated_data_components_for_home_page?.length, curated_data_components_for_home_page)


    const notes = factory_notes()
    const maxWidth = 700

    return (
        <div className="page-container" id="home-page">
            <div style={{ maxWidth, margin: "2em auto 0 auto" }}>
                <h2 style={{ marginBottom: 0 }}>We need a national plan for our future —</h2>
                <h2 style={{ marginTop: 0 }}><i>one that actually adds up.</i></h2>
                <p style={{ maxWidth: 500 }}>
                    <i>Not wishful thinking or rhetoric but a shared model of reality
                    we can all contribute to, edit, and buy in to: so we can prosper together.</i>
                </p>
            </div>

            <div style={{ maxWidth, margin: "2em auto 0 auto" }}>
                <p>
                    With simple data and back-of-the-envelope calculations, we can
                    already understand which futures are realistic.{
                        notes(<>As many have already demonstrated<br/>
                        such as Prof. David MacKay's book<br/>
                        <a href="https://www.withouthotair.com/">Sustainable Energy Without The Hot Air</a></>
                    )} WikiSim is a
                    public space for that work — breaking information out of silos,
                    synthesising meaning across domains, and wrapping complex
                    calculations in simulations anyone can explore.
                </p>
            </div>

            <div style={{ maxWidth }} class="background-info-box">
                <div class="info-row">
                    <div class="info-cell">
                        <div class="subtitle">THE PROBLEM</div>
                        Everyone — politicians, journalists, the public — is doing
                        their best. But <b>we can't
                        hold planetary-scale or even nation-scale problems in
                        our heads</b>, because we're not using the right tools, the right mediums.
                    </div>
                    <div class="info-cell">
                        <div class="subtitle">THE OPPORTUNITY</div>
                        Wikipedia showed millions of people can together bridge the gap to complex
                        knowledge. <b>Can we do the same for a shared model
                        of where we are and where we could go?</b>
                    </div>
                </div>
                <div class="info-cell">
                    <div class="subtitle">KNOWLEDGE IS FRACTAL</div>
                    No single person holds the full picture. Every individual, every
                    community, industry, region — has expertise that belongs in the
                    plan. <b>WikiSim lets people co-locate their knowledge and lived
                    experience directly in the model</b>, at whatever level of detail
                    they understand best. The whole emerges from the parts.
                </div>
            </div>

            <p style={{ maxWidth, margin: "2em auto 0 auto", textAlign: "justify" }}>
                Too many political promises are broken, not because the problems were unsolvable,
                but because there was no realistic plan, the right people weren't in the room,
                or they weren't listened to.
            </p>

            <p style={{ maxWidth, margin: "2em auto 0 auto", textAlign: "justify" }}>
                Societies have always collapsed when they grew too complex to
                understand, too complex to discuss. We now face civilisation-scale challenges — and
                the same comprehension breakdown risk — but this time we have
                the tools to do something about it.
            </p>

            <blockquote style={{ maxWidth, margin: "2em auto 0 auto" }}>
                We need to upgrade our tools to upgrade our conversations — and
                coordinate at scale, across billions of people, over decades. A
                plan that doesn't include everyone's experience isn't a plan. It's
                a guess made by the few.
            </blockquote>

            <p id="invitation-to-contribute" style={{ maxWidth, textAlign: "justify" }}>
                <div class="subtitle">THIS IS A WIKI</div>
                If you see something you can improve, edit it. Contribute a calculation,
                build a simulation, or simply add what you know to the part of the
                model you understand best. The best plan for our future is one we
                build together.
            </p>


            {/* <p>
                WikiSim is a public space for that data and those “back of the envelope”
                calculations; a place to synthesis meaning from across domains, breaking
                data out of silos and traditional boundaries.  When
                those calculations get too complex, they can be
                wrapped in visualisations and simulations to
                enable us to make sense of them.
            </p>

            <p>
                Below you can choose a calculation to view,
                a simulation to play<sup class="coming-soon">Now live🎉</sup>,
                or contribute your own... this is a Wiki so if you see something
                you can fix, just edit it!
            </p> */}

            <p className="intro-video">
                <div>
                    <iframe
                        src="https://www.youtube.com/embed/hjS3WPBBlRA?modestbranding=1&rel=0"
                        title="A video introducing WikiSim (from MathsJam 2025)"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowFullScreen={true}
                    />
                </div>
            </p>

            <br />
            <br />

            <div class="section">
                <h2>Community favourites ⭐️</h2>
                <div class="data-component-cards">
                    {!curated_data_components_for_home_page
                        ? <p>Loading...</p>
                        : curated_data_components_for_home_page.map(data_component =>
                            <DataComponentCard key={data_component.id.to_str()} data_component={data_component} />
                        )
                    }
                </div>


                <h2>Recent Changes</h2>
                <div class="data-component-cards">
                    {!data_components_for_home_page
                        ? <p>Loading...</p>
                        : data_components_for_home_page.map(data_component =>
                            <DataComponentCard key={data_component.id.to_str()} data_component={data_component} />
                        )
                    }
                </div>


                {/* <h2>Potential ideas</h2> */}

                <Button
                    component="a"
                    href={ROUTES.DATA_COMPONENT.SEARCH()}
                    className="browse-all-button"
                    size="lg"
                    variant="primary"
                >
                    Browse all pages
                </Button>

                or

                <NewWikiDataComponentButton title="Create new page" />
            </div>
        </div>
    )
}



// interface ComponentsCarouselProps
// {
//     type: "narrative" | "interactable" | "calculation"
//         | "data_point" | "definition"
//         | "utility"
//         | "meta"
//         | "recently_updated"
//     state: "concept" | "in_development" | "beta" | "mature"
// }
// function ComponentsCarousel(props: ComponentsCarouselProps)
// {

// }


function factory_notes()
{
    let i = 0
    const nums = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"]

    return (children: JSX.Element | string) =>
    {
        const [force_open, set_force_open] = useState(false)

        return <Tooltip label={children} position="bottom" opened={force_open}>
            <span
                style={{ cursor: "pointer" }}
                onClick={() => set_force_open(force_open => !force_open)}
                onPointerOver={() => set_force_open(true)}
                onPointerOut={() => set_force_open(false)}
            >
                {nums[i++]}
            </span>
        </Tooltip>
    }
}
