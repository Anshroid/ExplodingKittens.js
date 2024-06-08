import Lobby from "./Lobby.jsx";

export default function App({auth, discordSdk}) {
    return (
        <>
            <Lobby auth={auth} discordSdk={discordSdk}/>
        </>
    )
}