import {lobbyManager} from "../utility/contexts";
import {HTMLAttributes} from "react";

export default function PlayerList(props: HTMLAttributes<HTMLDivElement>) {
    const players = lobbyManager.useColyseusState((state) => state.players)

    return (
        <div {...props}>
            <h2 className={"text-white font-bold underline"}>Players in lobby</h2>
            <ol>
                {
                    players ?
                        players.map(player => (
                            <li key={player.sessionId}
                                className={"text-white text-center"}>{player.displayName}</li>
                        ))
                        :
                        null
                }
            </ol>
        </div>
    )
}