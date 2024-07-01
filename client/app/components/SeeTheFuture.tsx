import {Card} from "../../../server/shared/card";
import {useState} from "react";
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {SortableCard} from "./SortableCard";
import {useColyseusRoom} from "../utility/contexts";


export function SeeTheFuture({alter, theFuture, callback}: { alter: boolean, theFuture: Card[], callback: () => void }) {
    let room = useColyseusRoom();

    if (!room) return;

    let [reorderedFuture, setReorderedFuture] = useState(theFuture);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor)
    );

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        if (!over) return;

        if (active.id !== over.id) {
            setReorderedFuture((cards) => {
                const oldIndex = active.id as number;
                const newIndex = over.id as number;

                return arrayMove(reorderedFuture, oldIndex, newIndex);
            });
        }
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={[0, 1, 2]}
                    strategy={verticalListSortingStrategy}
                    disabled={!alter}
                >
                    {reorderedFuture.map((card, index) => (
                        <SortableCard key={index} card={card} id={index}/>
                    ))}
                </SortableContext>
            </DndContext>

            <button onClick={() => {
                if (alter) {
                    room.send("alterTheFuture", {cards: reorderedFuture})
                }
                callback();
            }}>OK!</button>
        </>
    )
}