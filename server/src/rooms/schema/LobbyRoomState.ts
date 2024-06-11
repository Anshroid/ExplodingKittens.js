import {Schema, type, ArraySchema} from "@colyseus/schema";

export class LobbyPlayer extends Schema {

  @type("string") displayName: string;
  @type("string") sessionId: string;

}

export class LobbyRoomState extends Schema {

  @type("string") ownerId: string;
  @type([LobbyPlayer]) players = new ArraySchema<LobbyPlayer>();
  @type("boolean") started: boolean = false;

  @type("boolean") isImplodingEnabled: boolean = true;
  @type("boolean") nopeQTEMode: boolean = true;
}
