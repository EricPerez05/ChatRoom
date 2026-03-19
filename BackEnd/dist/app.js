"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const apiRoutes_1 = require("./routes/apiRoutes");
const appContext_1 = require("./services/appContext");
const createApp = (options = {}) => {
    const app = (0, express_1.default)();
    return createAppInternal(app, options);
};
exports.createApp = createApp;
const createAppInternal = async (app, options) => {
    const context = options.context || await (0, appContext_1.createAppContext)();
    app.use((0, cors_1.default)({ origin: [env_1.env.corsOrigin] }));
    app.use(express_1.default.json());
    if (options.enableRequestLogging ?? true) {
        app.use(requestLogger_1.requestLogger);
    }
    app.use(auth_1.authPlaceholder);
    const { router: apiRouter, controller } = (0, apiRoutes_1.createApiRouter)(context, env_1.env.maxWriteRequestsPerMinute);
    app.get('/', controller.getRoot);
    app.get('/health', controller.getHealth);
    app.use('/api', apiRouter);
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return { app, context };
};
