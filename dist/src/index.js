"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const appMessages_1 = require("./constants/appMessages");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const multipartUpload_1 = require("./routes/multipartUpload");
const app_1 = require("../config/app");
const app = new hono_1.Hono();
app.use("*", (0, cors_1.cors)());
app.use((0, logger_1.logger)());
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
app.route('/' + app_1.default.app.api_version + '/multipart-upload', multipartUpload_1.multiPart);
console.log(`Server is running on port ${app_1.default.app.port}`);
app.onError((err, c) => {
    c.status(err.status || 500);
    return c.json({
        success: false,
        status: err.status || 500, // if you get 500 you are the worst person in the world
        message: err.message || appMessages_1.SOMETHING_WENT_WRONG,
        errors: err.errData || null
    });
});
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: app_1.default.app.port
});
