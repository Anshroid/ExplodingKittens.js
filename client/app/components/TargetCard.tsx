import {Card, CardNames} from "../../../server/shared/card";
import {CardComponent} from "./CardComponent";

export function TargetCard({callback}: { callback: (cardId: Card) => void }) {
    return (
        <div className="flex flex-row gap-1 flex-wrap">
            {Array.from(CardNames.keys()).map(cardId =>
                <div key={cardId}>
                    <button onClick={() => callback(cardId)}><CardComponent card={cardId}/></button>
                </div>
                )}
        </div>
    );
}