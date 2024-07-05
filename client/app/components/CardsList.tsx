import {Card, CardNames} from "../../../server/shared/card";

export default function CardsList({cards, selectedCardMask, setSelectedCardMask}: {
    cards: Card[];
    selectedCardMask: Array<boolean>,
    setSelectedCardMask: (selectedIndices: Array<boolean>) => void
}) {
    return (
        <>
            <ul>
                {cards.map((card, index) => {
                    return <li key={index}>
                        <button onClick={() => {
                            const temp = structuredClone(selectedCardMask);
                            temp.splice(index, 1, !temp[index])
                            setSelectedCardMask(temp);
                        }}
                                className={selectedCardMask[index] ? "bg-amber-400" : ""}>{CardNames.get(card)}</button>
                    </li>
                })}
            </ul>
        </>
    )
}