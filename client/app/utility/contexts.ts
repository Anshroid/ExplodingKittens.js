import {AuthResponse} from "./discord_sdk";
import {DiscordSDK} from "@discord/embedded-app-sdk";
import {createContext, Dispatch, SetStateAction} from "react";
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

export class LocalStorageContextType {
    constructor(showTooltips: boolean, setShowTooltips: Dispatch<SetStateAction<boolean>>) {
        this.showTooltips = showTooltips;
        this.setShowTooltips = setShowTooltips;
    }

    showTooltips: boolean;
    setShowTooltips: Dispatch<SetStateAction<boolean>>;
}

export const LocalStorageContext = createContext(new LocalStorageContextType(true, () => {}));

export const {
    client,
    setCurrentRoom,
    useColyseusRoom,
    useColyseusState
} = colyseus<GameRoomState>('/.proxy/api');