import {CardComponent} from "./CardComponent";
import {useRef, useState} from "react";
import {useColyseusState} from "../utility/contexts";
import {
    cardSeparation,
    fanAngleX,
    fanAngleZOffset,
    initialAngleX,
    initialAngleZ,
    randomOffsetFactor
} from "../utility/constants";

export default function Discard() {
    let [angleX, setAngleX] = useState(initialAngleX);
    let [angleZOffset, setAngleZOffset] = useState(0);

    let randomOffsets = useRef<number[][]>([]);
    let randomRotations = useRef<number[]>([]);

    let discard = useColyseusState(state => state.discard);

    while (randomOffsets.current.length < discard.toJSON().length) {
        randomOffsets.current = randomOffsets.current.concat([[(Math.random() - 0.5) * randomOffsetFactor, (Math.random() - 0.5) * randomOffsetFactor]]);
        randomRotations.current = randomRotations.current.concat([Math.random() * 335]);
    }

    while (randomOffsets.current.length > discard.toJSON().length) {
        randomOffsets.current = randomOffsets.current.filter((_, i) => i === randomOffsets.current.length - 1);
        randomRotations.current = randomRotations.current.filter((_, i) => i === randomRotations.current.length - 1);
    }

    if (!discard) return <div className="relative flex flex-col place-items-center h-60 w-60"/>;

    return (
        <div className="relative flex flex-col place-items-center">
            <div className={"h-60 w-60 p-12"} onMouseOver={() => {
                setAngleX(fanAngleX);
                setAngleZOffset(fanAngleZOffset);
            }} onMouseOut={() => {
                setAngleX(initialAngleX);
                setAngleZOffset(0);
            }}>
                {discard.map((card, i) => (
                    <CardComponent card={card} style={{
                        transform: `rotate3d(1,0,0,${angleX}deg) 
                                    rotate3d(0,0,1,${angleZOffset ? initialAngleZ + i * angleZOffset : randomRotations.current[i]}deg)
                                    translate3d(${randomOffsets.current[i].join("px, ")}px, ${i * cardSeparation}px)`,
                        perspective: "1000px"
                    }} className={"absolute transition-transform border-[1px] border-[#f5e7d9] card-fall"} key={i}/>
                ))}
            </div>
        </div>
    )
}

