import {LocalStorageContext, useColyseusRoom, useColyseusState} from "../../utility/contexts";
import CardComponent from "../cards/CardComponent";
import {useContext} from "react";

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

    const showTooltips = useContext(LocalStorageContext).showTooltips;

    return (
        <div className="flex flex-row gap-1 flex-wrap justify-center">
            {cards.map((card, index) =>
                <div key={index}>
                    <button onClick={() => {
                        room && room.send("favourResponse", {card: card});
                        callback();
                    }}><CardComponent card={card} showTooltips={showTooltips}/></button>
                </div>
            )}
        </div>
    )
}