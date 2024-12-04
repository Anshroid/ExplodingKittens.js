import {HTMLAttributes} from "react";
import ReactSwitch from "react-switch";
import {useColyseusRoom, useColyseusState} from "../../utility/contexts";

/**
 * Displays game settings that can be changed if the player is the owner
 *
 * @param props
 * @constructor
 */
export default function SettingsList(props: HTMLAttributes<HTMLDivElement>) {
    let room = useColyseusRoom();
    let isImplodingEnabled = useColyseusState((state) => state.isImplodingEnabled)
    let ownerId = useColyseusState((state) => state.ownerId);

    if (isImplodingEnabled === undefined || room === undefined) return;

    let isOwner = room.sessionId === ownerId;

    return (
        <div {...props}>
            <h2 className={"font-bold underline"}></h2>
            <label className={"align-middle"}>Use Imploding Kittens?</label>
            <ReactSwitch checked={isImplodingEnabled} onChange={(checked) => {
                room.send("changeSettings", {isImplodingEnabled: checked, nopeQTECooldown: 3000})
            }} disabled={!isOwner} className={"align-middle ml-1 scale-75"} checkedIcon={false} uncheckedIcon={false}/>
        </div>
    )
}