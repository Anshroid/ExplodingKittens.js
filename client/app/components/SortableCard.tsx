import {Card, CardNames} from "../../../server/shared/card";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';

export function SortableCard({card, id}: { card: Card, id: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id: id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {CardNames.get(card)}
        </div>
    );
}