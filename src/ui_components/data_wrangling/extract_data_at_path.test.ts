import { expect } from "chai"
import { extract_data_at_path } from "./extract_data_at_path"
import { JSONPath } from "./interface"


describe("extract_data_at_path", () =>
{
    const data_obj = {
        name: "Example",
        version: 1,
        isActive: true,
        items: [
            { id: 1, value: "Item 1" },
            { id: 2, value: "Item 2", details: { description: "This is item 2", tags: ["tag1", "tag2"] } },
            { id: 3, value: "Item 3" },
        ],
        metadata: {
            created: "2024-01-01T12:00:00Z",
            modified: null,
            contributors: [
                { name: "Alice", role: "author" },
                { name: "Bob", role: "editor" },
            ],
        },
    }

    it("extracts top-level property from object", () =>
    {
        const path: JSONPath = [{ key: "name" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals("Example")
    })

    it("extracts top-level property from array", () =>
    {
        const path: JSONPath = [{ index: 1 }]
        const data_array = [10, 20, 30, 40, 50]
        const result = extract_data_at_path(data_array, path)
        expect(result).equals(20)
    })

    it("extracts nested property from object", () =>
    {
        const path: JSONPath = [{ key: "metadata" }, { key: "created" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals("2024-01-01T12:00:00Z")
    })

    it("extracts nested property from array within object", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: 1 }, { key: "details" }, { key: "description" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals("This is item 2")
    })

    it("returns undefined for non-existent property", () =>
    {
        const path: JSONPath = [{ key: "nonExistent" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals("undefined")
    })

    it("returns undefined for out-of-bounds array index", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: 10 }, { key: "details" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals("undefined")
    })

    it("returns entire array for wildcard index", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: "*" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).equals(JSON.stringify(data_obj.items))
    })

    it("returns nested property with nested wildcard index", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "id" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).to.deep.equal([1, 2, 3])
    })

    it("returns nested property with nested wildcard index finishing with wildcard", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "details" }, { key: "tags" }, { index: "*" }]
        const result = extract_data_at_path(data_obj, path, 2)
        expect(result).to.deep.equal([
            "undefined",
            // Could return as an array but no use case for this yet
            `["tag1","tag2"]`,
            "undefined",
        ])
    })

    it("returns limits nested wildcards", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "details" }, { key: "tags" }, { index: "*" }]
        const result = extract_data_at_path(data_obj, path)
        expect(result).to.deep.equal([
            "undefined",
            `["tag1","tag2"]`,
            "undefined",
        ])
    })
})
