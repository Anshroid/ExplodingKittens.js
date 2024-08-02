import {CardComponent} from "./CardComponent";
import {Card} from "../../../server/shared/card";
import {useEffect, useRef, useState} from "react";
import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {
    cardSeparation,
    fanAngleX,
    fanAngleZOffset,
    fanLimit,
    initialAngleX,
    initialAngleZ,
    randomOffsetFactor, topCardHoverZ
} from "../utility/constants";

export default function Deck({drawCallback, drawDisabled}: { drawCallback: () => void, drawDisabled: boolean }) {
    let [angleX, setAngleX] = useState(initialAngleX);
    let [angleZ, setAngleZ] = useState(initialAngleZ);
    let [angleZOffset, setAngleZOffset] = useState(0);
    let [topCardTranslate, setTopCardTranslate] = useState([0, 0, 0]);
    let [drawing, setDrawing] = useState(false);
    let [suspendTransition, setSuspendTransition] = useState(false);

    let cardsInDeck = useColyseusState(state => state.deckLength);
    let [lastCardsInDeck, setLastCardsInDeck] = useState(0);

    if (lastCardsInDeck !== cardsInDeck) {
        setLastCardsInDeck(cardsInDeck);

        if (suspendTransition) {
            setTopCardTranslate([0, 0, 0]);
            setDrawing(false);
        }
    }

    let [shufflePositions, setShufflePositions] = useState(new Array(cardsInDeck).fill(0).map(_ => [0, 0]));
    let randomOffsets = useRef(new Array(cardsInDeck).fill(0).map(_ => [(Math.random() - 0.5) * randomOffsetFactor, (Math.random() - 0.5) * randomOffsetFactor]));

    let distanceToImplosion = useColyseusState(state => state.distanceToImplosion);
    let implosionIndex = (cardsInDeck - 1) - distanceToImplosion;

    if (!cardsInDeck) return <div className="relative flex flex-col place-items-center h-60 w-60"/>;

    let room = useColyseusRoom();
    useEffect(() => {
        if (room) {
            room.onMessage("shuffled", () => {
                shuffle();
            });
        }
    }, []);

    return (
        <div className={"h-60 w-60 p-12"} onMouseOver={() => {
            if (cardsInDeck < fanLimit) {
                setAngleX(fanAngleX);
                setAngleZOffset(fanAngleZOffset);
            }
        }} onMouseOut={() => {
            if (cardsInDeck < fanLimit) {
                setAngleX(initialAngleX);
                setAngleZOffset(0);
            }
        }}>
            {new Array(cardsInDeck - 1).fill(0).map((_, i) => (
                <CardComponent card={i === implosionIndex ? Card.IMPLODING : Card.BACK} style={{
                    transform: `rotate3d(1,0,0,${angleX}deg) 
                                    rotate3d(0,0,1,${angleZ + i * angleZOffset}deg)
                                    translate3d(${randomOffsets.current[i].join("px, ")}px, 0)
                                    translate3d(${shufflePositions[i].join("px, ")}px, ${i * cardSeparation}px)`,
                    perspective: "1000px"
                }} className={"absolute transition-transform border-[1px] border-[#f5e7d9]"} key={i}/>
            ))}

            <CardComponent card={distanceToImplosion === 0 ? Card.IMPLODING : Card.BACK}
                           style={{
                               transform: `rotate3d(1,0,0,${drawing ? 0 : angleX}deg) 
                                   rotate3d(0,0,1,${drawing ? 0 : angleZ + (cardsInDeck - 1) * angleZOffset}deg) 
                                   translate3d(${shufflePositions[cardsInDeck - 1][0]}px, ${shufflePositions[cardsInDeck - 1][1]}px, ${(cardsInDeck - 1) * cardSeparation}px)
                                   translate3d(${topCardTranslate.join("px, ")}px)`,
                               perspective: "1000px"
                           }}
                           className={"absolute border-[1px] border-[#f5e7d9] " + (suspendTransition ? "" : "transition-transform ") + (drawDisabled ? "" : "cursor-pointer")}
                           onMouseOver={() => {
                               if (!drawDisabled && !drawing) setTopCardTranslate([0, 0, topCardHoverZ])
                           }}
                           onMouseOut={() => {
                               if (!drawing) setTopCardTranslate([0, 0, 0])
                           }}

                           onClick={() => {
                               if (drawDisabled) return;

                               setDrawing(true);
                               setTopCardTranslate([0, 0, 0]);

                               setTimeout(() => {
                                   setTopCardTranslate([0, window.innerHeight * 0.8, 0]);
                               }, 300)

                               setTimeout(() => {
                                   setSuspendTransition(true);
                                   drawCallback();
                               }, 700)

                               setTimeout(() => {
                                   setSuspendTransition(false);
                               }, 1000) // TODO: automatic?
                           }}
            />
        </div>
    )

    function shuffle() {
        setAngleX(0);
        setAngleZ(0);

        randomOffsets.current = new Array(cardsInDeck).fill(0).map(_ => [(Math.random() - 0.5) * randomOffsetFactor, (Math.random() - 0.5) * randomOffsetFactor]);


        for (let i = 0; i < cardsInDeck; i++) {
            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.6 * window.innerWidth), (Math.random() - 0.5) * (0.8 * window.innerHeight)]))
            }, 200 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.6 * window.innerWidth), (Math.random() - 0.5) * (0.6 * window.innerHeight)]))
            }, 500 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.6 * window.innerWidth), (Math.random() - 0.5) * (0.6 * window.innerHeight)]))
            }, 800 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [0, 0]));
            }, 1000 + (i * 10))
        }

        setTimeout(() => {
            setAngleX(initialAngleX);
            setAngleZ(initialAngleZ)
        }, 1200 + cardsInDeck * 10)
    }
}

