import {Card, CardNames} from "../../../server/shared/card";

export function TargetCard({callback}: { callback: (cardId: Card) => void }) {
    return (
        <ul>
            {Array.from(CardNames.keys()).map(cardId =>
                <li key={cardId}>
                    <button onClick={() => callback(cardId)}>{CardNames.get(cardId)}</button>
                </li>
                )}
        </ul>
    );
}