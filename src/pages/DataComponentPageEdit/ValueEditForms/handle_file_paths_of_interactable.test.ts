import { expect } from "chai"

import {
    filter_file_names,
    find_relative_file_path,
    process_file_paths_of_interactable,
} from "./handle_file_paths_of_interactable"


describe("filter_file_names", () =>
{
    it("removes system files like .DS_Store and Thumbs.db", () =>
    {
        const files = [
            new File(["content"], "top_folder/index.html"),
            new File(["content"], "top_folder/.DS_Store"),
            new File(["content"], "top_folder/.env"),
            new File(["content"], "top_folder/Thumbs.db"),
            new File(["content"], "top_folder/style.css"),
            new File(["content"], "top_folder/sub_folder/.DS_Store"),
        ]

        const filtered = filter_file_names(files).map(f => f.name)

        expect(filtered).deep.equals([
            "top_folder/index.html",
            "top_folder/style.css",
        ])
    })
})


describe("find_relative_file_path", () =>
{
    it("finds index.html in a list of file names", () =>
    {
        const file_names = [
            "top_folder/file1.txt",
            "top_folder/index.html",
            "top_folder/sub_folder/file2.txt"
        ]
        const result = find_relative_file_path(file_names)
        expect(result).equals("top_folder")
    })


    it("returns the nothing if index.html is not found at top level", () =>
    {
        const file_names = [
            "top_folder/file1.txt",
            // Nested index.html should not be considered
            "top_folder/sub_folder/index.html",
        ]
        const result = find_relative_file_path(file_names)
        expect(result).equals(undefined)
    })


    it("handles a single index.html file not in a folder", () =>
    {
        const file_names = [
            "index.html",
        ]
        const result = find_relative_file_path(file_names)
        expect(result).equals("")
    })
})


describe("process_file_paths_of_interactable", () =>
{
    it("processes file paths by removing the common prefix", () =>
    {
        const file_map = {
            "top_folder/index.html": new File(["content"], "index.html"),
            "top_folder/style.css": new File(["content"], "style.css"),
            "top_folder/sub_folder/script.js": new File(["content"], "script.js"),
        }

        const result = process_file_paths_of_interactable(file_map)
        expect(result).to.be.an("object")
        if (typeof result === "string") throw new Error("Expected an object, got a string")

        expect(result).deep.equals({
            relative_path: "top_folder",
            file_map: {
                "index.html": file_map["top_folder/index.html"],
                "style.css": file_map["top_folder/style.css"],
                "sub_folder/script.js": file_map["top_folder/sub_folder/script.js"],
            }
        })
    })


    it("returns an error message if index.html is missing", () =>
    {
        const file_map = {
            "top_folder/style.css": new File(["content"], "style.css"),
            "top_folder/sub_folder/script.js": new File(["content"], "script.js"),
        }

        const result = process_file_paths_of_interactable(file_map)
        expect(result).to.be.a("string")
        if (typeof result !== "string") throw new Error("Expected a string, got an object")

        expect(result).to.equal("ERR41. index.html not found in the uploaded files.")
    })
})
