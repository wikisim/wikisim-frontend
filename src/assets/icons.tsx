
import HistoryIconSVG from "./history.svg"
import RepeatSVG from "./repeat.svg"
import UsePreviousResultSVG from "./use_previous_result.svg"

export const HistoryIcon = () => <img
    src={HistoryIconSVG}
    alt="History"
    title="History"
    width={20}
    height={20}
    style={{ verticalAlign: -5, margin: "0px 5px" }}
/>

export const RepeatIcon = (props: { disabled?: boolean, no_title?: boolean }) => <img
    src={RepeatSVG}
    alt="Repeat"
    title={props.no_title ? undefined : "Repeat"}
    width={20}
    height={20}
    style={{
        verticalAlign: -5,
        margin: "0px 5px",
        filter: props.disabled ? "brightness(5) contrast(0.7)" : undefined,
    }}
/>

export const UsePreviousResultIcon = (props: { disabled?: boolean, no_title?: boolean }) => <img
    src={UsePreviousResultSVG}
    alt="Use Previous Result"
    title={props.no_title ? undefined : "Use Previous Result"}
    width={20}
    height={20}
    style={{
        verticalAlign: -5,
        margin: "0px 5px",
        filter: props.disabled ? "brightness(5) contrast(0.7)" : undefined,
    }}
/>
