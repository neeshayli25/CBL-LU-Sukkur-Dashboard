"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMockApi = exports.apiClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "apiClient", { enumerable: true, get: function () { return client_1.apiClient; } });
var mock_1 = require("./mock");
Object.defineProperty(exports, "setupMockApi", { enumerable: true, get: function () { return mock_1.setupMockApi; } });
