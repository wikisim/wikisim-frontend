import { expect } from "chai"

import { JSONPath } from "core/data/interface"

import { convert_array_paths_to_wildcards } from "./convert_array_paths_to_wildcards"


describe("convert_array_paths_to_wildcards", () =>
{
    it("converts array indices to wildcards", () =>
    {
        const path: JSONPath = [
            { key: "users" },
            { index: 0 },
            { key: "name" },
            { index: 2 },
            { key: "first" },
        ]

        const converted_path = convert_array_paths_to_wildcards(path)

        expect(converted_path).deep.equals([
            { key: "users" },
            { index: "*" },
            { key: "name" },
            { index: "*" },
            { key: "first" },
        ])
    })


    it("limits number of wildcards when limit_wildcards is set", () =>
    {
        const path: JSONPath = [
            { key: "users" },
            { index: 0 },
            { key: "posts" },
            { index: 1 },
            { key: "comments" },
        ]

        const converted_path = convert_array_paths_to_wildcards(path, 1)

        expect(converted_path).deep.equals([
            { key: "users" },
            { index: "*" },
            { key: "posts" },
            { index: 1 },
            { key: "comments" },
        ])
    })
})
