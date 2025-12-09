
import "./ErrorMessage.css"


export const ErrorMessage = (props: { show: boolean, message: string | null }) =>
{
    if (!props.message) return null

    let message = props.message.replace(/ERR\d+\.?\s+/g, "")
    if (!message.includes("Error")) message = `Error: ${message}`

    return <div className={`generic-error-message ${props.show ? "show" : "hide"}`}>
        {message}
    </div>
}


export const WarningMessage = (props: { show: boolean, message: string }) =>
{
    return <div className={`generic-error-message warning ${props.show ? "show" : "hide"}`}>
        {props.message}
    </div>
}
