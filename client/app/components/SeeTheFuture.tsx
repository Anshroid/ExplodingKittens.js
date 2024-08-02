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
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {SortableCard} from "./SortableCard";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {TurnState} from "../../../server/shared/util";


export function SeeTheFuture({theFuture, callback}: { theFuture: Card[], callback: () => void }) {
    let room = useColyseusRoom();
    let turnState = useColyseusState(state => state.turnState);

    if (!room || turnState === undefined) return;

    let alter = turnState === TurnState.AlteringTheFuture;

    let [indices, setIndices] = useState([1, 2, 3]);
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
            setIndices((indices) => {
                const oldIndex = indices.indexOf(active.id as number);
                const newIndex = indices.indexOf(over.id as number);

                return arrayMove(indices, oldIndex, newIndex);
            });
        }
    }

    return (
        <>
            <div className={"flex flex-row"}>
                <DndContext
                    sensors={sensors}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={indices}
                        strategy={horizontalListSortingStrategy}
                        disabled={!alter}
                    >
                        {indices.map((index) => (
                            <SortableCard key={index} card={theFuture[index - 1]} id={index}/>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            <button onClick={() => {
                if (alter) {
                    room.send("alterTheFuture", {cards: indices.map(index => theFuture[index - 1])})
                }
                callback();
            }}>OK!
            </button>
        </>
    )
}