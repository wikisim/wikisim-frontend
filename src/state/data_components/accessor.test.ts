import { expect } from "chai"
import sinon from "sinon"

import { IdAndVersion, IdOnly } from "core/data/id"
import { create_mocked_supabase } from "core/test/mock_supabase_and_session"

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

    it("should call request_data_component", () =>
    {
        const result = get_async_data_component(state, "-123")
        expect(result.status).to.equal("loading")
        expect(stubbed_request_data_component.args).deep.equals([
            [new IdOnly(-123), undefined],
        ], "request_data_component should be called with the correct ID and force_refresh set to undefined")
    })

    it("should call request_data_component with IdAndVersion", () =>
    {
        const result = get_async_data_component(state, "-123v2")
        expect(result.status).to.equal("loading")
        expect(stubbed_request_data_component.args).deep.equals([
            [new IdAndVersion(-123, 2), undefined],
        ], "request_data_component should be called with the correct IdAndVersion and force_refresh set to undefined")
    })

    it("should call request_data_component and provide force_refresh", () =>
    {
        const force_refresh = true
        get_async_data_component(state, "-123", force_refresh)
        expect(stubbed_request_data_component.args).deep.equals([
            [new IdOnly(-123), true],
        ], "request_data_component should be called and force_refresh is true")
    })
})
