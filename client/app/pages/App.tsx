import Lobby from "./Lobby";
import Game from "./Game";
import {useColyseusState} from "../utility/contexts";

export default function App() {
    const started = useColyseusState((state) => state.started);

    return (
        <>
            {started ?
                <Game/>
                : // Use lobby if either no connection has been made or the game is not started
                <Lobby/>
            }
        </>
    )
}