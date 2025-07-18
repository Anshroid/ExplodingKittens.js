import {Client, Room} from "@colyseus/core";
import {GamePlayer, GameRoomState, LobbyPlayer} from "./schema/GameRoomState";
import {Card, CardNames} from "../../shared/card";
import {isCatCard, TurnState} from "../../shared/util";

// https://stackoverflow.com/a/12646864/9094935
function shuffleArray(array: Array<any>) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export class GameRoom extends Room<GameRoomState> {
    maxClients = 12;

    async onCreate(options: { instanceId: string }) {
        this.setState(new GameRoomState());
        await this.setPrivate(true)
        this.roomId = options.instanceId;

        const verifyRes = await fetch(`https://discord.com/api/applications/${process.env.DISCORD_CLIENT_ID}/activity-instances/${options.instanceId}`, {
            headers: {
                "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            }
        });
        if (!verifyRes.ok && process.env.NODE_ENV === "production") {
            console.log(`[${this.roomId}] Instance ID verification failed!`);
            return;
        }

        this.log("initialised!")

        // Lobby messages
        this.onMessage("changeSettings", (client, message) => {
            if (this.state.ownerId === client.sessionId && !this.state.started) {
                this.state.isImplodingEnabled = message.isImplodingEnabled;
                this.state.nopeQTECooldown = message.nopeQTECooldown;
            }
        });

        this.onMessage("start", (client) => {
            if (this.state.ownerId !== client.sessionId || this.state.started || this.state.spectators.length < 2) {
                return;
            }

            this.state.started = true;

            const gameSize = Math.floor(this.state.spectators.length / (6 + +this.state.isImplodingEnabled)) + 1

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

            this.state.spectators.forEach((spectator) => {
                const player = new GamePlayer();
                player.sessionId = spectator.sessionId;
                player.displayName = spectator.displayName;

                player.cards.push(...this.state.deck.splice(0, 4), Card.DEFUSE);

                this.state.players.push(player);
            })

            this.state.spectators.clear();
            this.updatePlayerIndices();

            this.state.deck.push(
                ...Array(this.state.players.length - 2).fill(Card.EXPLODING),
                this.state.isImplodingEnabled ? Card.IMPLODING : Card.EXPLODING,
                ...Array((gameSize * 6) - this.state.players.length).fill(Card.DEFUSE)
            );

            shuffleArray(this.state.deck);
            this.state.deckLength = this.state.deck.length;

            this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));

            this.log("Game started!")
        });

        // Game messages
        this.onMessage("drawCard", (client) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex || this.state.turnState !== TurnState.Normal) return;

            let card = this.state.deck.shift();
            this.state.deckLength = this.state.deck.length;
            this.state.setDistanceToImplosion(this.state.distanceToImplosion - 1);
            this.state.players.at(this.state.turnIndex).cards.push(card);
            this.checkCardForDeath(card, true);
        })

        this.onMessage("playCard", (client, message: { card: Card, target?: number }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex || this.state.turnState !== TurnState.Normal) return;
            if (!this.state.players.at(this.state.turnIndex).cards.deleteAt(this.state.players[this.state.turnIndex].cards.indexOf(message.card))) return;

            this.log("Player " + client.sessionId + " playing " + CardNames.get(message.card) + " target " + message.target);

            this.state.discard.push(message.card);

            if ([Card.FAVOUR, Card.TARGETEDATTACK].includes(message.card)) this.broadcast("cardTarget", {target: message.target});

            this.processNopeQTE(() => {
                switch (message.card) {
                    case Card.ATTACK:
                    case Card.TARGETEDATTACK:
                        if (this.state.attacked) {
                            this.state.turnRepeats += 2;
                        } else {
                            this.state.turnRepeats = 2;
                        }
                        this.state.turnCount++;
                        this.state.attacked = true;
                        this.state.turnIndex = message.card == Card.TARGETEDATTACK ?
                            message.target : // Use target
                            (this.state.turnIndex + this.state.turnOrder + this.state.players.length) % this.state.players.length; // Use next player, see endTurn for explanation
                        break;

                    case Card.SHUFFLE:
                        shuffleArray(this.state.deck);
                        this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
                        this.broadcast("shuffled")
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
                        this.state.deckLength = this.state.deck.length;
                        this.state.setDistanceToImplosion(this.state.distanceToImplosion); // Recalculate distance estimator
                        this.state.players.at(this.state.turnIndex).cards.push(card);
                        this.checkCardForDeath(card, true);
                        break;

                    case Card.ALTERTHEFUTURE:
                        this.state.turnState = TurnState.AlteringTheFuture;
                    // noinspection FallThroughInSwitchStatementJS
                    case Card.SEETHEFUTURE:
                        client.send("theFuture", {cards: this.state.deck.slice(0, 3)});
                        break;


                    case Card.FAVOUR:
                        this.state.turnState = TurnState.Favouring;
                        this.clients.getById(this.state.players.at(message.target).sessionId).send("favourRequest");
                        break;

                    default:
                        this.log("Invalid card!");
                        return;

                }
            })
        });

        this.onMessage("playCombo", (client, message: {
            cards: Array<Card>,
            target?: number,
            targetCard?: Card,
        }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex || this.state.turnState !== TurnState.Normal) return;

            for (const card of message.cards) {
                if (!this.state.players.at(this.state.turnIndex).cards.deleteAt(this.state.players.at(this.state.turnIndex).cards.indexOf(card))) return;
                this.state.discard.push(card);
            }

            this.log("Player " + client.sessionId + " playing " + message.cards.map(card => CardNames.get(card)) + " target " + message.target);

            this.broadcast("comboTarget", {numCards: message.cards.length, ...message});

            this.processNopeQTE(() => {
                switch (message.cards.length) {
                    case 2:
                        if (new Set(message.cards).size === 1 || (message.cards.includes(Card.FERALCAT) && message.cards.every((c) => isCatCard(c)))) {
                            if (this.state.players.at(message.target).cards.length == 0) return;

                            let stealIndex = ~~(Math.random() * this.state.players.at(message.target).cards.length);

                            let stolenCard = this.state.players.at(message.target).cards[stealIndex];
                            this.state.players.at(message.target).cards.deleteAt(stealIndex);

                            this.state.players.at(this.state.turnIndex).cards.push(stolenCard);
                            break;
                        }

                        this.log("Invalid combo!");
                        break;

                    case 3:
                        if (new Set(message.cards).size === 1 || (message.cards.includes(Card.FERALCAT) && message.cards.every((c) => isCatCard(c)) && new Set(message.cards).size === 2)) {
                            if (!this.state.players.at(message.target).cards.deleteAt(this.state.players.at(message.target).cards.indexOf(message.targetCard))) {
                                client.send("comboFail");
                                break;
                            }

                            this.state.players.at(this.state.turnIndex).cards.push(message.targetCard);
                            break;
                        }

                        this.log("Invalid combo!");
                        break;

                    case 5:
                        if (new Set(message.cards).size !== 5) {
                            this.log("Invalid combo!");
                            break;
                        }

                        if (!this.state.discard.includes(message.targetCard)) {
                            this.log("Invalid choice!");
                            break;
                        }

                        this.state.discard.deleteAt(this.state.discard.indexOf(message.targetCard));
                        this.state.players.at(this.state.turnIndex).cards.push(message.targetCard);
                        this.checkCardForDeath(message.targetCard, false)
                        break;

                    default:
                        this.log("Invalid combo!");
                        break;
                }
            })
        });

        this.onMessage("alterTheFuture", (client, message: { cards: Array<Card> }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex || this.state.turnState !== TurnState.AlteringTheFuture) return;
            if (!message.cards.every(card => this.state.deck.slice(0, 3).includes(card))) return;

            this.state.deck.splice(0, 3, ...message.cards);
            this.state.turnState = TurnState.Normal;
        });

        this.onMessage("nope", (client) => {
            if (this.state.turnState !== TurnState.Noping) return;
            if (!this.state.players.at(client.userData.playerIndex).cards.deleteAt(this.state.players.at(client.userData.playerIndex).cards.indexOf(Card.NOPE))) return;

            this.state.discard.push(Card.NOPE);

            this.state.nopeTimeout.refresh();
            this.state.noped = !this.state.noped;
        });

        this.onMessage("favourResponse", (client, message: { card: Card }) => {
            if (this.state.turnState !== TurnState.Favouring) return;

            if (!this.state.players.at(client.userData.playerIndex).cards.deleteAt(this.state.players.at(client.userData.playerIndex).cards.indexOf(message.card))) {
                this.log("Invalid card!");
                return;
            }

            this.state.players.at(this.state.turnIndex).cards.push(message.card);
            this.state.turnState = TurnState.Normal;
        });

        this.onMessage("choosePosition", (client, message: { index: number }) => {
            if (!this.state.started || this.state.turnIndex !== client.userData.playerIndex) return;
            if (![TurnState.ChoosingImplodingPosition, TurnState.ChoosingExplodingPosition].includes(this.state.turnState)) return;

            this.log("Choosing position: index " + message.index)

            this.state.deck.splice(message.index, 0, this.state.turnState === TurnState.ChoosingImplodingPosition ? Card.IMPLODING : Card.EXPLODING);
            this.state.deckLength = this.state.deck.length;

            this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
            this.state.turnState = TurnState.Normal;
            this.endTurn();
        })

        this.onMessage("returnToLobby", (client) => {
            if (!this.state.started || client.sessionId !== this.state.ownerId || this.state.turnState !== TurnState.GameOver) return;

            const oldPlayer = this.state.players.splice(0, 1)[0];
            const spectator = new LobbyPlayer();
            spectator.sessionId = oldPlayer.sessionId;
            spectator.displayName = oldPlayer.displayName;
            this.state.spectators.push(spectator);
            this.updatePlayerIndices();

            this.state.started = false;

            this.state.turnIndex = 0;
            this.state.turnCount = 0;
            this.state.turnRepeats = 1;
            this.state.turnOrder = 1;
            this.state.turnState = TurnState.Normal;

            this.state.discard.clear();

            this.state.implosionRevealed = false;

            this.state.deck = [];
            this.state.deckLength = this.state.deck.length;
        })
    }

    onJoin(client: Client, options: { displayName: string }) {
        this.log(client.sessionId + " joined!");

        if (!this.state.ownerId) {
            this.state.ownerId = client.sessionId;
        }

        const player = new LobbyPlayer();
        player.displayName = options.displayName;
        player.sessionId = client.sessionId;

        client.userData = {playerIndex: this.state.spectators.length, isSpectator: true};
        this.state.playerIndexMap.set(client.sessionId, -1);

        this.state.spectators.push(player);
    }

    onLeave(client: Client, consented: boolean) {
        this.log(client.sessionId + ` left, consented=${consented}!`);
        this.log(`Overriding disconnection consent!`);

        consented = true;

        if (this.state.started) {
            if (!consented) return;

            if (!client.userData.isSpectator) {
                this.removePlayer(client.userData.playerIndex, true)

                let toRemove = this.state.deck.lastIndexOf(Card.EXPLODING);
                this.state.deck.filter((_, i) => i !== toRemove);
            } else {
                this.state.spectators.deleteAt(client.userData.playerIndex);
            }

        } else { // everyone is a spectator in the lobby
            this.state.spectators.deleteAt(client.userData.playerIndex);
        }

        if (client.sessionId === this.state.ownerId && (this.state.players.length + this.state.spectators.length) > 0) {
            if (this.state.started) {
                this.state.ownerId = this.state.players.at(0).sessionId;
            } else {
                this.state.ownerId = this.state.spectators.at(0).sessionId;
            }
        }

        this.state.playerIndexMap.delete(client.sessionId);
        this.updatePlayerIndices()
    }

    onDispose() {
        this.log("room " + this.roomId + " disposing...");
    }

    endTurn() {
        this.state.turnCount++;
        if (this.state.turnRepeats > 1) { // Attacked turn
            this.state.turnRepeats--;
        } else { // Normal turn OR end of attack
            this.state.attacked = false;
            this.state.turnIndex = (this.state.turnIndex + this.state.turnOrder + this.state.players.length) % this.state.players.length; // Cycle turns, js uses -1 % n = -1, so we must add n to make it positive
        }
    }

    checkCardForDeath(card: Card, shouldEndTurnIfNormal: boolean) {
        if (card === Card.IMPLODING) {
            if (this.state.implosionRevealed) {
                this.broadcast("imploded", {player: this.state.players.at(this.state.turnIndex).sessionId});
                this.removePlayer(this.state.turnIndex, true);
            } else {
                this.state.players.at(this.state.turnIndex).cards.deleteAt(this.state.players.at(this.state.turnIndex).cards.indexOf(Card.IMPLODING));
                this.state.implosionRevealed = true;
                this.broadcast("implosionRevealed");
                this.state.turnState = TurnState.ChoosingImplodingPosition
            }
        } else if (card === Card.EXPLODING) {
            if (!this.state.players.at(this.state.turnIndex).cards.deleteAt(this.state.players.at(this.state.turnIndex).cards.indexOf(Card.DEFUSE))) {
                this.broadcast("exploded", {player: this.state.players.at(this.state.turnIndex).sessionId});
                this.removePlayer(this.state.turnIndex, true);
            } else {
                this.state.players.at(this.state.turnIndex).cards.deleteAt(this.state.players.at(this.state.turnIndex).cards.indexOf(Card.EXPLODING));
                this.state.discard.push(Card.DEFUSE);
                this.broadcast("defused");
                this.state.turnState = TurnState.ChoosingExplodingPosition
            }
        } else {
            if (shouldEndTurnIfNormal) this.endTurn();
        }
    }

    removePlayer(index: number, createSpectator: boolean) {
        this.state.players.at(index).cards.forEach((card) => {
            this.state.discard.push(card)
        })

        const deadPlayer = this.state.players.at(index)
        this.state.players.deleteAt(index);

        if (createSpectator) {
            const spectator = new LobbyPlayer();
            spectator.sessionId = deadPlayer.sessionId;
            spectator.displayName = deadPlayer.displayName;
            this.state.spectators.push(spectator);
        }

        if (this.state.turnIndex === index) {
            switch (this.state.turnState) {
                case TurnState.ChoosingExplodingPosition:
                case TurnState.ChoosingImplodingPosition:
                    this.state.deck.splice(0, 0, this.state.turnState === TurnState.ChoosingImplodingPosition ? Card.IMPLODING : Card.EXPLODING);
                    this.state.deckLength = this.state.deck.length;

                    this.state.setDistanceToImplosion(this.state.deck.indexOf(Card.IMPLODING));
                    break;
            }
            this.state.turnState = TurnState.Normal;
        }

        this.state.attacked = false;
        this.state.turnRepeats = 1; // Make sure next player only has one turn
        this.state.turnIndex %= this.state.players.length; // Make sure turn index of next player is correct

        if (this.state.players.length === 1) {
            this.state.turnState = TurnState.GameOver;
        }

        this.updatePlayerIndices();
    }

    processNopeQTE(callback: () => void) {
        if (this.state.nopeQTECooldown === 0) {
            return;
        }

        this.state.turnState = TurnState.Noping;

        this.state.nopeTimeout = setTimeout(() => {
            this.state.turnState = TurnState.Normal;
            if (!this.state.noped) {
                callback()
            }
            this.state.noped = false;
        }, this.state.nopeQTECooldown);
    }

    updatePlayerIndices() {
        for (const [index, player] of this.state.players.toArray().entries()) {
            this.clients.getById(player.sessionId).userData = {playerIndex: index, isSpectator: false};
            this.state.playerIndexMap.set(player.sessionId, index);
        }

        for (const [index, player] of this.state.spectators.toArray().entries()) {
            this.clients.getById(player.sessionId).userData = {playerIndex: index, isSpectator: true};
            this.state.playerIndexMap.set(player.sessionId, -1);
        }
    }

    log(message: string) {
        console.log("[" + this.roomId + "] " + message)
    }
}