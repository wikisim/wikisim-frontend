import AlternativeIconSVG from "./alternative.svg"
import BackReferencesIconSVG from "./back_references.svg"
import HistoryIconSVG from "./history.svg"
import RepeatIconSVG from "./repeat.svg"
import UpdateVersionSVG from "./update_version.svg"
import UsePreviousResultIconSVG from "./use_previous_result.svg"


export const IconAlternative = (props: { title?: string, size?: number }) => <img
    src={AlternativeIconSVG}
    alt="Alternative"
    title={props.title}
    width={props.size ?? 24}
    height={props.size ?? 24}
    style={{
        // verticalAlign: -5,
        // margin: "0px 5px"
    }}
/>

export const IconBackReferences = (props: { title?: string, size?: number }) => <img
    src={BackReferencesIconSVG}
    alt="Alternative"
    title={props.title}
    width={props.size ?? 24}
    height={props.size ?? 24}
    style={{
        // verticalAlign: -5,
        // margin: "0px 5px"
    }}
/>

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

export const IconUpdateVersion = (props: { no_title?: boolean }) => <img
    src={UpdateVersionSVG}
    alt="Update Version"
    title={props.no_title ? undefined : "Use Newer Version"}
    width={20}
    height={20}
    style={{
        // verticalAlign: -5,
        // margin: "0px 5px",
        // filter: props.disabled ? "brightness(5) contrast(0.7)" : undefined,
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
