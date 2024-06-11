import Lobby from "./Lobby";
import Game from "./Game";
import {useState} from "react";

export default function App() {
    const [inGame, setInGame] = useState(false);

    return (
        <>
            {inGame ?
                <Game />
                :
                <Lobby setInGame={setInGame} />
            }
        </>
    )
}