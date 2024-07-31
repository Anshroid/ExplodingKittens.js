import {CardComponent} from "./CardComponent";
import {Card} from "../../../server/shared/card";
import {useState} from "react";
import {useColyseusState} from "../utility/contexts";

export default function Deck({drawCallback, drawDisabled}: { drawCallback: () => void, drawDisabled: boolean }) {
    let [angleX, setAngleX] = useState(80);
    let [angleZ, setAngleZ] = useState(25);
    let [angleZOffset, setAngleZOffset] = useState(0);
    let [topCardTranslate, setTopCardTranslate] = useState([0,0,0]);

    let cardsInDeck = useColyseusState(state => state.deckLength);

    let tmp = new Map<number, Array<number>>()
    for (let i = 0; i < cardsInDeck; i++) {
        tmp.set(i, [0, 0])
    }
    let [shufflePositions, setShufflePositions] = useState(tmp);

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
                                    translate3d(${shufflePositions.get(i)[0]}px, ${shufflePositions.get(i)[1]}px, ${i * 1.5}px)`,
                        perspective: "1000px"
                    }} className={"absolute transition-transform"} key={i}/>
                ))}

                <CardComponent card={Card.TACOCAT} style={{
                    transform: `rotate3d(1,0,0,${angleX}deg) 
                                rotate3d(0,0,1,${angleZ + (cardsInDeck - 1) * angleZOffset}deg) 
                                translate3d(${shufflePositions.get(cardsInDeck - 1)[0]}px, ${shufflePositions.get(cardsInDeck - 1)[1]}px, ${(cardsInDeck - 1) * 1.5}px)
                                translate3d(${topCardTranslate.join("px, ")}px)`,
                    perspective: "1000px"
                }} className={"absolute transition-transform " + (drawDisabled ? "" : "cursor-pointer")} onMouseOver={() => {
                    if (!drawDisabled) setTopCardTranslate([0,0,10])
                }} onMouseOut={() => setTopCardTranslate([0,0,0])} onClick={() => {
                    setTopCardTranslate([0,0,0]);
                    drawCallback();
                }}/>
            </div>
            <input type={"range"} min={0} max={360} value={angleX}
                   onChange={(e) => setAngleX(parseInt(e.target.value))}/>
            <input type={"range"} min={0} max={360} value={angleZ}
                   onChange={(e) => setAngleZ(parseInt(e.target.value))}/>
            <button onClick={() => {
                setAngleX(0);
                setAngleZ(0);


                for (let i = 0; i < cardsInDeck; i++) {
                    setTimeout(() => {
                        setShufflePositions(current => new Map(current.set(i, [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)])))
                    }, 200 + i * 10)

                    setTimeout(() => {
                        setShufflePositions(current => new Map(current.set(i, [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)])))
                    }, 500 + i * 10)

                    setTimeout(() => {
                        setShufflePositions(current => new Map(current.set(i, [(Math.random() - 0.5) * (0.8 * visualViewport.width), (Math.random() - 0.5) * (0.6 * visualViewport.height)])))
                    }, 800 + i * 10)

                    setTimeout(() => {
                        setShufflePositions(current => new Map(current.set(i, [0, 0])));
                    }, 1000 + (i * 10))
                }

                setTimeout(() => {
                    setAngleX(80);
                    setAngleZ(25)
                }, 1200 + cardsInDeck * 10)
            }}>shuffle
            </button>
        </div>
    )
}