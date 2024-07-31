import {Card} from "../../../server/shared/card";
import {
    DndContext,
    DragEndEvent, DragOverlay, DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import {SortableCard} from "./SortableCard";
import {useEffect, useState} from "react";
import {CardComponent} from "./CardComponent";

export default function CardsList({cards, selectedCardMask, setSelectedCardMask, cardOrder, setCardOrder}: {
    cards: Card[];
    selectedCardMask: ReturnType<typeof useState<Array<boolean>>>[0],
    setSelectedCardMask: ReturnType<typeof useState<Array<boolean>>>[1],
    cardOrder: ReturnType<typeof useState<Array<number>>>[0],
    setCardOrder: ReturnType<typeof useState<Array<number>>>[1],
}) {
    const [activeId, setActiveId] = useState<number>();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragStart(event: DragStartEvent) {
        const {active} = event;

        setActiveId(active.id as number);
    }

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (!over) return;

        if (active.id !== over.id) {
            setCardOrder((prevOrder) => {
                const oldIndex = prevOrder.indexOf(active.id as number);
                const newIndex = prevOrder.indexOf(over.id as number);

                return arrayMove(prevOrder, oldIndex, newIndex);
            });
        }

        setActiveId(null);
    }

    let [handSizeMargin, setHandSizeMargin] = useState(1);

    const handleResize = () => {
        console.log(cards.length*144, window.innerWidth*0.8)

        if (cards.length * 144 > 0.8 * window.innerWidth) {
            let excess = 0.8 * window.innerWidth - cards.length * 144;
            let gaps = cards.length - 1;
            let removePerGap = excess / gaps;
            setHandSizeMargin(removePerGap / 2);
        } else {
            setHandSizeMargin(1);
        }
    }

    useEffect(() => {
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, []);

    let [prevLength, setPrevLength] = useState(0);
    if (prevLength !== cards.length) {
        setPrevLength(cards.length);
        handleResize();
    }

    return (
        <div className={"flex flex-row justify-center"}>
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={cardOrder}
                    strategy={horizontalListSortingStrategy}
                >
                    {cardOrder.map((index) => (
                        <SortableCard key={index} card={cards[index - 1]} id={index} onclick={() => {
                            let newSelectedCardMask = structuredClone(selectedCardMask);
                            newSelectedCardMask[index - 1] = !selectedCardMask[index - 1];
                            setSelectedCardMask(newSelectedCardMask);
                        }}
                                      className={"transition-transform " + (selectedCardMask[index - 1] ? "-translate-y-3" : "") + " " + (activeId === index ? "opacity-30" : "")}
                                      style={{
                                          marginLeft: handSizeMargin,
                                          marginRight: handSizeMargin,
                                      }}
                        />
                    ))}
                </SortableContext>
                <DragOverlay>
                    {activeId ? <CardComponent card={cards[activeId - 1]}/> : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}