import {HTMLAttributes} from "react";
import {lobbyManager} from "../utility/contexts";
import ReactSwitch from "react-switch";
import {Room} from "colyseus.js";

export default function SettingsList(props: HTMLAttributes<HTMLDivElement> & { room: Room, ownerId: string | undefined }) {
    let isImplodingEnabled = lobbyManager.useColyseusState((state) => state.isImplodingEnabled)
    if (isImplodingEnabled === undefined || props.ownerId === undefined) return;

    if (!props.room) return;
    let isOwner = props.room.sessionId === props.ownerId;

    const {room, ownerId, ...divProps} = props;

    return (
        <div {...divProps}>
            <label className={"text-white align-middle"}>Use Imploding Kittens?</label>
            <ReactSwitch checked={isImplodingEnabled} onChange={(checked) => {
                props.room.send("changeSettings", {isImplodingEnabled: checked, nopeQTEMode: true})
            }} disabled={!isOwner} className={"align-middle ml-1 scale-75"} checkedIcon={false} uncheckedIcon={false}/>
        </div>
    )
}