import path from "path";
import { Type } from "ts-morph";
import { getTypeFromConfig } from "./dataGenerator";
import { faker } from "@faker-js/faker";

// Интерфейс для маршрута
interface RouteConfig {
  method: string;
  path: string;
  data: string | object;
  timeout?: number;
  iterable?: number;
}

// Интерфейс для конфигурации сервера
interface ServerConfig {
  port: number;
  routes: RouteConfig[];
}

/**
 * Генерирует спецификацию Swagger на основе конфигурации маршрутов.
 */
export function generateSwaggerSpec(): any {
  // Путь к конфигурации
  const configPath: string = path.resolve(process.cwd(), "src/mock.ts");
  let config: ServerConfig = require(configPath).default;

  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: "Mock Server API",
      version: "1.0.0",
    },
    paths: {} as Record<string, any>,
    components: {
      schemas: {} as Record<string, any>,
    },
  };

  config.routes.forEach((route: RouteConfig) => {
    const path = route.path;
    const method = route.method.toLowerCase();
    let responseSchema;

    if (typeof route.data === "string") {
      responseSchema = { $ref: `#/components/schemas/${route.data}` };
      const type = getTypeFromConfig(route.data);
      swaggerDefinition.components.schemas[route.data] =
        convertTypeToSchema(type);
    } else {
      responseSchema = convertJsonToSchema(route.data);
    }

    if (!swaggerDefinition.paths[path]) {
      swaggerDefinition.paths[path] = {};
    }

    swaggerDefinition.paths[path][method] = {
      summary: `Mock ${method.toUpperCase()} ${path}`,
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: responseSchema,
            },
          },
        },
      },
    };
  });

  return swaggerDefinition;
}

/**
 * Преобразует TypeScript тип в OpenAPI схему.
 * @param type Тип данных
 * @returns Схема OpenAPI
 */
function convertTypeToSchema(type: Type): any {
  if (type.isEnum()) {
    const enumValues = type.getUnionTypes().map((t) => t.getLiteralValue());
    return {
      type: "enum",
      enum: enumValues,
    };
  }
  if (type.isUnion() && !type.isBoolean()) {
    const unionTypes = type.getUnionTypes();
    const isNullable = unionTypes.some((t) => t.isNull() || t.isUndefined());
    const nonNullTypes = unionTypes.filter((t) => !t.isNull());

    // if (nonNullTypes.length < 0) {
    const schema = convertTypeToSchema(
      faker.helpers.arrayElement(nonNullTypes)
    );
    if (isNullable) {
      schema.nullable = true;
    }
    return schema;
  }
  // }
  if (type.isTuple()) {
    console.log(type.getTupleElements().map((t) => convertTypeToSchema(t)));
    console.log({
      isString: type.isString(),
      isLiteral: type.isLiteral(),
      isArray: type.isArray(),
      isObject: type.isObject(),
    });

    const properties: Record<string, any> = {};
    type.getTupleElements().forEach((prop, index) => {
      properties[index] = convertTypeToSchema(prop);
    });

    console.log("props obj", properties);

    return {
      type: "object",
      // items: type.getTupleElements().map((t) => convertTypeToSchema(t)),
      properties: properties,
    };
  }

  if (type.isString()) {
    return { type: "string" };
  }

  if (type.isNull() || type.isUndefined()) {
    return { type: "null" };
  }

  if (type.isLiteral()) {
    const literal = type.getLiteralValue();
    return { type: typeof literal, value: literal };
  }
  if (type.isNumber()) {
    return { type: "number" };
  }
  if (type.isBoolean()) {
    return { type: "boolean" };
  }
  if (type.isArray()) {
    const elementType = type.getArrayElementTypeOrThrow();
    return {
      type: "array",
      items: convertTypeToSchema(elementType),
    };
  }

  if (type.isObject() && !type.isArray() && !type.isLiteral()) {
    const properties: Record<string, any> = {};
    type.getProperties().forEach((prop) => {
      const propName = prop.getName();
      const valueDeclaration = prop.getValueDeclaration();
      if (valueDeclaration) {
        const propType = valueDeclaration.getType();
        properties[propName] = convertTypeToSchema(propType);
      }
    });
    return { type: "object", properties };
  }
  return {};
}

/**
 * Преобразует JSON-структуру в OpenAPI схему.
 * @param json JSON-структура
 * @returns Схема OpenAPI
 */
export function convertJsonToSchema(json: any): any {
  if (typeof json === "string") {
    return { type: "string" };
  } else if (typeof json === "number") {
    return { type: "number" };
  } else if (typeof json === "boolean") {
    return { type: "boolean" };
  } else if (Array.isArray(json)) {
    return {
      type: "array",
      items: json.length > 0 ? convertJsonToSchema(json[0]) : {},
    };
  } else if (typeof json === "object" && json !== null) {
    const properties: any = {};
    for (const key in json) {
      properties[key] = convertJsonToSchema(json[key]);
    }
    return { type: "object", properties };
  }
  return {};
}
