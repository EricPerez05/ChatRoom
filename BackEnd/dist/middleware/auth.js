"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authPlaceholder = void 0;
const authPlaceholder = (req, _res, next) => {
    const rawUserId = req.header('x-user-id');
    if (typeof rawUserId === 'string' && rawUserId.trim().length > 0) {
        req.user = { id: rawUserId.trim() };
    }
    next();
};
exports.authPlaceholder = authPlaceholder;
