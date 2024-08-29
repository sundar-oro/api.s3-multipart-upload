"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseException_1 = require("./baseException");
class UnprocessableContentException extends baseException_1.default {
    constructor(message, errData) {
        super(message, 422, errData, true);
    }
}
exports.default = UnprocessableContentException;
