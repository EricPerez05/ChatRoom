"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const requestLogger = (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        const logPayload = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs,
            ip: req.ip,
        };
        console.log(JSON.stringify(logPayload));
    });
    next();
};
exports.requestLogger = requestLogger;
