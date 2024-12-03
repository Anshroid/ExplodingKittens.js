import {useColyseusState} from "../utility/contexts";
import {Card} from "../../../server/shared/card";
import {CardComponent} from "./CardComponent";

export function TargetDiscard({callback}: { callback: (targetCard: Card) => void }) {
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