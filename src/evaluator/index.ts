import { useEffect } from "preact/hooks"
import pub_sub from "../pub_sub"
import { EvaluationRequest, EvaluationResponse } from "./interface"


export function Evaluator()
{
    useEffect(() => {
        // --- Create hidden sandboxed iframe ---
        const iframe = document.createElement("iframe")

        // The sandbox attribute is key:
        // - allow-scripts: lets code inside run
        // - no same-origin, no storage, no network
        iframe.setAttribute("sandbox", "allow-scripts")
        iframe.style.display = "none"

        // Load a blank page with a script that listens for code
        const raw_src_doc = `
        <script>
            // console .log(' [iFrame] ==========> Sandboxed iframe loaded');
            window.addEventListener('message', (e) => {
                const payload = JSON.parse(e.data);
                // console .log(' [iFrame] ==========> received payload:', payload);
                try {
                    // Evaluate the code inside the sandboxed iframe
                    const result = eval(payload.value);
                    // console .log(' [iFrame] ==========> Success, result:', result);
                    e.source.postMessage({
                        evaluation_id: payload.evaluation_id,
                        result,
                        error: null,
                        start_time: payload.start_time,
                    }, '*');
                } catch (err) {
                    // console .log(' [iFrame] ==========> Error:', err);
                    e.source.postMessage({
                        evaluation_id: payload.evaluation_id,
                        result: null,
                        error: err.toString(),
                        start_time: payload.start_time,
                    }, '*');
                }
            });
        </script>
        `
        iframe.srcdoc = raw_src_doc

        // Add debugging for iframe load events
        const iframe_ready = new Promise(resolve =>
        {
            iframe.onload = () => resolve(true)
        })

        iframe.onerror = e => console .error('Iframe error:', e)

        document.body.appendChild(iframe)


        const pending_calls: EvaluationRequest[] = []
        let existing_call_in_progress: EvaluationRequest & { timeout_id: NodeJS.Timeout | null, start_time: number } | null = null
        function process_pending_calls()
        {
            if (existing_call_in_progress)
            {
                // console .warn("Existing call in progress, deferring execution")
                return
            }

            // type guard, should never be null unless during dev when the
            // iframe can be removed
            if (iframe.contentWindow === null) return

            const call = pending_calls.shift()
            if (!call) return

            existing_call_in_progress = {
                ...call,
                timeout_id: null,
                start_time: performance.now(),
            }

            // Send stringified call request object into iframe
            // console .log(`Sending evaluation request to sandboxed iframe: ${call.evaluation_id} with code: ${call.value} at ${existing_call_in_progress.start_time}ms`)
            iframe.contentWindow.postMessage(JSON.stringify(existing_call_in_progress), "*")

            // Timeout if no response
            existing_call_in_progress.timeout_id = setTimeout(() => {
                pub_sub.pub("evaluated_code_in_sandbox_response", {
                    evaluation_id: call.evaluation_id,
                    result: null,
                    error: `Timeout waiting for response from sandboxed iframe.`,
                    start_time: existing_call_in_progress!.start_time,
                    time_taken_ms: performance.now() - existing_call_in_progress!.start_time,
                })
            }, call.timeout || 100)
        }

        pub_sub.sub("evaluate_code_in_sandbox", async (code) => {
            await iframe_ready
            pending_calls.push(code)
            process_pending_calls()
        })

        pub_sub.sub("evaluated_code_in_sandbox_response", () => {
            clearTimeout(existing_call_in_progress?.timeout_id || 0)
            existing_call_in_progress = null
            // Allow other subscribers to process the evaluated_code response
            // first before we trigger the other pending calls
            setTimeout(() => process_pending_calls(), 0)
        })


        // --- Communication setup ---
        function handle_message_from_iframe(event: MessageEvent<EvaluationResponse>)
        {
            // console .log("Received message from sandboxed iframe:", event.data)
            if (event.source === iframe.contentWindow)
            {
                const response: EvaluationResponse = {
                    evaluation_id: event.data.evaluation_id,
                    result: event.data.result,
                    error: event.data.error,
                    time_taken_ms: performance.now() - event.data.start_time,
                } as EvaluationResponse

                pub_sub.pub("evaluated_code_in_sandbox_response", response)
            }
        }
        window.addEventListener("message", handle_message_from_iframe)


        // --- Demo ---
        const run1 = () => {
            pub_sub.pub("evaluate_code_in_sandbox", {evaluation_id: "123", value: "1 + 1" })
        }

        const run2 = () => {
            pub_sub.pub("evaluate_code_in_sandbox", {evaluation_id: "456", value: `condition = (10-5)>0

change = -1

if (condition) change = 10
else change = 0

Math.max(0,Math.min(10,change))` })
        }

        const run3 = () => {
            pub_sub.pub("evaluate_code_in_sandbox", {evaluation_id: "456", value: `console.log(document.cookie); document.cookie || "no cookie"` })
        }

        run2()
        run1()
        run1()
        run3()

        pub_sub.sub("evaluated_code_in_sandbox_response", (response: EvaluationResponse) => {
            console.log(`Result for ${response.evaluation_id}: ${response.result || response.error} (${response.time_taken_ms} ms)\n`)
        })

        return () =>
        {
            window.removeEventListener("message", handle_message_from_iframe)
            // Remove sandboxed iframe
            document.body.removeChild(iframe)
        }
    }, [])

    return null
}
