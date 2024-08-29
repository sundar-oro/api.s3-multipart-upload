"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const valibot_1 = require("valibot");
const appMessages_1 = require("../constants/appMessages");
const unprocessebleContentException_1 = require("../exceptions/unprocessebleContentException");
const validate = (schema, data) => {
    const validatedData = (0, valibot_1.safeParse)(schema, data, { abortPipeEarly: true });
    if (!validatedData.success) {
        const issues = (0, valibot_1.flatten)(validatedData.issues);
        throw new unprocessebleContentException_1.default(appMessages_1.VALIDATION_FAILED, issues.nested);
    }
    else {
        return validatedData.output;
    }
};
exports.default = validate;
