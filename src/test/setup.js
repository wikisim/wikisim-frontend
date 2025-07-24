// Ensures test suite will fail when a test throws an async error

process.on("unhandledRejection", (err) =>
{
    throw err
})

process.on("uncaughtException", (err) =>
{
    throw err
})


// Sets up a DOM environment for testing
import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" })
global.window = dom.window
global.document = dom.window.document
global.DOMParser = dom.window.DOMParser
global.Node = dom.window.Node
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element
global.getComputedStyle = dom.window.getComputedStyle
