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
        const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
        expect(extracted_data).equals("Example")
        expect(all_missing).equals(false)
    })

    it("extracts top-level index from array", () =>
    {
        const data_array = [10, 20, 30, undefined, 50]

        const path1: JSONPath = [{ index: 1 }]
        const { extracted_data, all_missing } = extract_data_at_path(data_array, path1)
        expect(extracted_data).equals(20)
        expect(all_missing).equals(false)

        const path2: JSONPath = [{ index: 3 }]
        const result2 = extract_data_at_path(data_array, path2)
        expect(result2.extracted_data).equals("undefined")
        expect(all_missing).equals(false, "undefined is a valid value, so all_missing should be false")
    })

    it("returns undefined for out-of-bounds array index at the top level", () =>
    {
        const path: JSONPath = [{ index: 10 }]
        const data_array = [10, 20, 30, 40, 50]
        const { extracted_data, all_missing } = extract_data_at_path(data_array, path)
        expect(extracted_data).equals("undefined")
        expect(all_missing).equals(true)
    })

    it("extracts nested property from object", () =>
    {
        const path: JSONPath = [{ key: "metadata" }, { key: "created" }]
        const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
        expect(extracted_data).equals("2024-01-01T12:00:00Z")
        expect(all_missing).equals(false)
    })

    it("extracts nested property from array within object", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: 1 }, { key: "details" }, { key: "description" }]
        const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
        expect(extracted_data).equals("This is item 2")
        expect(all_missing).equals(false)
    })

    it("returns undefined for non-existent property", () =>
    {
        const path: JSONPath = [{ key: "non-existent-key" }]
        const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
        expect(extracted_data).equals("undefined")
        expect(all_missing).equals(true)
    })

    it("returns undefined for out-of-bounds array index", () =>
    {
        const path: JSONPath = [{ key: "items" }, { index: 10 }, { key: "details" }]
        const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
        expect(extracted_data).equals("undefined")
        expect(all_missing).equals(true)
    })

    describe("wildcard", () =>
    {
        it("extracts top-level wildcard from array", () =>
        {
            const path: JSONPath = [{ index: "*" }]
            const data_array = [10, 20, 30, 40, 50]
            const { extracted_data, all_missing } = extract_data_at_path(data_array, path)
            expect(extracted_data).deep.equals([10, 20, 30, 40, 50])
            expect(all_missing).equals(false)
        })

        it("returns entire array for wildcard index", () =>
        {
            const path: JSONPath = [{ key: "items" }, { index: "*" }]
            const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
            expect(extracted_data).deep.equals(data_obj.items.map(item => JSON.stringify(item)))
            expect(all_missing).equals(false)
        })

        it("returns nested property with nested wildcard index", () =>
        {
            const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "id" }]
            const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
            expect(extracted_data).to.deep.equal([1, 2, 3])
            expect(all_missing).equals(false)
        })

        it("returns nested property with nested wildcard index finishing with wildcard", () =>
        {
            const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "details" }, { key: "tags" }, { index: "*" }]
            const { extracted_data, all_missing } = extract_data_at_path(data_obj, path, 2)
            expect(extracted_data).to.deep.equal([
                "undefined",
                // Could return as an array but no use case for this yet
                `["tag1","tag2"]`,
                "undefined",
            ])
            expect(all_missing).equals(false)
        })

        it("returns limited nested wildcards", () =>
        {
            const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "details" }, { key: "tags" }, { index: "*" }]
            const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
            expect(extracted_data).to.deep.equal([
                "undefined",
                `["tag1","tag2"]`,
                "undefined",
            ])
            expect(all_missing).equals(false)
        })

        it("returns limited nested wildcards, with objects", () =>
        {
            const data_obj = {
                results: [
                    { orders: [ { retail: 1 } ] },
                    { orders: [ { retail: 2 } ] },
                ]
            }
            const path1: JSONPath = [{ key: "results" }, { index: "*" }, { key: "orders" }, { index: "*" }, { key: "retail" }]
            const result1 = extract_data_at_path(data_obj, path1)
            expect(result1.extracted_data).to.deep.equal([
                `["{\\"retail\\":1}"]`,
                `["{\\"retail\\":2}"]`,
            ])
            expect(result1.all_missing).equals(false)

            const path2: JSONPath = [{ key: "results" }, { index: "*" }, { key: "orders" }, { index: 0 }, { key: "retail" }]
            const result2 = extract_data_at_path(data_obj, path2)
            expect(result2.extracted_data).to.deep.equal([ 1, 2 ])
            expect(result2.all_missing).equals(false)
        })

        it("warns if no values present anywhere", () =>
        {
            const path: JSONPath = [{ key: "items" }, { index: "*" }, { key: "non-existent-key" }]
            const { extracted_data, all_missing } = extract_data_at_path(data_obj, path)
            expect(extracted_data).to.deep.equal([
                "undefined",
                "undefined",
                "undefined",
            ])
            expect(all_missing).equals(true)
        })
    })
})
