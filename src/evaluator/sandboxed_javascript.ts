import { useEffect } from "preact/hooks"

import { EvaluationRequest, EvaluationResponse } from "./interface"


let next_evaluation_id = 0

let iframe: HTMLIFrameElement
let resolve_iframe_loaded: (value: void | PromiseLike<void>) => void
const iframe_loaded = new Promise<void>(resolve => {
    resolve_iframe_loaded = resolve
})

interface ExtendedEvaluationRequest extends EvaluationRequest
{
    evaluation_id: number
    requested_at: number
    start_time: number
    timeout_id?: ReturnType<typeof setTimeout>
    promise_result: Promise<EvaluationResponse>
    resolve: (response: EvaluationResponse) => void
}

export async function evaluate_code_in_sandbox(basic_request: EvaluationRequest): Promise<EvaluationResponse>
{
    const requested_at = performance.now()

    let resolve: (response: EvaluationResponse) => void
    const promise_result = new Promise<EvaluationResponse>(resolv => resolve = resolv)
    const request: ExtendedEvaluationRequest = {
        ...basic_request,
        evaluation_id: ++next_evaluation_id,
        requested_at,
        start_time: -1,
        promise_result,
        resolve: resolve!,
    }

    await iframe_loaded
    await request_next_evaluation(request)

    const start_time = performance.now()
    request.start_time = start_time
    // type guard, should never be null unless during dev when the
    // iframe can be removed
    if (iframe.contentWindow === null) return {
        evaluation_id: request.evaluation_id,
        error: "sandboxed iframe has gone missing",
        result: null,
        requested_at,
        start_time,
        time_taken_ms: performance.now() - requested_at,
    }

    // Send stringified call request object into iframe
    // console .log(`Sending evaluation request to sandboxed iframe: ${call.evaluation_id} with code: ${call.value} at ${existing_call_in_progress.start_time}ms`)
    iframe.contentWindow.postMessage(JSON.stringify(request), "*")

    // Timeout if no response
    request.timeout_id = setTimeout(() => {
        const existing_call_in_progress = requests[request.evaluation_id]
        if (!existing_call_in_progress) return
        delete requests[existing_call_in_progress.evaluation_id]

        const failure: EvaluationResponse = {
            evaluation_id: request.evaluation_id,
            error: `Timeout waiting for response from sandboxed iframe.`,
            result: null,
            requested_at,
            start_time,
            time_taken_ms: performance.now() - start_time,
        }

        request.resolve(failure)
    }, request.timeout || 100)

    return promise_result
}


const requests: Record<number, ExtendedEvaluationRequest> = {}
let previous_request: ExtendedEvaluationRequest | undefined
async function request_next_evaluation(request: ExtendedEvaluationRequest)
{
    requests[request.evaluation_id] = request

    const previous_promise_result = previous_request?.promise_result
    previous_request = request

    await previous_promise_result
}


export function Evaluator()
{
    useEffect(() => {
        // --- Create hidden sandboxed iframe ---
        iframe = document.createElement("iframe")

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
                    const result_json = JSON.stringify(result);
                    console .log(' [iFrame] ==========> Success, result:', result_json);
                    e.source.postMessage({
                        evaluation_id: payload.evaluation_id,
                        result: result_json,
                        error: null,
                    }, '*');
                } catch (err) {
                    // console .log(' [iFrame] ==========> Error:', err);
                    e.source.postMessage({
                        evaluation_id: payload.evaluation_id,
                        result: null,
                        error: err.toString(),
                    }, '*');
                }
            });
        </script>
        `
        iframe.srcdoc = raw_src_doc

        iframe.onload = () => resolve_iframe_loaded()
        iframe.onerror = e => console .error('Iframe error:', e)

        document.body.appendChild(iframe)


        // --- Communication setup ---
        function handle_message_from_iframe(event: MessageEvent<EvaluationResponse>)
        {
            // console .log("Received message from sandboxed iframe:", event.data)
            if (event.source === iframe.contentWindow)
            {
                const existing_call_in_progress = requests[event.data.evaluation_id]
                if (!existing_call_in_progress) return
                delete requests[existing_call_in_progress.evaluation_id]

                clearTimeout(existing_call_in_progress.timeout_id)

                let response: EvaluationResponse = {
                    evaluation_id: existing_call_in_progress.evaluation_id,
                    result: "",
                    error: null,
                    requested_at: existing_call_in_progress.requested_at,
                    start_time: existing_call_in_progress.start_time,
                    time_taken_ms: performance.now() - existing_call_in_progress.start_time,
                }

                if (event.data.error)
                {
                    response = {
                        ...response,
                        result: null,
                        error: event.data.error,
                    }
                }
                else if (event.data.result !== null)
                {
                    response = {
                        ...response,
                        // Ensure result is a string if it's not null
                        result: `${event.data.result}`,
                        error: null,
                    }
                }

                existing_call_in_progress.resolve(response)
            }
        }
        window.addEventListener("message", handle_message_from_iframe)


        return () =>
        {
            window.removeEventListener("message", handle_message_from_iframe)
            // Remove sandboxed iframe
            document.body.removeChild(iframe)
        }
    }, [])

    return null
}
