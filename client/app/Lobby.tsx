import {useContext, useEffect, useState} from "react";
import {ColyseusContext, DiscordSDKContext} from "./contexts";
import {AuthResponse} from "./util";
import {DiscordSDK} from "@discord/embedded-app-sdk";
import {Guild} from "@discord/embedded-app-sdk/output/schema/types";

export default function Lobby() {
    let { auth, discordSDK } = useContext(DiscordSDKContext);
    let { client } = useContext(ColyseusContext)
    let [imageURL, setImageURL] = useState('');

    useEffect(() => {
        getGuildAvatar(auth, discordSDK).then((URL) => {setImageURL(URL);})
    }, []);

    return (
        <div className="flex flex-col place-items-center justify-center pt-5 pb-5">
            <h1 className="text-3xl font-bold underline font-sans text-center text-white">
              Hello world!
            </h1>
            <p></p>
            <img src={imageURL} alt={"server icon"} className={"rounded-3xl size-32 flex-1"} />
        </div>
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
