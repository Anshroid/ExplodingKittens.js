import {DiscordSDKContext, useColyseusRoom} from "../utility/contexts";
import {useContext, useEffect} from "react";

export default function Game() {
    let {auth, discordSDK} = useContext(DiscordSDKContext);
    let room = useColyseusRoom();

    useEffect(() => {
        // Listen to schema changes
    }, []);

    return (
        <></>
    )
}