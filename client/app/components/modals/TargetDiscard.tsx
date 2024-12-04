import {useColyseusState} from "../../utility/contexts";
import {Card} from "../../../../server/shared/card";
import CardComponent from "../cards/CardComponent";

/**
 * Displays the modal contents listing all cards in the discard pile so one can be picked
 *
 * @param callback Function to call with the selected card
 * @constructor
 */
export default function TargetDiscard({callback}: { callback: (targetCard: Card) => void }) {
    let discard = useColyseusState(state => state.discard);
    if (discard === undefined) return;

    return (
        <ul>
            {discard.map((card, index) =>
                <button onClick={() => callback(card)} key={index}><CardComponent card={card}/></button>
            )}
        </ul>
    );
}