import {Room, Client} from "@colyseus/core";
import {LobbyPlayer, LobbyRoomState} from "./schema/LobbyRoomState";

export class LobbyRoom extends Room<LobbyRoomState> {
    maxClients = 12;

    onCreate(options: { instanceId: string }) {
        this.setState(new LobbyRoomState());
        this.setPrivate(true).then();
        this.roomId = options.instanceId + "l";

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

    onJoin(client: Client, options: { displayName: string }) {
        console.log(client.sessionId, "joined!");

        if (!this.state.ownerId) {
            this.state.ownerId = client.sessionId;
        }

        const player = new LobbyPlayer();
        player.displayName = options.displayName;
        player.sessionId = client.sessionId;

        client.userData = {playerIndex: this.state.players.length}

        this.state.players.push(player);
    }

    onLeave(client: Client) {
        console.log(client.sessionId, "left!");
        this.state.players.splice(client.userData.playerIndex, 1);
        if (client.sessionId === this.state.ownerId && this.state.players.length > 0) {
            this.state.ownerId = this.state.players[0].sessionId;
        }
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
