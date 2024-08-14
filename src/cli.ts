#!/usr/bin/env node

require("ts-node").register();
const { startMockServer } = require("./index");

// Запуск mock-сервера
startMockServer();
