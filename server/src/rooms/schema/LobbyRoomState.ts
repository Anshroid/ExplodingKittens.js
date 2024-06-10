import { Schema, MapSchema, type } from "@colyseus/schema";

export class LobbyPlayer extends Schema {

  @type("string") userId: string;
  @type("string") displayName: string;

}

export class LobbyRoomState extends Schema {

  @type("string") name: string;
  @type("string") channelId: string;
  @type("string") ownerId: string;
  @type({map: LobbyPlayer}) players = new MapSchema<LobbyPlayer>();
  @type("boolean") started: boolean = false;

  @type("boolean") isImplodingEnabled: boolean = false;
  @type("boolean") nopeQTEMode: boolean = true;
}
