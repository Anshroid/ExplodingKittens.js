import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {useEffect, useState} from "react";
import CardHand from "../components/cards/CardHand";
import {Card} from "../../../server/shared/card";
import {isCatCard, TurnState} from "../../../server/shared/util";
import GameModal, {ModalType} from "../components/game/GameModal";
import Deck from "../components/game/Deck";
import Discard from "../components/game/Discard";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {arrayMove, sortableKeyboardCoordinates} from "@dnd-kit/sortable";
import DroppableCard from "../components/cards/DroppableCard";

export default function Game() {
    // let {auth, discordSDK} = useContext(DiscordSDKContext);
    let room = useColyseusRoom();
    let turnState = useColyseusState(state => state.turnState);
    let turnIndex = useColyseusState(state => state.turnIndex) ?? -1;
    let playerIndexMap = useColyseusState(state => state.playerIndexMap) ?? new Map();
    let players = useColyseusState(state => state.players) ?? [];
    let spectators = useColyseusState(state => state.spectators) ?? [];
    let ownerId = useColyseusState(state => state.ownerId);
    let turnRepeats = useColyseusState(state => state.turnRepeats);

    let ourIndex = room ? playerIndexMap.get(room.sessionId) : -1;
    let cardsSchema = players.at(ourIndex)?.cards;
    let cards = cardsSchema ? cardsSchema.toArray() : [];

    let [selectedCardMask, setSelectedCardMask] = useState<Array<boolean>>([]);
    let [cardOrder, setCardOrder] = useState<Array<number>>([]);
    let [prevCards, setPrevCards] = useState<Array<Card>>([]);

    // Update card order when cards change (complicated!)
    if (cards.length !== prevCards.length || !cards.every((card, index) => prevCards[index] === card)) {
        let newCardOrder = structuredClone(cardOrder);
        if (prevCards.length > cards.length) { // Cards removed
            let removedIndices: number[] = [];
            prevCards.forEach((_, index) => {
                if (cards[index - removedIndices.length] !== prevCards[index]) {
                    removedIndices.push(index)
                }
            })

            newCardOrder = newCardOrder
                .filter(elem => !removedIndices.includes(elem))
                .map(elem => elem - removedIndices.filter(index => elem >= index).length)
        } else if (prevCards.length < cards.length) { // Cards added
            cards.slice(prevCards.length).forEach((_, index) => newCardOrder.push(prevCards.length + index));
        }

        setPrevCards(cards);
        setCardOrder(newCardOrder);
        setSelectedCardMask(cards.map(_ => false));
    }

    let selectedCards = cards.filter((_, index) => selectedCardMask[index]);
    const isPlayAllowed = !!room && isPlayValid(selectedCards) && turnState === TurnState.Normal && playerIndexMap.get(room.sessionId) === turnIndex;

    let [currentModal, setCurrentModal] = useState(ModalType.None);
    let [theFuture, setTheFuture] = useState<Card[]>([])

    useEffect(() => {
        if (!room) return () => {}

        const listeners: Array<() => void> = []

        // Listen to schema changes
        listeners.push(
            room.state.listen("turnState", (currentValue) => {
                if ([TurnState.ChoosingImplodingPosition, TurnState.ChoosingExplodingPosition].includes(currentValue) && (turnIndex === ourIndex)) {
                    setCurrentModal(ModalType.ChoosePosition);
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
                setCurrentModal(ModalType.Favour);
            }),

            room.onMessage("theFuture", (message) => {
                setCurrentModal(ModalType.TheFuture);
                setTheFuture(message.cards)
            })
        );

        return () => {
            listeners.forEach(removeCallback => {
                removeCallback()
            });
        }
    }, [turnIndex, ownerId, room]);

    function playCallback(targetSessionId?: string, targetCard?: Card) {
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
                    setCurrentModal(ModalType.TargetCard);
                    return;
                }
                room.send("playCombo", {
                    cards: selectedCards,
                    target: playerIndexMap.get(targetSessionId),
                    targetCard: targetCard
                });
                break;
            case 5:
                if (!targetCard) return;
                room.send("playCombo", {cards: selectedCards, targetCard: targetCard});
                break;
        }

        setCurrentModal(ModalType.None);
        setSelectedCardMask(cards.map(_ => false));
    }

    // Drag and drop handlers
    const [activeId, setActiveId] = useState<number>();

    function handleDragStart(event: DragStartEvent) {
        const {active} = event;

        setActiveId(active.id as number - 1); // ids cannot be 0, so are shifted by 1
    }

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        setActiveId(undefined);

        if (!over) return;

        if (over.id == 'discard-pile') {
            if (playerIndexMap == undefined || room == undefined) return;

            if (isPlayAllowed) {
                handlePlayCard();
            }

            if (turnState === TurnState.Noping && cards.includes(Card.NOPE) && selectedCards.includes(Card.NOPE) && selectedCards.length == 1) {
                room.send("nope")
            }
        }

        if (active.id !== over.id) {
            setCardOrder((prevOrder) => {
                const oldIndex = prevOrder.indexOf(active.id as number - 1); // ids cannot be 0, so are shifted by 1
                const newIndex = prevOrder.indexOf(over.id as number - 1);

                return arrayMove(prevOrder, oldIndex, newIndex);
            });
        }

    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 4
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handlePlayCard() {
        if (room == undefined) return;

        if (((selectedCards.length == 1 && [Card.FAVOUR, Card.TARGETEDATTACK].includes(selectedCards[0])) || selectedCards.length > 1)) {
            switch (selectedCards.length) {
                case 1:
                case 2:
                case 3:
                    setCurrentModal(ModalType.TargetPlayer);
                    break;
                case 5:
                    setCurrentModal(ModalType.TargetDiscard);
                    break;
            }
            return;
        }

        room.send("playCard", {card: selectedCards[0]});
        setSelectedCardMask(cards.map(_ => false));
    }

    return (
        <>
            {/* Mini player */}
            <div className="h-full sm:hidden flex flex-col justify-center text-center p-6 align-middle">
                <div className={"border rounded-md p-4 backdrop-blur w-fit m-auto"}>
                    <p>Players: {players.map(player => `${player.displayName} (${player.numCards} cards)`).join(", ")}</p>
                    {spectators.length > 0 ?
                        <p>Spectators: {spectators.map(player => player.displayName).join(", ")}</p> : null}

                    {/*<p>Turn state: {turnState}</p>*/}
                    <p>{"It's " + (turnIndex === ourIndex ? "your" : players.at(turnIndex)?.displayName + "'s") + " turn x" + turnRepeats}</p>
                </div>
            </div>
            <div className="h-full hidden sm:block">
                <GameModal type={currentModal} playCallback={playCallback}
                           closeCallback={() => setCurrentModal(ModalType.None)}
                           theFuture={theFuture}/>
                <div className={"flex items-center text-center justify-center h-full"}>
                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className={"flex flex-col"}>
                            <div className={"border rounded-md p-4 backdrop-blur backdrop-brightness-50 w-fit m-auto"}>
                                <p>Players: {players.map(player => `${player.displayName} (${player.numCards} cards)`).join(", ")}</p>
                                {spectators.length > 0 ?
                                    <p>Spectators: {spectators.map(player => player.displayName).join(", ")}</p> : null}

                                <p>{"It's " + (turnIndex === ourIndex ? "your" : players.at(turnIndex)?.displayName + "'s") + " turn x" + turnRepeats}</p>
                            </div>

                            <div className={"flex flex-row justify-center md:gap-20 gap-10"}>
                                <Deck drawCallback={() => room && room.send("drawCard")}
                                      drawDisabled={!room || turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}/>

                                <Discard/>
                            </div>

                            <CardHand cards={cards} selectedCardMask={selectedCardMask}
                                      setSelectedCardMask={setSelectedCardMask} cardOrder={cardOrder}
                                      activeId={activeId} isPlayAllowed={isPlayAllowed}/>
                        </div>
                        <DragOverlay>
                            {activeId !== undefined ?
                                <DroppableCard card={cards[activeId]} selectedCards={selectedCards}
                                               isPlayAllowed={isPlayAllowed}/> : null}
                        </DragOverlay>
                    </DndContext>
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
