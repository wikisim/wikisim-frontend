import { expect } from "chai"

import { make_name_from_path } from "./event_and_state_handlers"


describe("make_name_from_path", function ()
{
    it("creates alias from key", function ()
    {
        const alias = make_name_from_path([{ key: "name" }], {})
        expect(alias).equals("name")
    })

    it("creates alias from nested key", function ()
    {
        const alias = make_name_from_path([{ key: "user" }, { key: "name" }], {})
        expect(alias).equals("name")
    })

    it("creates alias from index", function ()
    {
        const alias = make_name_from_path([{ index: 0 }], {})
        expect(alias).equals("index_0")
    })

    it("prefers to create alias from key", function ()
    {
        const alias = make_name_from_path([{ key: "user" }, { index: 0 }], {})
        expect(alias).equals("user_0")
    })

    it("creates unique alias when there is a conflict", function ()
    {
        const existing_names = {
            '[{"key":"name"}]': "name",
            '[{"key":"user_name"}]': "user_name",
        }
        const alias = make_name_from_path([{ key: "second" }, { key: "user" }, { key: "name" }], existing_names)
        expect(alias).equals("second_user_name")
    })
})
