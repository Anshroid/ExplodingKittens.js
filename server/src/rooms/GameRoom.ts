import {Client, Room} from "@colyseus/core";
import {LobbyPlayer, GamePlayer, GameRoomState} from "./schema/GameRoomState";
import {Card} from "../../shared/card";

// https://stackoverflow.com/a/12646864/9094935
function shuffleArray(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class GameRoom extends Room<GameRoomState> {
    maxClients = 12;

    onCreate(options: { instanceId: string }) {
        this.setState(new GameRoomState());
        this.setPrivate(true).then();
        this.roomId = options.instanceId;

        // Lobby messages
        this.onMessage("changeSettings", (client, message) => {
            if (this.state.ownerId === client.sessionId && !this.state.started) {
                this.state.isImplodingEnabled = message.isImplodingEnabled;
                this.state.nopeQTEMode = message.nopeQTEMode;
            }
        });

        this.onMessage("start", (client) => {
            if (this.state.ownerId !== client.sessionId || this.state.started || this.state.spectators.length < 2) {
                return;
            }

            this.state.started = true;

            const gameSize = Math.floor(this.state.spectators.length / 6) + 1

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

            for (const spectator of this.state.spectators) {
                const player = new GamePlayer();
                player.sessionId = spectator.sessionId;
                player.displayName = spectator.displayName;
                player.cards.push(...this.state.deck.splice(0, 4), Card.DEFUSE); // Draw four cards from deck and a defuse card

                this.state.players.push(player);

                this.clients.getById(spectator.sessionId).userData.isSpectator = false;
            }

            this.state.spectators.clear();

            this.state.deck.push(
                ...Array(this.state.players.length - 2).fill(Card.EXPLODING),
                this.state.isImplodingEnabled ? Card.IMPLODING : Card.EXPLODING,
                ...Array((gameSize * 6) - this.state.players.length).fill(Card.DEFUSE)
            );

            shuffleArray(this.state.deck);

            this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
        });

        // Game messages
        this.onMessage("drawCard", (client) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

            let card = this.state.deck.shift();
            this.state.setDistanceToImplosion(this.state.distanceToImplosion - 1);
            if (this.checkDeath(card, client)) return;
            this.state.players[this.state.turnIndex].cards.push(card);
            this.endTurn();
        })

        this.onMessage("playCard", (client, message: { card: Card, target?: number }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

            this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(message.card), 1);
            // TODO: Check if they actually have the card

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
                        if (this.checkDeath(card, client)) return;
                        this.state.players[this.state.turnIndex].cards.push(card);
                        this.endTurn();
                        break;

                    case Card.ALTERTHEFUTURE:
                        this.state.alteringTheFuture = true;
                    // noinspection FallThroughInSwitchStatementJS
                    case Card.SEETHEFUTURE:
                        client.send("theFuture", {cards: this.state.deck.slice(0, 3)});
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
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

            // TODO: check if user has enough cards
            for (const card of message.cards) {
                this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(card), 1);
            }

            this.processNopeQTE(() => {
                switch (message.cards.length) {
                    case 2:
                        // TODO: check if target player has enough cards

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

        this.onMessage("alterTheFuture", (client, message: { cards: Array<Card> }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

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

        this.onMessage("chooseExplodingPositionResponse", (client, message: { index: number }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

            this.state.deck.splice(message.index, 0, Card.EXPLODING)
        });

        this.onMessage("chooseImplodingPositionResponse", (client, message: { index: number }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;

            // TODO: fix
            console.log(this.state.deck)
            this.state.deck.splice(0, 0, Card.IMPLODING)

            console.log(this.state.deck[0]);

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

        client.userData = {playerIndex: this.state.spectators.length, isSpectator: true};

        this.state.spectators.push(player);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");

        if (this.state.started) {
            if (!consented) return;

            this.state.discard.push(...this.state.players[client.userData.playerIndex].cards);
        }

        if (client.userData.isSpectator) {
            this.state.spectators.splice(client.userData.playerIndex, 1);
        } else {
            this.state.players.splice(client.userData.playerIndex, 1);
        }

        if (client.sessionId === this.state.ownerId && (this.state.players.length + this.state.spectators.length) > 0) {
            if (this.state.started) {
                this.state.ownerId = this.state.players[0].sessionId;
            } else {
                this.state.ownerId = this.state.spectators[0].sessionId;
            }
        }

        this.updatePlayerIndices()
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }

    endTurn(ignoreRemainingTurns: boolean = false) {
        this.state.turnCount++;
        if (!ignoreRemainingTurns && this.state.turnRepeats > 1) {
            this.state.turnRepeats--;
            return;
        }
        this.state.turnIndex = (this.state.turnIndex + this.state.turnOrder) % this.state.players.length;
    }

    isCatCard(card: number): boolean {
        return ([Card.TACOCAT, Card.BEARDCAT, Card.RAINBOWCAT, Card.CATTERMELON, Card.FERALCAT] as Array<number>).includes(card);
    }

    checkDeath(card: Card, client: Client) {
        if (card === Card.IMPLODING) {
            this.processDeath(card, client)
            return true;
        } else if (card === Card.EXPLODING) {
            if (!this.state.players[this.state.turnIndex].cards.splice(this.state.players[this.state.turnIndex].cards.indexOf(Card.DEFUSE), 1)) {
                this.processDeath(card, client)
                return true;
            }
        }
        return false;
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
        this.updatePlayerIndices();

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

    updatePlayerIndices() {
        for (const [index, player] of this.state.players.entries()) {
            this.clients.getById(player.sessionId).userData = {playerIndex: index, isSpectator: true};
        }

        for (const [index, player] of this.state.spectators.entries()) {
            console.log(player.sessionId, this.clients.getById(player.sessionId));
            this.clients.getById(player.sessionId).userData = {playerIndex: index, isSpectator: true};
        }
    }

}
