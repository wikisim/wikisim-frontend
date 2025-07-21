import { expect } from "chai"
import sinon from "sinon"

import { convert_from_db_row } from "core/data/convert_between_db"
import { IdAndVersion, IdOnly } from "core/data/id"
import { new_data_component } from "core/data/modify"
import { DBDataComponentRow } from "core/supabase"
import { create_mock_db_data_component_row } from "core/test/mock_db_data_component_row"
import { create_mocked_supabase, MockedSupabase } from "core/test/mock_supabase_and_session"
import { deep_equals } from "core/utils/deep_equals"

import { update_store_with_loaded_data_components } from "."
import { wait_for } from "../../utils/wait_for"
import { AppStore, get_new_app_store } from "../store"


describe("update_store_with_loaded_data_components", () =>
{
    function setup_test_1()
    {
        const { get_supabase } = create_mocked_supabase()
        const store = get_new_app_store({ get_supabase })
        const { data_components } = store.getState()

        const data_component_1 = new_data_component({ id: new IdAndVersion(1, 1) })
        const data_component_2 = new_data_component({ id: new IdAndVersion(2, 1) })

        expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({}, "Initial state should have no data components loaded")

        store.setState(state => update_store_with_loaded_data_components([data_component_1, data_component_2], state))

        return { store, data_component_1, data_component_2 }
    }

    it("should update the store with the loaded data components", () =>
    {
        const { store, data_component_1, data_component_2 } = setup_test_1()

        const { data_components: updated_data_components } = store.getState()
        expect(updated_data_components.data_component_by_id_and_maybe_version["1"]!.component).to.deep.equal(data_component_1)
        expect(updated_data_components.data_component_by_id_and_maybe_version["1v1"]!.component).to.deep.equal(data_component_1)
        expect(updated_data_components.data_component_by_id_and_maybe_version["2"]!.component).to.deep.equal(data_component_2)
        expect(updated_data_components.data_component_by_id_and_maybe_version["2v1"]!.component).to.deep.equal(data_component_2)
    })

    it("should modify id with newer version", () =>
    {
        const { store, data_component_2: data_component_2v1 } = setup_test_1()
        const data_component_2v2 = new_data_component({ id: new IdAndVersion(2, 2) })

        store.setState(state => update_store_with_loaded_data_components([data_component_2v2], state))

        const { data_components: updated_data_components } = store.getState()
        expect(updated_data_components.data_component_by_id_and_maybe_version["2"]!.component).to.deep.equal(data_component_2v2)
        expect(updated_data_components.data_component_by_id_and_maybe_version["2v1"]!.component).to.deep.equal(data_component_2v1)
        expect(updated_data_components.data_component_by_id_and_maybe_version["2v2"]!.component).to.deep.equal(data_component_2v2)
    })
})


