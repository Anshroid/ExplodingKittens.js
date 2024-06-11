import {DiscordSDKContext, gameManager} from "../utility/contexts";
import {useContext, useEffect} from "react";

export default function Game() {
    let {auth, discordSDK} = useContext(DiscordSDKContext);
    let gameRoom = gameManager.useColyseusRoom();

    useEffect(() => {
        // Listen to schema changes
    }, []);

    return (
        <></>
    )
}