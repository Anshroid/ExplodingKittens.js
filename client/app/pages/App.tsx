import Lobby from "./Lobby";
import Game from "./Game";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import Spectate from "./Spectate";

export default function App() {
    const started = useColyseusState((state) => state.started);

    let room = useColyseusRoom();
    let playerIndexMap = useColyseusState(state => state.playerIndexMap)
    let ourIndex = playerIndexMap.get(room.sessionId);
    if (ourIndex === undefined) return;

    const spectating = ourIndex === -1;

    return (
        <>
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