"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWriteRateLimiter = void 0;
const apiError_1 = require("./apiError");
const windows = new Map();
const createWriteRateLimiter = (maxRequestsPerMinute) => {
    return (req, _res, next) => {
        const now = Date.now();
        const windowMs = 60 * 1000;
        const key = `${req.ip}:${req.path}`;
        const current = windows.get(key);
        if (!current || now > current.resetAt) {
            windows.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        if (current.count >= maxRequestsPerMinute) {
            next(new apiError_1.ApiError(429, 'Rate limit exceeded for write requests'));
            return;
        }
        current.count += 1;
        windows.set(key, current);
        next();
    };
};
exports.createWriteRateLimiter = createWriteRateLimiter;
