import {Schema, CollectionSchema, type, filter} from "@colyseus/schema";
import {Client} from "@colyseus/core";
import {Card} from "../../../shared/card";

export enum TurnState {
    Normal,
    AlteringTheFuture,
    Favouring,
    Noping,
    ChoosingExplodingPosition,
    ChoosingImplodingPosition
}


export class LobbyPlayer extends Schema {

  @type("string") displayName: string;
  @type("string") sessionId: string;

}

export class GamePlayer extends Schema {

    @type("string") sessionId: string;
    @type("string") displayName: string;

    @filter(function (
        this: GamePlayer,
        client: Client,
    ) {
        return this.sessionId === client.sessionId;
    })
    @type(["number"]) cards = new CollectionSchema<Card>();

}

export class GameRoomState extends Schema {

    // Functional properties
    @type("string") ownerId: string;
    @type("boolean") started: boolean = false;
    @type([GamePlayer]) players = new CollectionSchema<GamePlayer>();
    @type([LobbyPlayer]) spectators = new CollectionSchema<LobbyPlayer>();

    // Game Settings
    @type("boolean") isImplodingEnabled = true;
    @type("boolean") nopeQTEMode = true;

    // Generic game state
    @type("number") turnIndex: number = 0;
    @type("number") turnCount: number = 0;
    @type("number") turnRepeats: number = 1;
    @type("number") turnOrder: number = 1;
    @type("number") turnState: TurnState;
    @type(["number"]) discard = new CollectionSchema<Card>();

    // Imploding kitten state
    @type("boolean") implosionRevealed: boolean = false;
    @filter(function (
        this: GameRoomState,
        value: number,
    ) {
        return this.implosionRevealed && value < 10;
    })
    @type("number") distanceToImplosion: number;
    setDistanceToImplosion(value: number) {
        this.distanceToImplosion = value;
        this.distanceToImplosionEstimator = ["Top", "Middle", "Bottom"][Math.floor(3 * this.distanceToImplosion / this.deck.length)]
    }

    @filter(function (
        this: GameRoomState,
    ) {
        return this.implosionRevealed;
    })
    @type("string") distanceToImplosionEstimator: string;

    // Private properties
    nopeTimeout: ReturnType<typeof setTimeout>;
    deck = new Array<Card>();
    noped = false;
}
