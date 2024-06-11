import {useContext, useEffect, useRef} from "react";
import {DiscordSDKContext, gameManager, lobbyManager} from "../utility/contexts";
import {LobbyRoomState} from "../../../server/src/rooms/schema/LobbyRoomState"
import PlayerList from "../components/PlayerList";
import SettingsList from "../components/SettingsList";
import {GameRoomState} from "../../../server/src/rooms/schema/GameRoomState";

export default function Lobby({setInGame}: { setInGame: CallableFunction }) {
    let {auth, discordSDK} = useContext(DiscordSDKContext);
    let lobbyRoom = lobbyManager.useColyseusRoom();
    let ownerId = lobbyManager.useColyseusState((state) => state.ownerId);

    let numPlayers = useRef(0);
    let gameSettings = useRef({ isImplodingEnabled: true, nopeQTEMode: true });

    useEffect(() => {
        async function setupRoom(): Promise<void> {
            const instanceId = discordSDK.instanceId;
            const joinOptions = {
                displayName: auth.user.global_name ?? auth.user.username
            }

            let room;
            try {
                room = await lobbyManager.client.joinById<LobbyRoomState>(instanceId, joinOptions)
                await lobbyManager.setCurrentRoom(room);
            } catch (e) {
                room = await lobbyManager.client.create<LobbyRoomState>("lobby_room", {instanceId: instanceId, ...joinOptions})
                await lobbyManager.setCurrentRoom(room);
            }

            room.state.players.onAdd(() => {
                numPlayers.current += 1;
                console.log("Number of Players updated to " + numPlayers.current);
            });

            room.state.players.onRemove(() => {
                numPlayers.current -= 1;
                console.log("Number of Players updated to " + numPlayers.current);
            });

            room.state.listen("isImplodingEnabled", (currentValue) => {
                gameSettings.current.isImplodingEnabled = currentValue;
            })

            room.state.listen("nopeQTEMode", (currentValue) => {
                gameSettings.current.nopeQTEMode = currentValue;
            })

            room.state.listen("started", (currentValue) => {
                console.log("Game started!");
                if (currentValue === true && ownerId !== room.sessionId) {
                    gameManager.client.joinById<GameRoomState>(instanceId, joinOptions).then((room) => {
                        gameManager.setCurrentRoom(room);
                        lobbyRoom?.leave(true).then();
                        setInGame(true);
                    })
                }
            })

            console.log("Joined room with instance id " + instanceId)
        }

        setupRoom().then();

        return () => {
            lobbyRoom?.removeAllListeners();
            lobbyRoom?.leave(true).then();
        }

    }, []);

    return (
        <>
            {lobbyRoom ?
                <div className={"flex flex-col place-items-center p-5 h-full"}>
                    <div className={"flex flex-row place-items-center h-full w-full"}>
                        <SettingsList className={"justify-self-start border rounded-md p-4"} room={lobbyRoom}
                                      ownerId={ownerId}/>
                        <div className={"flex-1 flex-grow flex flex-col h-full items-center justify-center"}></div>
                        <PlayerList className={"justify-self-end border rounded-md p-4"}/>
                    </div>
                    <button
                        className={"align-bottom py-1 px-4 text-white font-bold text-2xl bg-red-950 rounded-2xl hover:-translate-y-2 duration-75 outline outline-2"}
                        onClick={() => {
                            gameManager.client.create<GameRoomState>("game_room", {
                                displayName: auth.user.global_name ?? auth.user.username,
                                instanceId: discordSDK.instanceId,
                                ownerId: ownerId,
                                numPlayers: numPlayers.current,
                                ...gameSettings.current
                            }).then(() => {
                                lobbyRoom.send("start")
                                lobbyRoom?.leave(true).then();
                                setInGame(true);
                            })
                        }} disabled={false}
                        title={lobbyRoom.sessionId === ownerId ? 'Start the game!' : 'Only the game owner may start the game.'}>Start!
                    </button>
                </div>
                :
                <p className={"text-white text-center mt-[43vh]"}>Joining room...</p>
            }
        </>
    )
}