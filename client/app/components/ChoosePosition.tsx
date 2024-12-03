import React from "react";
import ChoosePositionDeck from "./ChoosePositionDeck";

export function ChoosePosition({callback}: { callback: () => void }) {
    return (
        <div className={"w-full h-full flex justify-center align-middle"}>
            <ChoosePositionDeck doneCallback={callback}/>
        </div>
    )
}