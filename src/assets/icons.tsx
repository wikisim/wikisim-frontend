import HistoryIconSVG from "./history.svg"
import RepeatIconSVG from "./repeat.svg"
import UsePreviousResultIconSVG from "./use_previous_result.svg"

export const IconHistory = () => <img
    src={HistoryIconSVG}
    alt="History"
    title="History"
    width={20}
    height={20}
    style={{
        // verticalAlign: -5,
        margin: "0px 5px"
    }}
/>

export const IconRepeat = (props: { disabled?: boolean, no_title?: boolean }) => <img
    src={RepeatIconSVG}
    alt="Repeat"
    title={props.no_title ? undefined : "Repeat"}
    width={20}
    height={20}
    style={{
        // verticalAlign: -5,
        // margin: "0px 5px",
        filter: props.disabled ? "brightness(5) contrast(0.7)" : undefined,
    }}
/>

export const IconUsePreviousResult = (props: { disabled?: boolean, no_title?: boolean }) => <img
    src={UsePreviousResultIconSVG}
    alt="Use Previous Result"
    title={props.no_title ? undefined : "Use Previous Result"}
    width={20}
    height={20}
    style={{
        // verticalAlign: -5,
        // margin: "0px 5px",
        filter: props.disabled ? "brightness(5) contrast(0.7)" : undefined,
    }}
/>



export const IconGraph = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" >
    <path d="M3 3v18h18" fill="none" />
    <path d="M6 15l3 -4l2 2l3 -5l2 3l2 -4" fill="none" />
</svg>
