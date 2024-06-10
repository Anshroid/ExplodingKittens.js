import {AuthResponse} from "./util";
import {DiscordSDK, DiscordSDKMock} from "@discord/embedded-app-sdk";
import {createContext} from "react";
import {Client, Room} from "colyseus.js";

export class DiscordSDKContextType {
    constructor() {
        this.discordSDK = {} as unknown as DiscordSDK;
        this.auth = {} as unknown as AuthResponse;
    }

    auth: AuthResponse
    discordSDK: DiscordSDK
}

export const DiscordSDKContext = createContext(new DiscordSDKContextType());

export class ColyseusContextType {
    constructor() {
        this.client = {} as unknown as Client;
    }

    client: Client;
}

export const ColyseusContext = createContext(new ColyseusContextType());