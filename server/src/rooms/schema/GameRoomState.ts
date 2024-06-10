import {Schema, ArraySchema, type, filter} from "@colyseus/schema";
import {Client} from "@colyseus/core";
import {Card} from "../../../shared/card";
import {LobbyPlayer} from "./LobbyRoomState.ts";

export class GamePlayer extends Schema {

    @type("string") sessionId: string;
    @type("string") userId: string;
    @type("string") displayName: string;
    @type("number") turnOrder: number;

    @filter(function (
        this: GamePlayer,
        client: Client,
    ) {
        return this.sessionId === client.sessionId;
    })
    @type(["number"]) cards = new ArraySchema<Card>();

}

export class GameRoomState extends Schema {

    @type("string") name: string;
    @type("string") channelId: string;
    @type("string") ownerId: string;
    @type("number") numPlayers: number;
    @type("boolean") started: boolean = false;
    @type([GamePlayer]) players = new ArraySchema<GamePlayer>();
    @type([LobbyPlayer]) spectators = new ArraySchema<LobbyPlayer>();

    @type("number") turnIndex: number;
    @type("number") turnCount: number;
    @type("number") turnRepeats: number;
    @type("number") turnOrder: number = 1;
    @type("boolean") alteringTheFuture: boolean;

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


    @type(["number"]) discard = new ArraySchema<Card>();

    isImplodingEnabled: boolean;
    deck = new Array<Card>();
}
