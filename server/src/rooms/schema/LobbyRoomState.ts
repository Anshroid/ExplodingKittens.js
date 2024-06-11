import { Schema, MapSchema, type } from "@colyseus/schema";

export class LobbyPlayer extends Schema {

  @type("string") displayName: string;

}

export class LobbyRoomState extends Schema {

  @type("string") ownerId: string;
  @type({map: LobbyPlayer}) players = new MapSchema<LobbyPlayer>();
  @type("boolean") started: boolean = false;

  @type("boolean") isImplodingEnabled: boolean = false;
  @type("boolean") nopeQTEMode: boolean = true;
}
