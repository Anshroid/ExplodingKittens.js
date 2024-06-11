import {useContext, useEffect, useState} from "react";
import {DiscordSDKContext, lobbyManager} from "../utility/contexts";
import {AuthResponse} from "../utility/util";
import {DiscordSDK} from "@discord/embedded-app-sdk";
import {Guild} from "@discord/embedded-app-sdk/output/schema/types";
import {LobbyRoomState} from "../../../server/src/rooms/schema/LobbyRoomState"
import PlayerList from "../components/PlayerList";
import SettingsList from "../components/SettingsList";

export default function Lobby() {
    let {auth, discordSDK} = useContext(DiscordSDKContext);
    let [imageURL, setImageURL] = useState('');
    let lobbyRoom = lobbyManager.useColyseusRoom()

    useEffect(() => {
        async function setupRoom(): Promise<void> {
            const instanceId = discordSDK.instanceId;
            const joinOptions = {
                displayName: auth.user.global_name ?? auth.user.username
            }
            try {
                await lobbyManager.setCurrentRoom(await lobbyManager.client.joinById<LobbyRoomState>(instanceId, joinOptions));
            } catch (e) {
                await lobbyManager.setCurrentRoom(await lobbyManager.client.create<LobbyRoomState>("lobby_room", {instanceId: instanceId, ...joinOptions}));
            }

            console.log("joined room")
        }

        setupRoom().then();

        return () => {
            lobbyRoom?.leave(true).then();
        }

    }, []);

    useEffect(() => {
        getGuildAvatar(auth, discordSDK).then((URL) => {
            setImageURL(URL);
        })
    }, []);

    return (
        <>
            {lobbyRoom ?
                <div className={"flex flex-col place-items-center p-5 h-full"}>
                    <div className={"flex flex-row place-items-center h-full w-full"}>
                        <SettingsList className={"justify-self-start border rounded-md p-4"}/>
                        <div className={"flex-1 flex-grow flex flex-col h-full items-center justify-center"}>
                            {imageURL ?
                                <img src={imageURL} alt={"server icon"}
                                     className={"rounded-3xl size-32 max-h-[128px]"}/>
                                :
                                null
                            }
                        </div>
                        <PlayerList className={"justify-self-end border rounded-md p-4"}/>
                    </div>
                    <button
                        className={"align-bottom py-1 px-4 text-white font-bold text-2xl bg-red-950 rounded-2xl hover:-translate-y-2 duration-75"}>Start!
                    </button>
                </div>
                :
                <p className={"text-white text-center mt-[43vh]"}>Joining room...</p>
            }
        </>
    )
}

async function getGuildAvatar(auth: AuthResponse, discordSDK: DiscordSDK) {
    const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
        headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => response.json());

    const currentGuild = guilds.find((g: Guild) => g.id === discordSDK.guildId);

    return `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
}
