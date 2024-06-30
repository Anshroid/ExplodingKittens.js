import {Card, CardNames} from "../../../server/shared/card";

export default function CardsList({cards, selectedIndices, setSelectedIndices}: {
    cards: Card[];
    selectedIndices: Array<number>,
    setSelectedIndices: (selectedIndices: Array<number>) => void
}) {
    return (
        <>
            <ul>
                {cards.map((card, index) => {
                    return <li key={index}>
                        <button onClick={() => {
                            if (selectedIndices.includes(index)) {
                                setSelectedIndices(selectedIndices.filter((c) => c !== index));
                            } else {
                                setSelectedIndices(selectedIndices.concat(index));
                            }
                        }}
                                className={selectedIndices.includes(index) ? "bg-amber-400" : ""}>{CardNames.get(card)}</button>
                    </li>
                })}
            </ul>
        </>
    )
}