import {useEffect, useState} from "react";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {CardNames} from "../../../server/shared/card";

export default function TargetInfobox() {
    let [message, setMessage] = useState('');

    let room = useColyseusRoom();
    let players = useColyseusState(state => state.players);

    useEffect(() => {
        room.onMessage("cardTarget", message => {
            setMessage(`Targeted at ${players.at(message.target).displayName}!`);
        });

        room.onMessage("comboTarget", message => {
            switch (message.numCards) {
                case 2:
                    setMessage(`Targeted at ${players.at(message.target).displayName}!`);
                    break;
                case 3:
                    setMessage(`Targeted at ${players.at(message.target).displayName}, for ${CardNames.get(message.targetCard)}`);
                    break;
                case 5:
                    setMessage(`Looking for ${CardNames.get(message.targetCard)}!`);
            }
        });
    }, []);

    return (
        <div className={"w-36 h-10 absolute top-4 bg-red-800 rounded-lg transition-opacity " + (message ? "opacity-100" : "opacity-0")}>
            <p>{message}</p>
        </div>
    )
}