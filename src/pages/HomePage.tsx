
import { useEffect } from "preact/hooks"

import { is_data_component } from "core/data/interface"

import { app_store } from "../state/store"
import { DataComponentCard } from "../ui_components/DataComponentCard"
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
        store.data_components.request_data_components()
    }, [])


    const data_components_for_home_page = data_component_ids_for_home_page?.ids?.map(id =>
        data_component_by_id_and_maybe_version[id.to_str()]
    ).map(component => component?.component)
    .filter(d => is_data_component(d))


    return (
        <div>
            <h1>WikiSim</h1>
            <h3>
                Community made open source simulations, and “back of the envelope”
                calculations, to help us to make better sense of our complex world.
            </h3>

            <p>
                Below you can choose a calculation to view,
                a <s>simulation to play</s><sup class="coming-soon">COMING SOON</sup>,
                or contribute your own... this is a Wiki so if you see something
                you can fix, just click "edit"!
            </p>

            <div class="section">
                <h2>Data Components</h2>
                {!data_components_for_home_page
                    ? <p>Loading...</p>
                    : data_components_for_home_page.map(data_component =>
                        <DataComponentCard key={data_component.id.to_str()} data_component={data_component} />
                    )
                }
            </div>
        </div>
    )
}
