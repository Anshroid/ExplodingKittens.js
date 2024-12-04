import {useState} from "react";
import TargetPlayer from "../modals/TargetPlayer";
import TargetCard from "../modals/TargetCard";
import TargetDiscard from "../modals/TargetDiscard";
import ChoosePosition from "../modals/ChoosePosition";
import {Card} from "../../../../server/shared/card";
import Favour from "../modals/Favour";
import SeeTheFuture from "../modals/SeeTheFuture";

export enum ModalType {
    TargetPlayer,
    TargetCard,
    TargetDiscard,
    ChoosePosition,
    Favour,
    TheFuture,
    None
}

/**
 * Displays a modal to provide information to or get information from the player. Always rendering, but only appears when needed.
 *
 * @param type What type of modal to display (the modal disappears if the type is None)
 * @param playCallback Function to call if a decision is made that needs to be passed to the play routine
 * @param closeCallback Function to call to close the modal
 * @param theFuture The cards that are in the future
 * @constructor
 */
export default function GameModal({type, playCallback, closeCallback, theFuture}: { type: ModalType, playCallback: (targetSessionId?: string, targetCard?: Card) => void, closeCallback: () => void, theFuture: Card[]}) {
    let [tempPlayerStorage, setTempPlayerStorage] = useState<string>("");
    return (
        <div className="relative z-10">
            <div // Screen overlay
                className={"fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity "
                    + (type === ModalType.None ? "ease-in duration-200 opacity-0 pointer-events-none" : "ease-out duration-300 opacity-100")}></div>


            <div className={"fixed inset-0 z-10 w-screen overflow-y-auto " + (type === ModalType.None ? "pointer-events-none" : "")}>
                <div className={"flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0 " + (type === ModalType.None ? "pointer-events-none" : "")}>
                    <div
                        className={"relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg "
                            + (type === ModalType.None ? "ease-in duration-200 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 pointer-events-none" : "ease-out duration-300 opacity-100 translate-y-0 sm:scale-100")}>
                        <div className={"bg-gray-600 px-4 pb-4 pt-4"}>
                            <div className={"text-center sm:ml-4 sm:mt-0 sm:text-left"}>
                                <h3 className={"text-base font-semibold leading-6"}>{
                                    (() => {
                                        switch (type) {
                                            case ModalType.TargetPlayer:
                                                return "Choose a Player to target!";
                                            case ModalType.TargetCard:
                                                return "Choose a Card to target!";
                                            case ModalType.TargetDiscard:
                                                return "Choose a Card to take!";
                                            case ModalType.ChoosePosition:
                                                return "You've got an Exploding/Imploding kitten! Choose a Position.";
                                            case ModalType.Favour:
                                                return "You've been favoured! Choose a Card to give!";
                                            case ModalType.TheFuture:
                                                return "Here's the future!"
                                        }
                                        return "";
                                    })()
                                }</h3>
                                {
                                    (() => {
                                        switch (type) {
                                            case ModalType.TargetPlayer:
                                                return <TargetPlayer callback={sessionId => {setTempPlayerStorage(sessionId); playCallback(sessionId)}}/>
                                            case ModalType.TargetCard:
                                                return <TargetCard callback={cardId => playCallback(tempPlayerStorage, cardId)}/>
                                            case ModalType.TargetDiscard:
                                                return <TargetDiscard callback={card => playCallback(undefined, card)}/>
                                            case ModalType.ChoosePosition:
                                                return <ChoosePosition callback={closeCallback}/>
                                            case ModalType.Favour:
                                                return <Favour callback={closeCallback}/>
                                            case ModalType.TheFuture:
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