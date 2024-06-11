import {Container, createRoot} from "react-dom/client";
import App from "./pages/App";
import {setupDiscordSdk} from "./utility/util"
import './index.css'

import {DiscordSDK} from "@discord/embedded-app-sdk";
import {DiscordSDKContext, DiscordSDKContextType} from "./utility/contexts";

const discordSDK = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

console.log("Discord SDK is authing...")
setupDiscordSdk(discordSDK).then((receivedAuth) => {
    console.log("Discord SDK is authenticated");

    const discordContext = new DiscordSDKContextType();
    discordContext.auth = receivedAuth;
    discordContext.discordSDK = discordSDK;

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = 'none';

    createRoot(document.getElementById('root') as Container).render(
        <DiscordSDKContext.Provider value={discordContext}>
                <App/>
        </DiscordSDKContext.Provider>
    )
});