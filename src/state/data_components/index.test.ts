import { expect } from "chai"

import { create_mocked_supabase } from "core/test/mock_session"
import { AppStore, get_new_app_store } from "../store"


describe("store.data_components", () =>
{
    let store: AppStore

    beforeEach(() =>
    {
        const { get_supabase } = create_mocked_supabase()
        store = get_new_app_store({ get_supabase })
    })

    it("should initialize with empty data_components_by_id and data_component_by_id_and_version", () =>
    {
        const { data_components } = store.getState()
        expect(data_components.data_component_ids_to_load).to.deep.equal([])
        expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({})
    })


    describe("request_data_component is called with only id (no version)", () =>
    {
        it("should handle request", () =>
        {
            const { data_components } = store.getState()
            expect(data_components.data_component_ids_to_load).to.deep.equal([])
            expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({})

            const async_data_component = data_components.request_data_component("123")
            expect(async_data_component).to.deep.equal({
                id: {
                    id: 123,
                    version: null,
                },
                component: null,
                status: "requested",
            })

            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_ids_to_load).to.deep.equal([async_data_component.id])
            expect(data_components2.data_component_by_id_and_maybe_version).to.deep.equal({
                "123": async_data_component,
            }, "data_component_by_id_and_version should have a placeholder added")
        })

        // TODO test that when a data component is requested by an id, that its
        // AsyncDataComponent placeholder status is to "loading"

        // TODO test that when the data component requested by an id is loaded
        // successfully, that its status is to updated to "loaded"

        // TODO test that when a data component requested by an id but supabase
        // call runs into an error, that the status is updated to "error".

        // TODO test that when a data component that was requested by an id but
        // supabase call ran into an error, that the user can trigger the
        // request again and the status is changed from "error" to "requested".

        // TODO test if the data component requested by an id is not found in
        // supabase, that the placeholder is updated with status "not_found"

        // TODO test if the data component requested by an id is not found in
        // supabase, that the user can trigger another request to find it and
        // that its placeholder status is changed from "not_found" to "requested".
    })


    // describe("request_data_component is called with id and version", () =>
    // {
    //     it("should handle request", () =>
    //     {
    //         let { data_components } = store.getState()
    //         const async_data_component = data_components.request_data_component("123v2")
    //         expect(async_data_component).to.deep.equal({
    //             id: {
    //                 id: 123,
    //                 version: 2,
    //             },
    //             component: null,
    //             status: "requested",
    //         })

    //         ;({ data_components } = store.getState())
    //         expect(data_components.data_component_ids_to_load).to.deep.equal([async_data_component.id])
    //         expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({ "123v2": async_data_component })
    //     })
    // })
})
