import {useEffect, useState} from "react";

export default function Lobby({auth, discordSdk}) {
    let [imageURL, setImageURL] = useState('');

    useEffect(() => {
        getGuildAvatar(auth, discordSdk).then((URL) => {setImageURL(URL);})
    }, []);

    return (
        <div className="flex flex-col">
            <h1 className="text-3xl font-bold underline font-sans text-center text-white">
              Hello world!
            </h1>
            <p></p>
            <img src={imageURL} alt={"server icon"} className={"rounded-3xl justify-center size-32 place-self-center mt-24"} />
        </div>
    )
}

async function getGuildAvatar(auth, discordSdk) {
    const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
        headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => response.json());

    const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

    return `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
}
