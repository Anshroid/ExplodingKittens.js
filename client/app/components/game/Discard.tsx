import CardComponent from "../cards/CardComponent";
import {useContext, useRef, useState} from "react";
import {LocalStorageContext, useColyseusState} from "../../utility/contexts";
import {
    cardSeparation,
    fanAngleX,
    fanAngleZOffset,
    initialAngleX,
    initialAngleZ,
    randomOffsetFactor
} from "../../utility/constants";
import TargetInfobox from "./TargetInfobox";
import {useDroppable} from "@dnd-kit/core";

/**
 * Visual discard pile showing all cards randomly rotated. Fans out at any point to show top cards.
 *
 * @constructor
 */
export default function Discard() {
    let [angleX, setAngleX] = useState(initialAngleX);
    let [angleZOffset, setAngleZOffset] = useState(0);

    let randomOffsets = useRef<number[][]>([]);
    let randomRotations = useRef<number[]>([]);

    let discardSchema = useColyseusState(state => state.discard);
    let discard = discardSchema ? discardSchema.toArray() : [];

    while (randomOffsets.current.length < discard.length) {
        randomOffsets.current = randomOffsets.current.concat([[(Math.random() - 0.5) * randomOffsetFactor, (Math.random() - 0.5) * randomOffsetFactor]]);
        randomRotations.current = randomRotations.current.concat([Math.random() * 335]);
    }

    while (randomOffsets.current.length > discard.length) {
        randomOffsets.current = randomOffsets.current.filter((_, i) => i !== randomOffsets.current.length - 1);
        randomRotations.current = randomRotations.current.filter((_, i) => i !== randomRotations.current.length - 1);
    }

    const {setNodeRef} = useDroppable({
        id: "discard-pile"
    })

    const showTooltips = useContext(LocalStorageContext).showTooltips;

    if (!discard) return <div className="relative flex flex-col place-items-center h-60 w-60"/>;

    return (
        <div className={"md:h-52 md:w-56 h-40 w-40 p-12 relative"} onMouseOver={() => {
            setAngleX(fanAngleX);
            setAngleZOffset(fanAngleZOffset);
        }} onMouseOut={() => {
            setAngleX(initialAngleX);
            setAngleZOffset(0);
        }} ref={setNodeRef}>
            <TargetInfobox/>

            {discard.map((card, i) => (
                <CardComponent card={card} showTooltips={showTooltips} style={{
                    transform: `
                        rotate3d(1,0,0,${angleX}deg) 
                        rotate3d(0,0,1,${angleZOffset ? initialAngleZ + i * angleZOffset : randomRotations.current[i]}deg)
                        translate3d(${randomOffsets.current[i].join("px, ")}px, ${i * cardSeparation}px)`,
                    perspective: "1000px"
                }} className={"absolute transition-transform card-fall"} key={i}/>
            ))}
        </div>
    )
}

