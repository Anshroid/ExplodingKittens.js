import {HTMLAttributes} from "react";
import {useColyseusState} from "../utility/contexts";

export default function PlayerList(props: HTMLAttributes<HTMLDivElement>) {
    const spectators = useColyseusState((state) => state.spectators)

    return (
        <div {...props}>
            <h2 className={"text-white font-bold underline"}>Players in lobby</h2>
            <ol>
                {
                    spectators ?
                        spectators.map(spectator => (
                            <li key={spectator.sessionId}
                                className={"text-white text-center"}>{spectator.displayName}</li>
                        ))
                        :
                        null
                }
            </ol>
        </div>
    )
}