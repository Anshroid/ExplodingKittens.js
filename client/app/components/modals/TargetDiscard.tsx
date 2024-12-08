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
        <div className="flex flex-row gap-1 flex-wrap justify-center">
            {discard.map((card, index) =>
                <div key={index}>
                    <button onClick={() => callback(card)}><CardComponent card={card}/></button>
                </div>
            )}
        </div>
    );
}