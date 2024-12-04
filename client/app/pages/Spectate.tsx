import Deck from "../components/game/Deck";
import {TurnState} from "../../../server/shared/util";
import Discard from "../components/game/Discard";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";

export default function Spectate() {
    let room = useColyseusRoom();
    if (room == undefined) return;

    let turnState = useColyseusState(state => state.turnState);
    let turnIndex = useColyseusState(state => state.turnIndex);
    if (turnIndex === undefined) return;

    let playerIndexMap = useColyseusState(state => state.playerIndexMap)
    if (playerIndexMap == undefined) return;

    let players = useColyseusState(state => state.players);
    if (players == undefined) return;

    let spectators = useColyseusState(state => state.spectators);
    if (spectators == undefined) return;

    let turnRepeats = useColyseusState(state => state.turnRepeats);

    return (
        <>
            <div className={"flex items-center text-center justify-center h-full"}>
                <div className={"justify-center flex-none"}>
                    <h1 className={"font-bold underline"}>You are spectating!</h1>

                    <br/>

                    <p>Players: {players.map(player => player.displayName).join(", ")}</p>
                    {spectators.length > 0 ? <p>Spectators: {spectators.map(player => player.displayName).join(", ")}</p> : null}

                    <br/>

                    <p>Turn state: {turnState}</p>
                    <p>{"It's " + players.at(turnIndex).displayName + "'s turn x" + turnRepeats}</p>

                    <br/>

                    <div className={"flex flex-row justify-center gap-20"}>
                        <Deck drawCallback={() => room.send("drawCard")}
                              drawDisabled={turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}/>

                        <Discard/>
                    </div>
                </div>
            </div>
        </>
    )
}