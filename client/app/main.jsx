import ReactDOM from 'react-dom/client'
import React from "react";
import App from "./App";
import {setupDiscordSdk} from "./util.js"
import './index.css'

import {DiscordSDK} from "@discord/embedded-app-sdk";

let auth;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

console.log("Discord SDK is authing...")
setupDiscordSdk(discordSdk).then((receivedAuth) => {
    console.log("Discord SDK is authenticated");

    auth = receivedAuth;

    ReactDOM.createRoot(document.getElementById('root')).render(
        <App auth={auth} discordSdk={discordSdk} />
    )
});