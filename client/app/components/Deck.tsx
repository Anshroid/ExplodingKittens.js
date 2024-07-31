import {CardComponent} from "./CardComponent";
import {Card} from "../../../server/shared/card";
import {useRef, useState} from "react";
import {useColyseusState} from "../utility/contexts";

export default function Deck({drawCallback, drawDisabled}: { drawCallback: () => void, drawDisabled: boolean }) {
    let [angleX, setAngleX] = useState(80);
    let [angleZ, setAngleZ] = useState(25);
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

    let randomOffsets = useRef(new Array(cardsInDeck).fill(0).map(_ => [Math.random() * 3, Math.random() * 3]));

    return (
        <div className="relative flex flex-col place-items-center">
            <div className={"h-40 w-40"} onMouseOver={() => {
                if (cardsInDeck < 10) {
                    setAngleX(40);
                    setAngleZOffset(-10);
                }
            }} onMouseOut={() => {
                if (cardsInDeck < 10) {
                    setAngleX(80);
                    setAngleZOffset(0);
                }
            }}>
                {new Array(cardsInDeck - 1).fill(0).map((_, i) => (
                    <CardComponent card={Card.TACOCAT} style={{
                        transform: `rotate3d(1,0,0,${angleX}deg) 
                                    rotate3d(0,0,1,${angleZ + i * angleZOffset}deg)
                                    translate3d(${randomOffsets.current[i].join("px, ")}px, 0)
                                    translate3d(${shufflePositions[i].join("px, ")}px, ${i * 1.5}px)`,
                        perspective: "1000px"
                    }} className={"absolute transition-transform"} key={i}/>
                ))}

                <CardComponent card={Card.TACOCAT}
                               style={{
                                   transform: `rotate3d(1,0,0,${drawing ? 0 : angleX}deg) 
                                               rotate3d(0,0,1,${drawing ? 0 : angleZ + (cardsInDeck - 1) * angleZOffset}deg) 
                                               translate3d(${shufflePositions[cardsInDeck - 1][0]}px, ${shufflePositions[cardsInDeck - 1][1]}px, ${(cardsInDeck - 1) * 1.5}px)
                                               translate3d(${topCardTranslate.join("px, ")}px)`,
                                   perspective: "1000px"
                               }}
                               className={"absolute " + (suspendTransition ? "" : "transition-transform ") + (drawDisabled ? "" : "cursor-pointer")}
                               onMouseOver={() => {
                                   if (!drawDisabled && !drawing) setTopCardTranslate([0, 0, 10])
                               }} onMouseOut={() => {
                    if (!drawing) setTopCardTranslate([0, 0, 0])
                }}

                               onClick={() => {
                                   if (drawDisabled) return;

                                   setDrawing(true);
                                   setTopCardTranslate([0, 0, 0]);

                                   setTimeout(() => {
                                       setTopCardTranslate([0, visualViewport.height * 0.8, 0]);
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
        </div>
    )

    function shuffle() {
        setAngleX(0);
        setAngleZ(0);

        randomOffsets.current = new Array(cardsInDeck).fill(0).map(_ => [Math.random() * 3, Math.random() * 3]);


        for (let i = 0; i < cardsInDeck; i++) {
            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)]))
            }, 200 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)]))
            }, 500 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)]))
            }, 800 + i * 10)

            setTimeout(() => {
                setShufflePositions(current => current.map((pos, idx) => idx !== i ? pos : [0, 0]));
            }, 1000 + (i * 10))
        }

        setTimeout(() => {
            setAngleX(80);
            setAngleZ(25)
        }, 1200 + cardsInDeck * 10)
    }
}

