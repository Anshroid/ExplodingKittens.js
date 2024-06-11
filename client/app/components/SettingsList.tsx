import {HTMLAttributes} from "react";
import {lobbyManager} from "../utility/contexts";
import ReactSwitch from "react-switch";

export default function SettingsList(props: HTMLAttributes<HTMLDivElement>) {
    let room = lobbyManager.useColyseusRoom()
    let isImplodingEnabled = lobbyManager.useColyseusState((state) => state.isImplodingEnabled)
    let ownerId = lobbyManager.useColyseusState((state) => state.ownerId)
    if (isImplodingEnabled === undefined || ownerId === undefined) return;

    if (!room) return;
    let isOwner = room.sessionId === ownerId


    return (
        <div {...props}>
            <label className={"text-white align-middle"}>Use Imploding Kittens?</label>
            <ReactSwitch checked={isImplodingEnabled} onChange={(checked) => {
                room.send("changeSettings", {isImplodingEnabled: checked, nopeQTEMode: true})
            }} disabled={!isOwner} className={"align-middle ml-1 scale-75"} checkedIcon={false} uncheckedIcon={false}/>
        </div>
    )
}