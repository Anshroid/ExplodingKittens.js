import {AuthResponse} from "./discord_sdk";
import {DiscordSDK} from "@discord/embedded-app-sdk";
import {createContext} from "react";
import {colyseus} from "@p3ntest/use-colyseus"
import {GameRoomState} from "../../../server/src/rooms/schema/GameRoomState";

export class DiscordSDKContextType {
    constructor() {
        this.discordSDK = {} as unknown as DiscordSDK;
        this.auth = {} as unknown as AuthResponse;
    }

    auth: AuthResponse
    discordSDK: DiscordSDK
}

export const DiscordSDKContext = createContext(new DiscordSDKContextType());


export const {
    client,
    connectToColyseus,
    setCurrentRoom,
    disconnectFromColyseus,
    useColyseusRoom,
    useColyseusState
} = colyseus<GameRoomState>('/api');