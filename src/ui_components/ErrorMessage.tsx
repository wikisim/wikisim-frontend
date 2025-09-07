
import "./ErrorMessage.css"


export const ErrorMessage = (props: { show: boolean, message: string }) =>
{
    return <div className={`generic-error-message ${props.show ? "show" : "hide"}`}>
        {props.message}
    </div>
}


export const WarningMessage = (props: { show: boolean, message: string }) =>
{
    return <div className={`generic-error-message warning ${props.show ? "show" : "hide"}`}>
        {props.message}
    </div>
}
