import {AuthResponse} from "./util";
import {DiscordSDK} from "@discord/embedded-app-sdk";
import {createContext} from "react";
import {colyseus} from "@p3ntest/use-colyseus"
import {LobbyRoomState} from "../../../server/src/rooms/schema/LobbyRoomState";
import {GameRoomState} from "../../../server/src/rooms/schema/GameRoomState";

export class DiscordSDKContextType {
    constructor() {
        this.discordSDK = {instanceId: "testId"} as unknown as DiscordSDK;
        this.auth = {user: {global_name: "Anshroid"}} as unknown as AuthResponse;
    }

    auth: AuthResponse
    discordSDK: DiscordSDK
}

export const DiscordSDKContext = createContext(new DiscordSDKContextType());

export const lobbyManager = colyseus<LobbyRoomState>('/api');
export const gameManager = colyseus<GameRoomState>('/api');