import {Container, createRoot} from "react-dom/client";
import App from "./pages/App";
import {setupDiscordSdk} from "./utility/discord_sdk"
import './index.css'

import {DiscordSDK} from "@discord/embedded-app-sdk";
import {client, DiscordSDKContext, DiscordSDKContextType, setCurrentRoom} from "./utility/contexts";
import {GameRoomState} from "../../server/src/rooms/schema/GameRoomState";
import {Room} from "colyseus.js";

const discordSDK = new DiscordSDK("1248976494152122419");

console.log("[ExplodingKittens] Discord SDK is authing...")
setupDiscordSdk(discordSDK).then((receivedAuth) => {
    console.log("[ExplodingKittens] Discord SDK is authenticated");

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
        let room: Room<GameRoomState>;
        console.log(`[ExplodingKittens] Attempting to join game with id ${instanceId}`);

        let availableRooms = await client.getAvailableRooms()
        console.log(`[ExplodingKittens] Available Rooms: ${availableRooms.toString()}`);

        if (availableRooms.map(room => room.roomId).includes(instanceId)) {
            console.log("[ExplodingKittens] Room exists!")
            try {
                room = await client.joinById<GameRoomState>(instanceId, joinOptions)
                await setCurrentRoom(room);
            } catch (e) {
                console.log(`[ExplodingKittens] Failed to join, creating room. Error: ${e}`)
                room = await client.create<GameRoomState>("game_room", {instanceId: instanceId, ...joinOptions})
                await setCurrentRoom(room);
            }
        } else {
            console.log("[ExplodingKittens] Room does not exist, creating...")
            room = await client.create<GameRoomState>("game_room", {instanceId: instanceId, ...joinOptions})
            await setCurrentRoom(room);
        }

        addEventListener("unload", () => {
            room.leave(true);
        })

        console.log("[ExplodingKittens] Joined room with instance id " + instanceId)
    })().then(() => {
        createRoot(document.getElementById('root') as Container).render(
            <DiscordSDKContext.Provider value={discordContext}>
                <App/>
            </DiscordSDKContext.Provider>
        )
    })

});