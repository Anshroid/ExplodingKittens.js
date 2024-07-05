import {Card} from "../../../server/shared/card";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import {HTMLAttributes} from "react";
import {CardComponent} from "./CardComponent";

export function SortableCard({card, id, onclick, ...props}: {
    card: Card,
    id: number
    onclick?: () => void
} & Omit<HTMLAttributes<HTMLDivElement>, "id">) {
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
        <div {...props}>
            <CardComponent ref={setNodeRef} style={style} card={card} {...attributes} {...listeners} onClick={onclick}/>
        </div>
    );
}