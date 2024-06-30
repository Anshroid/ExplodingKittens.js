import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {CardNames} from "../../../server/shared/card";

export function Favour({callback}: { callback: () => void }) {
    let players = useColyseusState((state) => state.players);
    let playerIndexMap = useColyseusState((state) => state.playerIndexMap)
    let room = useColyseusRoom();

    if (!players || !playerIndexMap || !room) return;

    let ourIndex = playerIndexMap.get(room.sessionId);
    if (ourIndex === undefined) return;

    let cards = players.at(ourIndex)?.cards;
    if (!cards) return;



    return (
        <>
            <ul>
                {cards.map((card, index) => {
                    return <li key={index}>
                        <button onClick={() => {
                            room.send("favourResponse", {card: card});
                            callback();
                        }}>{CardNames.get(card)}</button>
                    </li>
                })}
            </ul>
        </>
    )
}