import {useColyseusRoom, useColyseusState} from "../utility/contexts";
import {useEffect, useState} from "react";
import CardsList from "../components/CardsList";
import {Card} from "../../../server/shared/card";
import {TurnState} from "../../../server/src/rooms/schema/GameRoomState";
import {isCatCard} from "../../../server/shared/util";
import {GameModal} from "../components/GameModal";

export default function Game() {
    // let {auth, discordSDK} = useContext(DiscordSDKContext);
    let room = useColyseusRoom();
    let turnState = useColyseusState((state) => state.turnState);
    let turnIndex = useColyseusState((state) => state.turnIndex);
    let playerIndexMap = useColyseusState((state) => state.playerIndexMap)
    let players = useColyseusState((state) => state.players);
    let ownerId = useColyseusState(state => state.ownerId);
    let turnRepeats = useColyseusState(state => state.turnRepeats)

    if (room === undefined || turnState === undefined || turnIndex === undefined || playerIndexMap === undefined || players == undefined) return;

    let ourIndex = playerIndexMap.get(room.sessionId);
    if (ourIndex === undefined) return;
    let cards = players.at(ourIndex)?.cards;
    if (cards === undefined) return;

    let [selectedIndices, setSelectedIndices] = useState<Array<Card>>([]);
    let [prevCards, setPrevCards] = useState(cards);
    if (prevCards !== cards) {
        setPrevCards(cards);
        setSelectedIndices([]);
    }

    let selectedCards = selectedIndices.map(index => cards[index]);

    let [currentModal, setCurrentModal] = useState("");

    useEffect(() => {
        // Listen to schema changes
        room.state.listen("turnState", (currentValue) => {
            if ([TurnState.ChoosingImplodingPosition, TurnState.ChoosingExplodingPosition].includes(currentValue) && turnIndex === ourIndex) {
                setCurrentModal("choosePosition");
            }

            if (currentValue === TurnState.GameOver && ownerId === room.sessionId) {
                setTimeout(() => {
                    room.send("returnToLobby");
                }, 5000);
            }
        });

        room.state.listen("ownerId", (currentValue) => {
            if (currentValue === room.sessionId && turnState === TurnState.GameOver) {
                setTimeout(() => {
                    room.send("returnToLobby");
                }, 5000);
            }
        })

        room.onMessage("favourRequest", () => {
            setCurrentModal("favour");
        })

        return () => {
            room.removeAllListeners();
        }
    }, []);

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
                if (!targetCard) setCurrentModal("targetCard");
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
        setSelectedIndices([]);
    }


    return (
        <>
            <GameModal type={currentModal} cardCallback={cardCallback} closeCallback={() => setCurrentModal("")}/>
            <div className={"flex flex-col items-center text-center"}>
                <CardsList cards={cards} selectedIndices={selectedIndices} setSelectedIndices={setSelectedIndices}/>
                <br/>
                <button onClick={() => {
                    if ((selectedIndices.length == 1 && [Card.FAVOUR, Card.TARGETEDATTACK].includes(selectedCards[0]) || selectedCards.length > 1)) {
                        switch (selectedCards.length) {
                            case 1:
                            case 2:
                                setCurrentModal("targetPlayer");
                                break;
                            case 3:
                                setCurrentModal("targetCard");
                                break;
                            case 5:
                                setCurrentModal("targetDiscard");
                                break;
                        }
                        return;
                    }

                    room.send("playCard", {card: selectedCards[0]});
                    setSelectedIndices([]);
                }}
                        disabled={!isPlayValid(selectedCards) || turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}
                        className={"rounded-md p-1 m-1 " + (!isPlayValid(selectedCards) || turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex ? "bg-green-800" : "bg-green-400")}>Play!
                </button>

                <button onClick={() => {
                    // console.log(currentModal);
                    // if (currentModal === "targetPlayer") {
                    //     setCurrentModal("");
                    //     return;
                    // }
                    // setCurrentModal("targetPlayer")
                    room.send("drawCard")
                }} disabled={turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex}
                        className={"rounded-md p-1 m-1 " + (turnState !== TurnState.Normal || playerIndexMap.get(room.sessionId) !== turnIndex ? "bg-blue-600" : "bg-blue-400")}>Draw!
                </button>

                <br/>

                <p>{"It's " + players.at(turnIndex).displayName + "'s turn x" + turnRepeats}</p>

                <br/>
                <div>
                    <h3 className={"font-bold"}>Debug information</h3>
                    <p>Turn state: {turnState}</p>
                    <p>Player index map: {JSON.stringify(playerIndexMap.toJSON())}</p>
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