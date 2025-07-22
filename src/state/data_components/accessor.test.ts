import { expect } from "chai"
import sinon from "sinon"

import { create_mocked_supabase } from "core/test/mock_supabase_and_session"

import { update_store_with_loaded_data_components } from "."
import { IdAndVersion, IdOnly } from "../../../lib/core/src/data/id"
import { new_data_component } from "../../../lib/core/src/data/modify"
import { RootAppState } from "../interface"
import { AppStore, get_new_app_store } from "../store"
import { get_async_data_component } from "./accessor"


describe("get_async_data_component", () =>
{
    let store: AppStore
    let state: RootAppState
    let stubbed_request_data_component: sinon.SinonStub

    beforeEach(() =>
    {
        sinon.restore() // Reset all stubs and spies before each test

        // Reset the store before each test
        const { get_supabase } = create_mocked_supabase()
        store = get_new_app_store({ get_supabase })
        state = store.getState()

        stubbed_request_data_component = sinon.stub(state.data_components, "request_data_component").returns({
            id: new IdOnly(-123),
            status: "loading",
            component: null,
        })
    })

    it("should call request_data_component if the data component is not found", () =>
    {
        const result = get_async_data_component(state, "-123")
        expect(result.status).to.equal("loading")
        expect(stubbed_request_data_component.args).deep.equals([
            [new IdOnly(-123), undefined],
        ], "request_data_component should be called with the correct ID and force_refresh set to false")
    })

    it("should return the data component if it is already loaded", () =>
    {
        const data_component_1 = new_data_component({ id: new IdAndVersion(-123, 1) })
        store.setState(state => update_store_with_loaded_data_components([data_component_1], state))

        const result = get_async_data_component(store.getState(), "-123")
        expect(result.status).equals("loaded")
        expect(result.component).deep.equals(data_component_1, "Should return the loaded data component")

        expect(stubbed_request_data_component.args).deep.equals([], "request_data_component should not be called when the data component is already loaded and not force refreshing")
    })

    it("should request the data component again if it is already loaded but force_refresh is true", () =>
    {
        const data_component_1 = new_data_component({ id: new IdAndVersion(-123, 1) })
        store.setState(state => update_store_with_loaded_data_components([data_component_1], state))

        const force_refresh = true
        get_async_data_component(store.getState(), "-123", force_refresh)
        expect(stubbed_request_data_component.args).deep.equals([
            [new IdOnly(-123), true],
        ], "request_data_component should be called when the data component is already loaded and force_refresh is true")
    })
})
