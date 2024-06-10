import {Container, createRoot} from "react-dom/client";
import App from "./App.js";
import {setupDiscordSdk} from "./util"
import './index.css'

import {DiscordSDK} from "@discord/embedded-app-sdk";
import {ColyseusContext, ColyseusContextType, DiscordSDKContext, DiscordSDKContextType} from "./contexts";
import {Client} from "colyseus.js";

const discordSDK = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

console.log("Discord SDK is authing...")
setupDiscordSdk(discordSDK).then((receivedAuth) => {
    console.log("Discord SDK is authenticated");

    const discordContext = new DiscordSDKContextType();
    discordContext.auth = receivedAuth;
    discordContext.discordSDK = discordSDK;

    const colyseusContext = new ColyseusContextType();
    colyseusContext.client = new Client("/api")

    createRoot(document.getElementById('root') as Container).render(
        <DiscordSDKContext.Provider value={discordContext}>
            <ColyseusContext.Provider value={colyseusContext}>
                <App/>
            </ColyseusContext.Provider>
        </DiscordSDKContext.Provider>
    )
});