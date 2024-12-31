import Lobby from "./Lobby";
import Game from "./Game";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import Spectate from "./Spectate";
import Banner from "../../static/background.png";

export default function App() {
    const started = useColyseusState((state) => state.started);

    let room = useColyseusRoom();
    if (room == undefined) return;

    let playerIndexMap = useColyseusState(state => state.playerIndexMap)
    if (playerIndexMap == undefined) return;

    let ourIndex = playerIndexMap.get(room.sessionId);
    if (ourIndex === undefined) return;

    const spectating = ourIndex === -1;

    return (
        <>
            <img src={Banner} alt={"background image"} className={"absolute -z-40 h-full w-full object-cover"}/>
            {started ?
                (spectating ?
                        <Spectate/>
                        :
                        <Game/>
                )
                : // Use lobby if either no connection has been made or the game is not started
                <Lobby/>
            }
        </>
    )
}