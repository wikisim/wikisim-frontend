import * as Sentry from "@sentry/react"

import { error_to_string } from "core/errors"


export const original_console = {
    error: console.error,
    warn: console.warn,
    info: console.info,
}

export function setup_error_logging()
{
    Sentry.init({
        dsn: "https://a07872a5eb879527065c774ca7a8bdc7@o4511203622584320.ingest.de.sentry.io/4511203632087120",
        // Setting this option to true will send default PII data to Sentry.
        // For example, automatic IP address collection on events
        sendDefaultPii: true,
        enabled: window.location.hostname !== "localhost",
        tracePropagationTargets: [
            "localhost", // For local development
        ],
    })


    console.error = function (...args)
    {
        if (args[0] instanceof Error) Sentry.captureException(args[0])
        else Sentry.captureMessage(args.map(error_to_string).join(" "), "error")

        // Log to the console
        original_console.error.apply(console, args)
    }

    console.warn = function (...args)
    {
        Sentry.captureMessage(args.map(error_to_string).join(" "), "warning")

        // Log to the console
        original_console.warn.apply(console, args)
    }

    console.info = function (...args)
    {
        Sentry.captureMessage(args.map(error_to_string).join(" "), "info")

        // Log to the console
        original_console.info.apply(console, args)
    }
}
