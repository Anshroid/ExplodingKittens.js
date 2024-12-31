import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import PlayerList from "../components/lobby/PlayerList";
import SettingsList from "../components/lobby/SettingsList";
import {useEffect, useRef, useState} from "react";
import Logo from "../../static/logotransparent.png";

export default function Lobby() {
    let room = useColyseusRoom();
    let ownerId = useColyseusState((state) => state.ownerId);

    let [enoughPlayers, setEnoughPlayers] = useState(false);

    let numPlayers = useRef(0);

    useEffect(() => {
        room?.state.spectators.onAdd(() => {
            numPlayers.current++;
            if (numPlayers.current > 1) setEnoughPlayers(true);
        });

        room?.state.spectators.onRemove(() => {
            numPlayers.current--;
            if (numPlayers.current < 2) setEnoughPlayers(false);
        });
    }, []);

    let isOwner = room?.sessionId === ownerId;
    let titleText = enoughPlayers ? (isOwner ? 'Start the game!' : 'Only the game owner may start the game.') : 'You are friendless.';

    let [mousePos, setMousePos] = useState([0, 0]);

    return (
        <>
            {room ?
                <div className={"flex flex-col place-items-center p-5 h-full"} onMouseMove={(event) => {
                    setMousePos([event.clientX, event.clientY]);
                }} onMouseOut={() => {
                    setMousePos([window.innerWidth / 2, window.innerHeight / 2]);
                }}>
                    <div className={"flex flex-row place-items-center h-full w-full"}>
                        <SettingsList
                            className={"justify-self-start border rounded-md p-4 backdrop-blur backdrop-brightness-50 flex-1"}/>
                        <div className={"flex-grow flex flex-col h-full items-center justify-center"}>
                            <img src={Logo} alt={"exploding kittens logo"}
                                 className={"origin-center backdrop-blur backdrop-hue-rotate-180 rounded-full max-h-[70vh]"}
                                 style={{transform: `translate(${(mousePos[0] - 0.5 * window.innerWidth) * 0.02}px, ${(mousePos[1] - 0.5 * window.innerHeight) * 0.01}px)`}}/>
                        </div>
                        <PlayerList
                            className={"justify-self-end border rounded-md p-4 backdrop-blur backdrop-brightness-50 flex-1"}/>
                    </div>
                    <button
                        className={"align-bottom py-1 px-4 font-bold text-2xl bg-red-950 rounded-2xl duration-75 outline outline-2 " + ((isOwner && enoughPlayers) ? "hover:-translate-y-2" : "")}
                        onClick={() => {
                            room.send("start")
                        }} disabled={!isOwner || !enoughPlayers}
                        title={titleText}>Start!
                    </button>
                </div>
                :
                <p className={"text-center mt-[45vh]"}>Joining room...</p>
            }
        </>
    )
}