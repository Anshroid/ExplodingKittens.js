import {useColyseusRoom, useColyseusState} from "../../utility/contexts";
import {CardNames} from "../../../../server/shared/card";

/**
 * Displays the modal contents to choose a card to give away to another player. Sends the message to colyseus as well.
 *
 * @param callback Function to call when choosing is done
 * @constructor
 */
export default function Favour({callback}: { callback: () => void }) {
    let room = useColyseusRoom();

    let playerIndexMap = useColyseusState(state => state.playerIndexMap) ?? new Map();
    let players = useColyseusState(state => state.players) ?? [];
    let ourIndex = room ? playerIndexMap.get(room.sessionId) : -1;
    let cardsSchema = players.at(ourIndex)?.cards;
    let cards = cardsSchema ? cardsSchema.toArray() : [];

    return (
        <>
            <ul>
                {cards.map((card, index) => {
                    return <li key={index}>
                        <button onClick={() => {
                            room && room.send("favourResponse", {card: card});
                            callback();
                        }}>{CardNames.get(card)}</button>
                    </li>
                })}
            </ul>
        </>
    )
}