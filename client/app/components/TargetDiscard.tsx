import {useColyseusState} from "../utility/contexts";
import {CardNames} from "../../../server/shared/card";

export function TargetDiscard({callback}: {callback: (targetIndex: number) => void}) {
    let discard = useColyseusState(state => state.discard);
    if (discard === undefined) return;

    return (
        <ul>
            {discard.map((card, index) =>
                <li key={index}>
                    <button onClick={() => callback(index)}>{CardNames.get(card)}</button>
                </li>
            )}
        </ul>
    );
}