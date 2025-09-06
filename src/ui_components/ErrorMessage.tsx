
import "./ErrorMessage.css"


export const ErrorMessage = (props: { show: boolean, message: string }) =>
{
    return <div className={`generic-error-message ${props.show ? "show" : "hide"}`}>
        {props.message}
    </div>
}
