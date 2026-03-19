"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const app_1 = require("./app");
const bootstrap = async () => {
    const { app } = await (0, app_1.createApp)();
    app.listen(env_1.env.port, () => {
        console.log(`ChatRoom backend listening on http://localhost:${env_1.env.port}`);
    });
};
void bootstrap();
