import {useColyseusRoom, useColyseusState} from "../utility/contexts";

export default function TargetPlayer({callback}: {callback: (sessionId: string) => void}) {
    let room = useColyseusRoom();
    let allPlayers = useColyseusState(state => state.players);

    if (!allPlayers || !room) return;

    let players = allPlayers.filter(player => player.sessionId !== room.sessionId);

    return (
        <ul>
            {players.map((player) => (
                <li key={player.sessionId}>
                    <button onClick={() => {callback(player.sessionId)}}>{player.displayName}</button>
                </li>
            ))}
        </ul>
    );
}