import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {useEffect, useState} from "react";
import CardsList from "../components/CardsList";
import {Card, CardNames} from "../../../server/shared/card";
import {isCatCard, TurnState} from "../../../server/shared/util";
import {GameModal} from "../components/GameModal";
import Deck from "../components/Deck";

export default function Game() {
    // let {auth, discordSDK} = useContext(DiscordSDKContext);
    let room = useColyseusRoom();
    let turnState = useColyseusState(state => state.turnState);
    let turnIndex = useColyseusState(state => state.turnIndex);
    let playerIndexMap = useColyseusState(state => state.playerIndexMap)
    let players = useColyseusState(state => state.players);
    let ownerId = useColyseusState(state => state.ownerId);
    let turnRepeats = useColyseusState(state => state.turnRepeats);
    let discard = useColyseusState(state => state.discard);

    if (room === undefined || turnState === undefined || turnIndex === undefined || playerIndexMap === undefined || players == undefined) return;

    let ourIndex = playerIndexMap.get(room.sessionId);
    if (ourIndex === undefined) return;
    let cards = players.at(ourIndex)?.cards;
    if (cards === undefined) return;

    let [selectedCardMask, setSelectedCardMask] = useState<Array<boolean>>([]);
    let [cardOrder, setCardOrder] = useState<Array<number>>([]);
    let [prevCards, setPrevCards] = useState<Array<Card>>([]);
    if (cards.toJSON().length !== prevCards.length || !cards.toJSON().every((card, index) => prevCards[index] === card)) {
        let newCardOrder = structuredClone(cardOrder);
        if (prevCards.length > cards.length) { // Cards removed
            let removedIndices: number[] = [];
            prevCards.forEach((_, index) => {
                if (cards[index - removedIndices.length] !== prevCards[index]) {
                    removedIndices.push(index)
                }
            })

            removedIndices.forEach(removedIndex =>
                newCardOrder = newCardOrder.filter(elem => elem !== removedIndex + 1).map(elem => elem > removedIndex ? elem - 1 : elem)
            )
        } else if (prevCards.length < cards.length) { // Cards added
            cards.slice(prevCards.length).forEach((_, index) => newCardOrder.push(prevCards.length + index + 1));
        }


        setPrevCards(cards.toJSON());
        setCardOrder(newCardOrder);
        setSelectedCardMask(cards.map(_ => false));
    }

    let selectedCards = cards.filter((_, index) => selectedCardMask[index]);

    useEffect(() => {
        console.log("Now selected: ", selectedCards);
    }, [selectedCardMask]);

    let [currentModal, setCurrentModal] = useState("");
    let [theFuture, setTheFuture] = useState<Card[]>([])

    useEffect(() => {
        const listeners: Array<() => void> = []

        // Listen to schema changes
        listeners.push(
            room.state.listen("turnState", (currentValue) => {
                if ([TurnState.ChoosingImplodingPosition, TurnState.ChoosingExplodingPosition].includes(currentValue) && (turnIndex === ourIndex)) {
                    setCurrentModal("choosePosition");
                }

                if (currentValue === TurnState.GameOver && ownerId === room.sessionId) {
                    setTimeout(() => {
                        room.send("returnToLobby");
                    }, 5000);
                }
            }, true),

            room.state.listen("ownerId", (currentValue) => {
                if (currentValue === room.sessionId && turnState === TurnState.GameOver) {
                    setTimeout(() => {
                        room.send("returnToLobby");
                    }, 5000);
                }
            }),

            room.onMessage("favourRequest", () => {
                setCurrentModal("favour");
            }),

            room.onMessage("theFuture", (message) => {
                setCurrentModal("theFuture");
                setTheFuture(message.cards)
            })
        );

        return () => {
            listeners.forEach(removeCallback => {
                removeCallback()
            });
        }
    }, [turnIndex, ownerId]);

    function cardCallback(targetSessionId?: string, targetCard?: Card, targetIndex?: number) {
        if (!room || !playerIndexMap) return;

        switch (selectedCards.length) {
            case 1:
                if (!targetSessionId) return;
                room.send("playCard", {card: selectedCards[0], target: playerIndexMap.get(targetSessionId)});
                break;
            case 2:
                if (!targetSessionId) return;
                room.send("playCombo", {cards: selectedCards, target: playerIndexMap.get(targetSessionId)});
                break;
            case 3:
                if (!targetSessionId) return;
                if (!targetCard) {
                    setCurrentModal("targetCard");
                    return;
                }
                room.send("playCombo", {
                    cards: selectedCards,
                    target: playerIndexMap.get(targetSessionId),
                    targetCard: targetCard
                });
                break;
            case 5:
                if (!targetIndex) return;
                room.send("playCombo", {cards: selectedCards, targetIndex: targetIndex});
                break;
        }

        setCurrentModal("");
        setSelectedCardMask(cards.map(_ => false));
    }


    return (
        <>
            <GameModal type={currentModal} cardCallback={cardCallback} closeCallback={() => setCurrentModal("")}
                       theFuture={theFuture}/>
            <div className={"flex items-center text-center justify-center h-full"}>
                <div className={"justify-center flex-none"}>
                    <div>
                        <h3 className={"font-bold"}>Debug information</h3>
                        <p>Turn state: {turnState}</p>
                    </div>
                    <br/>

                    <p>{"It's " + players.at(turnIndex).displayName + "'s turn x" + turnRepeats}</p>
                    <p>Discard pile: {discard.map(card => CardNames.get(card)).join(", ")}</p>

                    <br/>

                    <Deck drawCallback={() => room.send("drawCard")}
                          drawDisabled={turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}/>

                    <button onClick={() => {
                        if (((selectedCards.length == 1 && [Card.FAVOUR, Card.TARGETEDATTACK].includes(selectedCards[0])) || selectedCards.length > 1)) {
                            switch (selectedCards.length) {
                                case 1:
                                case 2:
                                case 3:
                                    setCurrentModal("targetPlayer");
                                    break;
                                case 5:
                                    setCurrentModal("targetDiscard");
                                    break;
                            }
                            return;
                        }

                        room.send("playCard", {card: selectedCards[0]});
                        setSelectedCardMask(cards.map(_ => false));
                    }}
                            disabled={!isPlayValid(selectedCards) || turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}
                            className={"rounded-md p-1 m-1 " + (!isPlayValid(selectedCards) || turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex ? "bg-green-800" : "bg-green-400")}>Play!
                    </button>

                    <button onClick={() => {
                        room.send("nope")
                    }} disabled={turnState !== TurnState.Noping || !cards.includes(Card.NOPE)}
                            className={"rounded-md p-1 m-1 " + (turnState !== TurnState.Noping || !cards.includes(Card.NOPE) ? "bg-red-900" : "bg-red-600")}>Nope!
                    </button>
                    <br/>
                    <br/>
                    <CardsList cards={cards} selectedCardMask={selectedCardMask}
                               setSelectedCardMask={setSelectedCardMask} cardOrder={cardOrder}
                               setCardOrder={setCardOrder}/>
                </div>
            </div>
        </>
    )
}

function isPlayValid(cards: Array<Card>) {
    switch (cards.length) {
        case 1:
            return ![Card.DEFUSE, Card.NOPE].includes(cards[0]) && !isCatCard(cards[0]);
        case 2:
            return new Set(cards).size === 1 || (cards.includes(Card.FERALCAT) && cards.every((c) => isCatCard(c)));
        case 3:
            return new Set(cards).size === 1 || (cards.includes(Card.FERALCAT) && cards.every((c) => isCatCard(c)) && new Set(cards).size === 2);
        case 5:
            return new Set(cards).size === 5;
    }
    return false;
}
