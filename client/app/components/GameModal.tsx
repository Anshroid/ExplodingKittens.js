import {useState} from "react";
import TargetPlayer from "./TargetPlayer";
import {TargetCard} from "./TargetCard";
import {TargetDiscard} from "./TargetDiscard";
import {ChoosePosition} from "./ChoosePosition";
import {Card} from "../../../server/shared/card";
import {Favour} from "./Favour";
import {SeeTheFuture} from "./SeeTheFuture";

export function GameModal({type, cardCallback, closeCallback, theFuture}: { type: string, cardCallback: (targetSessionId?: string, targetCard?: Card, targetIndex?: number) => void, closeCallback: () => void, theFuture: Card[]}) {
    let [tempPlayerStorage, setTempPlayerStorage] = useState<string>("");

    return (
        <div className="relative z-10">
            <div // Screen overlay
                className={"fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity "
                    + (type === "" ? "ease-in duration-200 opacity-0 pointer-events-none" : "ease-out duration-300 opacity-100")}></div>


            <div className={"fixed inset-0 z-10 w-screen overflow-y-auto " + (type === "" ? "pointer-events-none" : "")}>
                <div className={"flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0 " + (type === "" ? "pointer-events-none" : "")}>
                    <div
                        className={"relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg "
                            + (type === "" ? "ease-in duration-200 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 pointer-events-none" : "ease-out duration-300 opacity-100 translate-y-0 sm:scale-100")}>
                        <div className={"bg-gray-600 px-4 pb-4 pt-4"}>
                            <div className={"text-center sm:ml-4 sm:mt-0 sm:text-left"}>
                                <h3 className={"text-base font-semibold leading-6"}>{
                                    (() => {
                                        switch (type) {
                                            case "targetPlayer":
                                                return "Choose a Player!";
                                            case "targetCard":
                                                return "Choose a Card!";
                                            case "targetDiscard":
                                                return "Choose a Card!";
                                            case "choosePosition":
                                                return "Choose a Position!";
                                            case "favour":
                                                return "Choose a Card!";
                                            case "theFuture":
                                                return "Here's the future!"
                                        }
                                        return "";
                                    })()
                                }</h3>
                                {
                                    (() => {
                                        switch (type) {
                                            case "targetPlayer":
                                                return <TargetPlayer callback={sessionId => {setTempPlayerStorage(sessionId); cardCallback(sessionId)}}/>
                                            case "targetCard":
                                                return <TargetCard callback={cardId => cardCallback(tempPlayerStorage, cardId)}/>
                                            case "targetDiscard":
                                                return <TargetDiscard callback={index => cardCallback(undefined, undefined, index)}/>
                                            case "choosePosition":
                                                return <ChoosePosition callback={closeCallback}/>
                                            case "favour":
                                                return <Favour callback={closeCallback}/>
                                            case "theFuture":
                                                return <SeeTheFuture theFuture={theFuture} callback={closeCallback}/>
                                        }
                                        return "";
                                    })()
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}