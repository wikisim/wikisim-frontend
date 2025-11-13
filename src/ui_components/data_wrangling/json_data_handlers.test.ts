import { expect } from "chai"

import { make_name_from_path } from "./json_data_handlers"


describe("make_name_from_path", function ()
{
    it("creates name from key", function ()
    {
        const name = make_name_from_path([{ key: "name" }], {})
        expect(name).equals("name")
    })

    it("creates name from nested key", function ()
    {
        const name = make_name_from_path([{ key: "user" }, { key: "name" }], {})
        expect(name).equals("name")
    })

    it("creates name from index", function ()
    {
        const name = make_name_from_path([{ index: 0 }], {})
        expect(name).equals("index-0")
    })

    it("creates name from nested index", function ()
    {
        const existing_names = {
            '[{"index":"0"}, {"index":"1"}]': "index-1",
        }
        const name = make_name_from_path([{ index: 2 }, { index: 1 }], existing_names)
        expect(name).equals("index-2 index-1")
    })

    it("prefers to create name for index from parent key", function ()
    {
        const name = make_name_from_path([{ key: "user" }, { index: 0 }], {})
        expect(name).equals("user-0")
    })

    it("creates unique name when there is a conflict", function ()
    {
        const existing_names = {
            '[{"key":"name"}]': "name",
            '[{"key":"user_name"}]': "user name",
        }
        const name = make_name_from_path([{ key: "second" }, { key: "user" }, { key: "name" }], existing_names)
        expect(name).equals("second user name")
    })
})
