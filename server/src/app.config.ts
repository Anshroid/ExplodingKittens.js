import config from "@colyseus/tools";
import {monitor} from "@colyseus/monitor";
import {playground} from "@colyseus/playground";

import {GameRoom} from "./rooms/GameRoom";
import basicAuth from "express-basic-auth";
import {LobbyRoom} from "./rooms/LobbyRoom";

const basicAuthMiddleware = basicAuth({
    users: {
        "admin": process.env.AUTH_ADMIN,
    },
    challenge: true
})

export default config({

    initializeGameServer: (gameServer) => {

        gameServer.define('lobby_room', LobbyRoom);
        gameServer.define('game_room', GameRoom);

    },

    initializeExpress: (app) => {
        app.post("/token", async (req, res) => {
            const response = await fetch(`https://discord.com/api/oauth2/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: req.body.code,
                }),
            });

            const {access_token} = await response.json();

            res.send({access_token});
        });

        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground);
        }

        app.use("/colyseus", basicAuthMiddleware, monitor());
    },


    beforeListen: () => {
        /**
         * Before gameServer.listen() is called.
         */
    }
});