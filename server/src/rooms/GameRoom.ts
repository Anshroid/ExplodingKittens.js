import {Client, Room} from "@colyseus/core";
import {GamePlayer, GameRoomState} from "./schema/GameRoomState";
import {Card} from "../../shared/card";
import {LobbyPlayer} from "./schema/LobbyRoomState.ts";

// https://stackoverflow.com/a/12646864/9094935
function shuffleArray(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class GameRoom extends Room<GameRoomState> {
    maxClients = 12;

    onCreate(options: {
        instanceId: string;
        ownerId: string,
        numPlayers: number,
        isImplodingEnabled: boolean,
        nopeQTEMode: boolean,
    }) {
        this.setState(new GameRoomState());
        this.setPrivate(true).then();
        this.roomId = options.instanceId;

        this.state.ownerId = options.ownerId;
        this.state.numPlayers = options.numPlayers;

        this.state.isImplodingEnabled = options.isImplodingEnabled;
        this.state.nopeQTEMode = options.nopeQTEMode;

        const gameSize = Math.floor(this.state.numPlayers / 6) + 1
        console.log(gameSize)

        this.state.deck.push(
            ...Array(4 * gameSize).fill(Card.TACOCAT),
            ...Array(4 * gameSize).fill(Card.BEARDCAT),
            ...Array(4 * gameSize).fill(Card.RAINBOWCAT),
            ...Array(4 * gameSize).fill(Card.POTATOCAT),
            ...Array(4 * gameSize).fill(Card.CATTERMELON),
            ...Array(4 * gameSize).fill(Card.ATTACK),
            ...Array(4 * gameSize).fill(Card.FAVOUR),
            ...Array(5 * gameSize).fill(Card.NOPE),
            ...Array(4 * gameSize).fill(Card.SHUFFLE),
            ...Array(4 * gameSize).fill(Card.SKIP),
            ...Array(5 * gameSize).fill(Card.SEETHEFUTURE),
        );

        if (this.state.isImplodingEnabled) {
            this.state.deck.push(
                ...Array(4 * gameSize).fill(Card.REVERSE),
                ...Array(4 * gameSize).fill(Card.DRAWFROMBOTTOM),
                ...Array(4 * gameSize).fill(Card.FERALCAT),
                ...Array(4 * gameSize).fill(Card.ALTERTHEFUTURE),
                ...Array(3 * gameSize).fill(Card.TARGETEDATTACK),
            )
        }

        shuffleArray(this.state.deck);

        this.onMessage("drawCard", (client) => {
            let card = this.state.deck.shift();
            this.state.setDistanceToImplosion(this.state.distanceToImplosion - 1);
            if ([Card.EXPLODING, Card.IMPLODING].includes(card)) {
                this.processDeath(card, client)
                return;
            }
            this.state.players[this.state.turnIndex].cards.push(card);
            this.endTurn();
        })

        this.onMessage("playCard", (client, message: { card: Card, target?: number }) => {
            if (this.state.turnIndex !== client.userData.playerIndex) {
                return;
            }

            this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(message.card), 1);

            this.processNopeQTE(() => {
                switch (message.card) {
                    case Card.ATTACK:
                        this.state.turnRepeats += 2;
                        this.endTurn(true);
                        break;

                    case Card.SHUFFLE:
                        shuffleArray(this.state.deck);
                        this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
                        break;

                    case Card.SKIP:
                        this.endTurn();
                        break;

                    case Card.REVERSE:
                        this.state.turnOrder *= -1;
                        this.endTurn();
                        break;

                    case Card.DRAWFROMBOTTOM:
                        let card = this.state.deck.pop();
                        this.state.setDistanceToImplosion(this.state.distanceToImplosion); // Recalculate distance estimator
                        if ([Card.EXPLODING, Card.IMPLODING].includes(card)) {
                            this.processDeath(card, client)
                            break;
                        }
                        this.state.players[this.state.turnIndex].cards.push(card);
                        this.endTurn();
                        break;

                    case Card.ALTERTHEFUTURE:
                        this.state.alteringTheFuture = true;
                    // noinspection FallThroughInSwitchStatementJS
                    case Card.SEETHEFUTURE:
                        client.send("theFuture", {cards: this.state.deck.slice(0, 4)});
                        break;

                    case Card.TARGETEDATTACK:
                        this.state.turnRepeats += 2;
                        this.state.turnIndex = message.target;
                        break;

                    case Card.FAVOUR:
                        this.clients.getById(this.state.players[message.target].sessionId).send("favourRequest");
                        break;

                    default:
                        console.log("Invalid card!");
                        return;

                }
            })
        });

        this.onMessage("playCombo", (client, message: {
            cards: Array<Card>,
            target?: number,
            targetCard?: Card,
            targetIndex?: number
        }) => {
            for (const card of message.cards) {
                this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(card), 1);
            }

            this.processNopeQTE(() => {
                switch (message.cards.length) {
                    case 2:
                        if (new Set(message.cards).size === 1 || (message.cards.includes(Card.FERALCAT) && message.cards.every((c) => this.isCatCard(c)))) {
                            let stealIndex = ~~(Math.random() * this.state.players[message.target].cards.length);
                            this.state.players[this.state.turnIndex].cards.push(this.state.players[message.target].cards.splice(stealIndex)[0]);
                            break;
                        }

                        console.log("Invalid combo!");
                        break;

                    case 3:
                        if (new Set(message.cards).size === 1 || (message.cards.includes(Card.FERALCAT) && message.cards.every((c) => this.isCatCard(c)) && new Set(message.cards).size === 2)) {
                            let foundIndex;
                            if ((foundIndex = this.state.players[message.target].cards.indexOf(message.targetCard)) === -1) {
                                client.send("comboFail");
                            }

                            this.state.players[message.target].cards.splice(foundIndex, 1)
                            this.state.players[this.state.turnIndex].cards.push(message.targetCard);
                            break;
                        }

                        console.log("Invalid combo!");
                        break;

                    case 5:
                        if (new Set(message.cards).size !== 5) {
                            console.log("Invalid combo!");
                            break;
                        }

                        if (message.targetIndex >= this.state.discard.length) {
                            console.log("Invalid choice!");
                            break;
                        }

                        this.state.players[this.state.turnIndex].cards.push(this.state.discard.splice(message.targetIndex, 1)[0]);
                        break;

                    default:
                        console.log("Invalid combo!");
                        break;
                }
            })
        });

        this.onMessage("alterTheFuture", (_, message: { cards: Array<Card> }) => {
            this.state.deck.splice(0, 3, ...message.cards);
        });

        this.onMessage("nope", () => {
            this.state.nopeTimeout.refresh();
            this.state.noped = !this.state.noped;
        });

        this.onMessage("favourResponse", (client, message: { card: Card }) => {
            if (!this.state.players[client.userData.playerIndex].cards.includes(message.card)) {
                console.log("Invalid card!");
                return;
            }

            this.state.players[client.userData.playerIndex].cards.splice(this.state.players[client.userData.playerIndex].cards.indexOf(message.card));
            this.state.players[this.state.turnIndex].cards.push(message.card);
        });

        this.onMessage("chooseExplodingPositionResponse", (_, message: { index: number }) => {
            this.state.deck.splice(message.index, 0, Card.EXPLODING)
        });

        this.onMessage("chooseImplodingPositionResponse", (_, message: { index: number }) => {
            this.state.deck.splice(message.index, 0, Card.IMPLODING)
        });
    }

    onJoin(client: Client, options: { displayName: string }) {
        console.log(client.sessionId, "joined!");
        const player = new GamePlayer();
        player.sessionId = client.sessionId;
        player.displayName = options.displayName;
        player.cards.push(...this.state.deck.slice(0, 5), Card.DEFUSE); // Draw four cards from deck and a defuse card

        client.userData = {playerIndex: this.state.players.length};

        this.state.players.push(player);

        if (this.state.players.length === this.state.numPlayers) {
            this.lock().then(() => {
                const gameSize = Math.floor(this.state.numPlayers / 6) + 1;

                this.state.started = true;
                this.state.deck.push(
                    ...Array(this.state.numPlayers - 2).fill(Card.EXPLODING),
                    this.state.isImplodingEnabled ? Card.IMPLODING : Card.EXPLODING,
                    ...Array((gameSize * 6) - this.state.numPlayers).fill(Card.DEFUSE)
                );

                shuffleArray(this.state.deck);

                this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
            });
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");

        if (!consented) {
            return;
        }

        if (this.state.started) {
            this.state.discard.push(...this.state.players[client.userData.playerIndex].cards);
        } else {
            this.state.deck.push(...this.state.players[client.userData.playerIndex].cards);
            this.state.deck.splice(this.state.deck.indexOf(Card.DEFUSE), 1);
        }
        this.state.players.splice(client.userData.playerIndex, 1);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }

    endTurn(ignoreRemainingTurns: boolean = false) {
        if (!ignoreRemainingTurns && this.state.turnCount > 1) {
            this.state.turnCount--;
            return;
        }
        this.state.turnIndex = (this.state.turnIndex + this.state.turnOrder) % this.state.numPlayers;
    }

    isCatCard(card: number): boolean {
        return ([Card.TACOCAT, Card.BEARDCAT, Card.RAINBOWCAT, Card.CATTERMELON, Card.FERALCAT] as Array<number>).includes(card);
    }

    processDeath(card: Card, client: Client) {
        if (card === Card.EXPLODING) {
            if (this.state.players[this.state.turnIndex].cards.includes(Card.DEFUSE)) {
                this.broadcast("defused");
                this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(Card.DEFUSE), 1);
                client.send("chooseExplodingPosition");
                return;
            }

            this.killPlayer(this.state.turnIndex);
            this.state.turnRepeats = 1; // Make sure next player only has one turn
            return; // Pass turn to next alive player by keeping index the same
        } else if (card === Card.IMPLODING) {
            if (!this.state.implosionRevealed) {
                this.state.implosionRevealed = true;
                client.send("chooseImplodingPosition")
            } else {
                this.killPlayer(this.state.turnIndex)
                return;
            }
        }
        return;
    }

    killPlayer(index: number) {
        this.state.discard.push(...this.state.players[index].cards)
        const deadPlayer = this.state.players.splice(index, 1)[0]
        const spectator = new LobbyPlayer();
        spectator.displayName = deadPlayer.displayName;
        this.state.spectators.push(spectator);

        if (this.state.players.length === 1) {
            this.broadcast("gameEnd");
        }
    }

    processNopeQTE(callback: () => void) {
        if (!this.state.nopeQTEMode) {
            return;
        }

        this.state.nopeTimeout = setTimeout(() => {
            if (!this.state.noped) {
                callback()
            }
            this.state.noped = false;
        }, 3000);
    }

}
