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

// Imploding Kittens expansion
    IMPLODING,
    REVERSE,
    DRAWFROMBOTTOM,
    FERALCAT,
    ALTERTHEFUTURE,
    TARGETEDATTACK,
}

export const CardNames = new Map<Card, string>([ // TODO: remove this when we have a better solution
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

    [Card.IMPLODING, "Imploding Kitten"],
    [Card.REVERSE, "Reverse"],
    [Card.DRAWFROMBOTTOM, "Draw from the Bottom"],
    [Card.FERALCAT, "Feral Cat"],
    [Card.ALTERTHEFUTURE, "Alter the Future"],
    [Card.TARGETEDATTACK, "Targeted Attack"]
])