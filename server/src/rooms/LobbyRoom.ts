import {Room, Client} from "@colyseus/core";
import {LobbyPlayer, LobbyRoomState} from "./schema/LobbyRoomState";

export class LobbyRoom extends Room<LobbyRoomState> {
    maxClients = 12;

    onCreate(options: { name: string; channelId: string }) {
        this.setState(new LobbyRoomState());

        this.state.name = options.name;
        this.state.channelId = options.channelId;

        this.onMessage("changeSettings", (client, message) => {
            if (this.state.ownerId === client.sessionId) {
                this.state.isImplodingEnabled = message.isImplodingEnabled;
                this.state.nopeQTEMode = message.nopeQTEMode;
            }
        });

        this.onMessage("start", (client) => {
            if (this.state.ownerId === client.sessionId) {
                this.state.started = true;
            }
        });
    }

    onJoin(client: Client, options: { userId: string, displayName: string }) {
        console.log(client.sessionId, "joined!");

        if (!this.state.ownerId) {
            this.state.ownerId = client.sessionId;
        }

        const player = new LobbyPlayer();
        player.userId = options.userId;
        player.displayName = options.displayName;
        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
