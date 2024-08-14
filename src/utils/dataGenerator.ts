import { Project, Type } from "ts-morph";
import { faker } from "@faker-js/faker";
import path from "path";

// Инициализация проекта для работы с TypeScript
const project = new Project({
  tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
});

/**
 * Генерирует фиктивные данные на основе типа TypeScript.
 * @param type Тип данных
 * @returns Сгенерированные данные
 */
export function generateDataFromType(type: Type, depth: number = 0): any {
  if (depth > 5) {
    return "Max depth reached"; // Предотвращение бесконечной рекурсии
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const results = [];

    // Генерируем данные для всех подтипов в объединении
    for (const unionType of unionTypes) {
      const result = generateDataFromType(unionType, depth + 1);
      if (result !== undefined) {
        results.push(result);
      }
    }

    // Если есть null, добавляем его отдельно
    if (unionTypes.some((t) => t.isNull())) {
      results.push(null);
    }

    // Возвращаем массив сгенерированных данных
    return results;
  }

  if (type.isString()) {
    return faker.lorem.word();
  } else if (type.isNumber()) {
    return faker.datatype.number();
  } else if (type.isBoolean()) {
    return faker.datatype.boolean();
  } else if (type.isNull()) {
    return null;
  } else if (type.isEnum()) {
    const enumValues = type.getUnionTypes().map((t) => t.getLiteralValue());
    return faker.helpers.arrayElement(enumValues);
  } else if (type.isObject() && !type.isArray()) {
    const properties = type.getProperties();
    const data: any = {};
    properties.forEach((prop) => {
      const propName = prop.getName();
      const valueDeclaration = prop.getValueDeclaration();
      if (valueDeclaration) {
        const propType = valueDeclaration.getType();
        data[propName] = generateDataFromType(propType, depth + 1);
      } else {
        data[propName] = `Unknown type for property: ${propName}`;
      }
    });
    return data;
  } else if (type.isArray()) {
    const elementType = type.getArrayElementType();
    if (elementType) {
      // Генерируем массив с элементами, включая все возможные подтипы
      const elementResults = generateDataFromType(elementType, depth + 1);
      if (Array.isArray(elementResults)) {
        return elementResults;
      } else {
        return [elementResults];
      }
    }
    return [];
  } else if (type.isTuple()) {
    const elementTypes = type.getTupleElements();
    return elementTypes.map((elementType) =>
      generateDataFromType(elementType, depth + 1)
    );
  } else {
    return `Unsupported type: ${type.getText()}`;
  }
}

/**
 * Получает тип данных из файла конфигурации.
 * @param typeName Имя типа
 * @returns Тип данных
 */
export function getTypeFromConfig(typeName: string): Type {
  const sourceFile = project.getSourceFileOrThrow(
    path.resolve(process.cwd(), "src/mock.ts")
  );
  const typeAlias = sourceFile.getTypeAliasOrThrow(typeName);
  return typeAlias.getType();
}
