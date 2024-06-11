import {Container, createRoot} from "react-dom/client";
import App from "./pages/App";
import {setupDiscordSdk} from "./utility/util"
import './index.css'

import {DiscordSDK} from "@discord/embedded-app-sdk";
import {client, DiscordSDKContext, DiscordSDKContextType, setCurrentRoom} from "./utility/contexts";
import {GameRoomState} from "../../server/src/rooms/schema/GameRoomState";

const discordSDK = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

console.log("Discord SDK is authing...")
setupDiscordSdk(discordSDK).then((receivedAuth) => {
    console.log("Discord SDK is authenticated");

    const discordContext = new DiscordSDKContextType();
    discordContext.auth = receivedAuth;
    discordContext.discordSDK = discordSDK;

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = 'none';

    const instanceId = discordSDK.instanceId;
    const joinOptions = {
        displayName: receivedAuth.user.global_name ?? receivedAuth.user.username
    };

    (async () => {
        let room;
        try {
            room = await client.joinById<GameRoomState>(instanceId, joinOptions)
            await setCurrentRoom(room);
        } catch (e) {
            room = await client.create<GameRoomState>("game_room", {instanceId: instanceId, ...joinOptions})
            await setCurrentRoom(room);
        }

        console.log("Joined room with instance id " + instanceId)
    })().then(() => {
        createRoot(document.getElementById('root') as Container).render(
            <DiscordSDKContext.Provider value={discordContext}>
                <App/>
            </DiscordSDKContext.Provider>
        )
    })

});