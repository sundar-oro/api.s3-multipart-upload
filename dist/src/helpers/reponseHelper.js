"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccessResponse = sendSuccessResponse;
function sendSuccessResponse(c, status, message = "", data = []) {
    let responseBody = {
        success: true,
        message,
        status: status,
        data
    };
    c.status(status);
    return c.json(responseBody);
}
