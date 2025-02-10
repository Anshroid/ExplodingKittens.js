export enum Card {
    EXPLODING,
    DEFUSE,
    TACOCAT,
    BEARDCAT,
    RAINBOWCAT,
    POTATOCAT,
    CATTERMELON,
    ATTACK,
    FAVOUR,
    NOPE,
    SHUFFLE,
    SKIP,
    SEETHEFUTURE,
    BACK,

// Imploding Kittens expansion
    IMPLODING,
    REVERSE,
    DRAWFROMBOTTOM,
    FERALCAT,
    ALTERTHEFUTURE,
    TARGETEDATTACK,
}

export const CardNames = new Map<Card, string>([
    [Card.EXPLODING, "Exploding Kitten"],
    [Card.DEFUSE, "Defuse"],
    [Card.TACOCAT, "Tacocat"],
    [Card.BEARDCAT, "Beard Cat"],
    [Card.RAINBOWCAT, "Rainbow Ralphing Cat"],
    [Card.POTATOCAT, "Hairy Potato Cat"],
    [Card.CATTERMELON, "Cattermelon"],
    [Card.ATTACK, "Attack"],
    [Card.FAVOUR, "Favour"],
    [Card.NOPE, "Nope"],
    [Card.SHUFFLE, "Shuffle"],
    [Card.SKIP, "Skip"],
    [Card.SEETHEFUTURE, "See the Future"],
    [Card.BACK, "Card Back Art"],

    [Card.IMPLODING, "Imploding Kitten"],
    [Card.REVERSE, "Reverse"],
    [Card.DRAWFROMBOTTOM, "Draw from the Bottom"],
    [Card.FERALCAT, "Feral Cat"],
    [Card.ALTERTHEFUTURE, "Alter the Future"],
    [Card.TARGETEDATTACK, "Targeted Attack"]
])

export const CardTooltips = new Map<Card, string>([
    [Card.EXPLODING, ""],
    [Card.DEFUSE, "Protects you from an Exploding Kitten... once."],
    [Card.TACOCAT, "This is a Cat Card. Play two as a pair to steal a random card from another player."],
    [Card.BEARDCAT, "This is a Cat Card. Play two as a pair to steal a random card from another player."],
    [Card.RAINBOWCAT, "This is a Cat Card. Play two as a pair to steal a random card from another player."],
    [Card.POTATOCAT, "This is a Cat Card. Play two as a pair to steal a random card from another player."],
    [Card.CATTERMELON, "This is a Cat Card. Play two as a pair to steal a random card from another player."],
    [Card.ATTACK, "End your turn without drawing a card. Force the next player to take two turns."],
    [Card.FAVOUR, "One player must give you a card of their choice."],
    [Card.NOPE, "Stop the action of another player. You can play this in response to another player."],
    [Card.SHUFFLE, "Shuffle the draw pile."],
    [Card.SKIP, "End your turn without drawing a card."],
    [Card.SEETHEFUTURE, "Privately view the top three cards of the draw pile."],
    [Card.BACK, ""],

    [Card.IMPLODING, ""],
    [Card.REVERSE, "Reverse the order of play and end your turn without drawing a card."],
    [Card.DRAWFROMBOTTOM, "End your turn by drawing the card at the bottom of the draw pile."],
    [Card.FERALCAT, "Use as any Cat Card."],
    [Card.ALTERTHEFUTURE, "Privately view and rearrange the top three cards of the draw pile."],
    [Card.TARGETEDATTACK, "End your turn and force the player of your choice to take two turns. Play continues from that player."]
])