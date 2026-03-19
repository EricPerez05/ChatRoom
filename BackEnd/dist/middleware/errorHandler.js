"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const apiError_1 = require("./apiError");
const notFoundHandler = (_req, _res, next) => {
    next(new apiError_1.ApiError(404, 'Route not found'));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof apiError_1.ApiError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error(message);
    res.status(500).json({ error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
