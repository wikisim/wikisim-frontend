import { expect } from "chai"

import { app_store, get_new_app_store } from "../store"


describe("data_components initial_state", () =>
{
    it("should initialize with empty data_components_by_id and data_component_by_id_and_version", () =>
    {
        const state = app_store.getState()
        expect(state.data_components.data_components_by_id).to.deep.equal({})
        expect(state.data_components.data_component_by_id_and_version).to.deep.equal({})
    })

    it("should update data_components_by_id and not data_component_by_id_and_version when request_data_component is called with id but no version", () =>
    {
        const store = get_new_app_store()
        let state = store.getState()
        const async_data_component = state.data_components.request_data_component("123")
        expect(async_data_component).to.deep.equal({
            id: 123,
            version: null,
            component: null,
            status: "requested",
        })

        state = store.getState()
        expect(state.data_components.data_components_by_id).to.deep.equal({ "123": [async_data_component] })
        expect(state.data_components.data_component_by_id_and_version).to.deep.equal({})
    })

    it("should update data_components_by_id and data_component_by_id_and_version when request_data_component is called with id and version", () =>
    {
        const store = get_new_app_store()
        let state = store.getState()
        const async_data_component = state.data_components.request_data_component("123v2")
        expect(async_data_component).to.deep.equal({
            id: 123,
            version: 2,
            component: null,
            status: "requested",
        })

        state = store.getState()
        expect(state.data_components.data_components_by_id).to.deep.equal({ "123": [async_data_component] })
        expect(state.data_components.data_component_by_id_and_version).to.deep.equal({ "123v2": async_data_component })
    })
})
