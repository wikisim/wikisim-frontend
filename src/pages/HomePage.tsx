import { Button } from "@mantine/core"
import { useEffect } from "preact/hooks"

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
    .filter(d => is_data_component(d))


    return (
        <div className="page-container" id="home-page">
            <h3>
                Community made open source simulations, and “back of the envelope”
                calculations, to help us to make better sense of our complex world.
            </h3>

            <p>
                Below you can choose a calculation to view,
                a simulation to play<sup class="coming-soon">Now live🎉</sup>,
                or contribute your own... this is a Wiki so if you see something
                you can fix, just edit it!
            </p>

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
                {/* <h2>Community favourites ⭐️</h2>
                <div class="data-component-cards">
                    {!data_components_for_home_page
                        ? <p>Loading...</p>
                        : data_components_for_home_page.map(data_component =>
                            <DataComponentCard key={data_component.id.to_str()} data_component={data_component} />
                        )
                    }
                </div>*/}


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
