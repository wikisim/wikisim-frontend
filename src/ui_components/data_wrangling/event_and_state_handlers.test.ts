import { expect } from "chai"

import { make_alias } from "./event_and_state_handlers"


describe("make_alias", function ()
{
    it("creates alias from key", function ()
    {
        const alias = make_alias([{ key: "name" }], [])
        expect(alias).equals("name")
    })

    it("creates alias from nested key", function ()
    {
        const alias = make_alias([{ key: "user" }, { key: "name" }], [])
        expect(alias).equals("name")
    })

    it("creates alias from index", function ()
    {
        const alias = make_alias([{ index: 0 }], [])
        expect(alias).equals("index_0")
    })

    it("prefers to create alias from key", function ()
    {
        const alias = make_alias([{ key: "user" }, { index: 0 }], [])
        expect(alias).equals("user_0")
    })

    it("creates unique alias when there is a conflict", function ()
    {
        const existing_paths = [
            "name",
            "user_name",
        ].map(alias => ({ path: [], alias }))
        const alias = make_alias([{ key: "second" }, { key: "user" }, { key: "name" }], existing_paths)
        expect(alias).equals("second_user_name")
    })
})
