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

  const getGonfig = () => {
    const configPath = path.resolve(process.cwd(), "src/mock.ts");
    const config = require(configPath).default;
    return { config, configPath };
  };

  /**
   * Настраивает маршруты на основе конфигурации.
   */
  function setupRoutes(config: any) {
    config.routes.forEach(
      (route: {
        path: string;
        data: any;
        method: string;
        timeout: number | null;
      }) => {
        // Функция для генерации данных
        const generateResponseData = () => {
          return typeof route.data === "string"
            ? generateDataFromType(getTypeFromConfig(route.data))
            : route.data;
        };

        // Общая функция для обработки запросов
        const handleRequest = (_: any, res: any) => {
          console.log(`[${route.method}] ${route.path}`);
          const responseData = generateResponseData();
          setTimeout(() => {
            res.json(responseData);
          }, route.timeout || 0);
        };

        // Установка маршрутов
        if (route.method === "GET") {
          app.get(route.path, handleRequest);
        } else if (route.method === "POST") {
          app.post(route.path, handleRequest);
        }

        console.log(route.path);
      }
    );
  }

  /**
   * Перезагружает маршруты при изменении конфигурации.
   */
  // TODO: сделать рабочей перезагрузку рутов
  // function reloadRoutes() {
  //   Object.keys(require.cache).forEach((id) => {
  //     if (id.endsWith("mock.ts")) {
  //       delete require.cache[id];
  //     }
  //   });
  //   setupRoutes(getGonfig().config);
  //   console.log("API запущено");
  // }

  const { config, configPath } = getGonfig();

  setupRoutes(getGonfig().config);

  // Отслеживаем изменения в mock.ts
  chokidar.watch(configPath).on("change", () => {
    console.log("mock.ts изменен. Требуется перезагрузка.");
    // reloadRoutes();
  });

  // Используем порт из конфигурации
  const PORT = config.port || 3000;

  // Генерация и подключение Swagger UI
  const swaggerSpec = generateSwaggerSpec();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Запуск HTTPS сервера
  https.createServer(options, app).listen(PORT, () => {
    console.log(`API - https://localhost:${PORT}`);
    console.log(`Swagger - https://localhost:${PORT}/api-docs`);
  });
}
