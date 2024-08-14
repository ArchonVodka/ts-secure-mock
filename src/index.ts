import express from "express";
import fs from "fs";
import https from "https";
import chokidar from "chokidar";
import path from "path";
import {
  generateCertificates,
  logCertificateExpiration,
} from "./utils/certificate";
import { generateDataFromType, getTypeFromConfig } from "./utils/dataGenerator";
import swaggerUi from "swagger-ui-express";
import { generateSwaggerSpec } from "./utils/swagger";
// import swaggerJsdoc from "swagger-jsdoc";

/**
 * Запускает mock-сервер на основе конфигурации из файла mock.ts.
 */
export function startMockServer() {
  const app = express();

  // Генерация сертификатов
  generateCertificates();

  const options = {
    key: fs.readFileSync("localhost-key.pem"),
    cert: fs.readFileSync("localhost.pem"),
  };

  // Логирование информации о сертификате
  logCertificateExpiration("localhost.pem");

  // Загружаем конфигурацию
  const configPath = path.resolve(process.cwd(), "src/mock.ts");
  const config = require(configPath).default;

  /**
   * Настраивает маршруты на основе конфигурации.
   */
  function setupRoutes() {
    config.routes.forEach((route: any) => {
      const responseData =
        typeof route.data === "string"
          ? generateDataFromType(getTypeFromConfig(route.data))
          : route.data;

      const responseArray =
        typeof route.iterable === "number"
          ? Array(route.iterable).fill(responseData)
          : responseData;

      if (route.method === "GET") {
        app.get(route.path, (req, res) => {
          console.log(`Выполнение - [GET]${route.path}`);
          setTimeout(() => {
            res.json(responseArray);
          }, route.timeout || 0);
        });
      } else if (route.method === "POST") {
        app.post(route.path, (req, res) => {
          console.log(`Выполнение - [POST]${route.path}`);

          setTimeout(() => {
            res.json(responseArray);
          }, route.timeout || 0);
        });
      }
      console.log(route.path);
    });
  }

  /**
   * Перезагружает маршруты при изменении конфигурации.
   */
  function reloadRoutes() {
    Object.keys(require.cache).forEach((id) => {
      if (id.endsWith("mock.ts")) {
        delete require.cache[id];
      }
    });
    setupRoutes();
    console.log("API запущено");
  }

  setupRoutes();

  // Отслеживаем изменения в mock.ts
  chokidar.watch(configPath).on("change", () => {
    console.log("mock.ts изменен. Перезагрузка API...");
    reloadRoutes();
  });

  // Используем порт из конфигурации
  const PORT = config.port || 3000;

  // Генерация и подключение Swagger UI
  const swaggerSpec = generateSwaggerSpec();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Запуск HTTPS сервера
  https.createServer(options, app).listen(PORT, () => {
    console.log(`Создано на https://localhost:${PORT}`);
    console.log(`Swagger UI доступен на https://localhost:${PORT}/api-docs`);
  });
}
