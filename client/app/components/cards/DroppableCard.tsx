import {Card} from "../../../../server/shared/card";
import CardComponent from "./CardComponent";
import {DragOverEvent, useDndMonitor} from "@dnd-kit/core";
import {useState} from "react";
import {cardSeparation, fanAngleZOffset, initialAngleX, initialAngleZ} from "../../utility/constants";

/**
 * Hovering card visual overlay to be dragged around
 *
 * @param card The type of card being dragged
 * @param selectedCards All selected cards to be rendered over the drop zone
 */
export default function DroppableCard({card, selectedCards}: { card: Card, selectedCards: Card[] }) {
    const [overDiscardPile, setOverDiscardPile] = useState(false);

    useDndMonitor({
        onDragOver(event: DragOverEvent) {
            if (!event.over) return;
            if (event.over.id == 'discard-pile') {
                setOverDiscardPile(true);
            } else {
                setOverDiscardPile(false);
            }
        },
        onDragEnd() {
            setOverDiscardPile(false);
        }
    })

    return (
        <div className={"min-w-36 min-h-[201px]"}> {/* Ensure the overlay still has dimensions when the cards are transformed and absolutely positioned */}
            {
                overDiscardPile ? selectedCards.map((selectedCard, i) => (
                    <CardComponent card={selectedCard} key={selectedCard} style={{
                        transform: `
                            rotate3d(1,0,0,${initialAngleX}deg)
                            rotate3d(0,0,1,${initialAngleZ + i * fanAngleZOffset}deg)
                            translateZ(${i * cardSeparation}px)`
                    }} className={"transition-transform absolute"}/>
                )) : <CardComponent card={card} key={card} className={"transition-transform"}/>
            }
        </div>
    )
}