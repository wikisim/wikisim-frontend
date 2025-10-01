import { Editor } from "@tiptap/core"
import { expect } from "chai"

import { tiptap_mention_chip } from "core/test/fixtures"

import { get_tiptap_extensions } from "./tiptap_extensions"


describe("CustomMention", () =>
{
    it("should parse old span.mention-chip tags", () =>
    {
        const editor = new Editor({
            extensions: get_tiptap_extensions(false, false),
            editable: false,
            content: `<p>This is a mention chip: <span class="mention-chip" data-type="customMention" data-id="-3v1" data-label="Some Number">@Some Number</span></p>`,
        })

        expect(editor.getHTML()).equals(`<p>This is a mention chip: <a data-id="-3v1" class="mention-chip">Some Number</a></p>`)
    })


    it("should parse a new a.mention-chip tag", () =>
    {
        const editor = new Editor({
            extensions: get_tiptap_extensions(false, false),
            editable: false,
            content: `<p>This is a mention chip: <a class="mention-chip" data-id="-3v1">Some Number</a></p>`,
        })

        expect(editor.getHTML()).equals(`<p>This is a mention chip: <a data-id="-3v1" class="mention-chip">Some Number</a></p>`)
    })


    it("tiptap_mention_chip fixture for span should work", () =>
    {
        const editor = new Editor({
            extensions: get_tiptap_extensions(false, false),
            editable: false,
            content: tiptap_mention_chip("-3v1", "span"),
        })

        expect(editor.getHTML()).equals(`<p><a data-id="-3v1" class="mention-chip">Some title for -3v1</a></p>`)
    })


    it("tiptap_mention_chip fixture for anchor tag should work", () =>
    {
        const editor = new Editor({
            extensions: get_tiptap_extensions(false, false),
            editable: false,
            content: tiptap_mention_chip("-3v1", "a"),
        })

        expect(editor.getHTML()).equals(`<p><a data-id="-3v1" class="mention-chip">Some title for -3v1</a></p>`)
    })
})