describe("store.data_components", () =>
{
    let mocked_supabase: MockedSupabase
    let mock_db_data_component_row: DBDataComponentRow
    let store: AppStore

    function set_up_store(responses?: {error?: Error, data?: DBDataComponentRow[]}[])
    {
        const mocks = create_mocked_supabase()
        mocked_supabase = mocks.mocked_supabase

        mock_db_data_component_row = { ...create_mock_db_data_component_row(), id: -123, version_number: 2 }
        const range_stub = sinon.stub().callsFake(async () => {
            const response = responses?.shift()
            await wait_for(0) // Ensures async resolution
            if (response?.error)
            {
                return {
                    data: null,
                    error: response.error,
                }
            }

            return {
                data: response?.data || [mock_db_data_component_row],
                error: null,
            }
        })
        mocked_supabase.range = range_stub

        store = get_new_app_store({ get_supabase: mocks.get_supabase })
    }

    beforeEach(() => set_up_store())


    it("should initialize with empty data_components_by_id and data_component_by_id_and_version", () =>
    {
        const { data_components } = store.getState()
        expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({})
    })


    describe("request_data_component", () =>
    {
        it("should handle request when called with id only", () =>
        {
            const { data_components } = store.getState()
            expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({})

            const async_data_component = data_components.request_data_component(new IdOnly(123))
            expect(async_data_component).to.deep.equal({
                id: { id: 123 },
                component: null,
                status: "loading",
            })

            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_by_id_and_maybe_version).to.deep.equal({
                "123": async_data_component,
            }, "data_component_by_id_and_version should have a placeholder added")
        })


        it("should handle request when called with id and version", () =>
        {
            const { data_components } = store.getState()
            expect(data_components.data_component_by_id_and_maybe_version).to.deep.equal({})

            const async_data_component = data_components.request_data_component(new IdAndVersion(123, 2))
            expect(async_data_component).to.deep.equal({
                id: { id: 123, version: 2 },
                component: null,
                status: "loading",
            })

            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_by_id_and_maybe_version).to.deep.equal({
                "123v2": async_data_component,
            }, "data_component_by_id_and_version should have a placeholder added")
        })


        // Test that when a data component is requested by an id, that its
        // AsyncDataComponent placeholder status is set to "loading"
        it("should set status to 'loading' when a data component is requested, supabase was called and data was loaded", async () =>
        {
            const { data_components } = store.getState()
            data_components.request_data_component(new IdOnly(-123))

            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_by_id_and_maybe_version["-123"]!.status).equals("loading", "Async data component status after the Supabase request is made but before it resolves")

            // check supabase was called
            expect(mocked_supabase.from.calledWith("data_components")).equals(true, "supabase.from() should be called")
            expect(mocked_supabase.from().select.calledWith("*")).equals(true, "supabase.from().select() should be called")
            expect(mocked_supabase.from().select().in.calledWith("id", [-123])).equals(true, "supabase.from().select().in() should be called")
            expect(mocked_supabase.from().select().in().order.calledWith("version_number", { ascending: false })).equals(true, "supabase.from().select().in().order()")
            expect(mocked_supabase.from().select().in().order().order.calledWith("id", { ascending: true })).equals(true, "supabase.from().select().in().order().order()")
            expect(mocked_supabase.from().select().in().order().order().range.calledWith(0, 19)).equals(true, "supabase.range should be called")

            await wait_for(0)
            const { data_components: data_components3 } = store.getState()
            // check that the data component was added to the store
            const expected_data_component = convert_from_db_row(mock_db_data_component_row, "yes")
            deep_equals(data_components3.data_component_by_id_and_maybe_version["-123"]!.component, expected_data_component, "Data component should be added to the store after loading")
            deep_equals(data_components3.data_component_by_id_and_maybe_version["-123"]!.status, "loaded", "Async data component status after the Supabase request resolves successfully")
            deep_equals(data_components3.data_component_by_id_and_maybe_version["-123v2"]!.component, expected_data_component, "Data component of id and version should be added to the store after loading")
        })

        // Test that when a data component requested by an id but supabase
        // call runs into an error, that the status is updated to "error".
        it("should set status to 'load_error' when a data component is requested but error occured when calling supabase", async () =>
        {
            set_up_store([{ error: new Error("Some kind of error") }])

            const { data_components } = store.getState()
            data_components.request_data_component(new IdOnly(-123))
            await wait_for(0)
            const { data_components: data_components2 } = store.getState()
            expect(data_components2.request_data_component_error).to.be.instanceOf(Error, "request_data_component_error should be set to the error from the Supabase request")
            expect(data_components2.data_component_by_id_and_maybe_version["-123"]!.status).equals("load_error", "Async data component status after the Supabase request resolves with an error")
            expect(Object.keys(data_components2.data_component_by_id_and_maybe_version)).to.deep.equals(["-123"], "Only the original id and not the full id of the data component should be in the store (we don't know the version yet because the request to load the latest component failed!)")
        })

        // Test that when a data component that was requested by an id but
        // supabase call ran into an error, that the user can trigger the
        // request again and the status is changed from "error" to "loading".
        it("should be able to retry loading a data component after an error", async () =>
        {
            set_up_store([{ error: new Error("Some kind of error") }])

            const { data_components } = store.getState()
            data_components.request_data_component(new IdOnly(-123))
            await wait_for(0)
            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_by_id_and_maybe_version["-123"]!.status).equals("load_error", "Async data component status after the Supabase request resolves with an error")

            // Retry the request
            data_components.request_data_component(new IdOnly(-123))
            const { data_components: data_components3 } = store.getState()
            expect(data_components3.data_component_by_id_and_maybe_version["-123"]!.status).equals("loading", "Async data component status should be set to 'loading' after retrying the request")
            await wait_for(0)
            const { data_components: data_components4 } = store.getState()
            expect(data_components4.data_component_by_id_and_maybe_version["-123"]!.status).equals("loaded", "Async data component status should be set to 'loaded' after the request resolves successfully")
        })

        // Test if the data component requested by an id is not found in
        // supabase, that the placeholder is updated with status "not_found"
        it("should set status to 'not_found' when a data component is requested but not found in supabase", async () =>
        {
            set_up_store([{ data: [] }])

            const { data_components } = store.getState()
            data_components.request_data_component(new IdOnly(-999))
            await wait_for(0)
            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_by_id_and_maybe_version["-999"]!.status).equals("not_found", "Async data component status after the Supabase request resolves with no data")
        })

        // TODO test if the data component requested by an id is not found in
        // supabase, that the user can trigger another request to find it and
        // that its placeholder status is changed from "not_found" to "requested".
    })


    describe("request_data_components", () =>
    {
        it("should handle request", async () =>
        {
            const { data_components } = store.getState()
            expect(data_components.data_component_ids_for_home_page).equals(undefined, "Initial data_component_ids_for_home_page should be undefined")

            data_components.request_data_components_for_home_page()
            const { data_components: data_components2 } = store.getState()
            expect(data_components2.data_component_ids_for_home_page?.status).equals("loading", "data_component_ids_for_home_page.status should be 'loading'")
            expect(data_components2.data_component_ids_for_home_page?.ids).equals(undefined, "data_component_ids_for_home_page.ids should be undefined")
            expect(data_components2.data_component_by_id_and_maybe_version).to.deep.equal({}, "data_component_by_id_and_maybe_version should remain empty because we don't know what component ids will be returned yet")

            await wait_for(0)

            const { data_components: data_components3 } = store.getState()
            expect(data_components3.data_component_ids_for_home_page?.status).equals("loaded", "data_component_ids_for_home_page.status should be 'loaded' after the request resolves")
            expect(data_components3.data_component_ids_for_home_page?.ids).to.deep.equal([new IdAndVersion(mock_db_data_component_row.id, mock_db_data_component_row.version_number)], "data_component_ids_for_home_page.ids should contain the id of the loaded data component")
            expect(data_components3.data_component_by_id_and_maybe_version["-123"]!.status).equals("loaded", "Async data component status should be 'loaded' after the request resolves")
            expect(data_components3.data_component_by_id_and_maybe_version["-123"]!.component).to.deep.equal(
                convert_from_db_row(mock_db_data_component_row, "yes"),
                "Data component should be added to the store after loading"
            )
            expect(data_components3.data_component_by_id_and_maybe_version["-123v2"]!.component).to.deep.equal(
                convert_from_db_row(mock_db_data_component_row, "yes"),
                "Data component of id and version should be added to the store after loading"
            )
        })
    })
})
