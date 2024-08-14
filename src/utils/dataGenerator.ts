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
export function generateDataFromType(
  type: Type,
  ensureNumber: boolean = false
): any {
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const isNullable = unionTypes.some((t) => t.isNull());
    const nonNullTypes = unionTypes.filter((t) => !t.isNull());

    // Если ensureNumber установлен и тип включает number, возвращаем number
    if (ensureNumber && nonNullTypes.some((t) => t.isNumber())) {
      return faker.datatype.number();
    }

    // Если тип может быть null, случайно возвращаем null
    if (isNullable && Math.random() < 0.5) {
      return null;
    }

    // Выбираем случайный не-null тип для генерации данных
    const randomType = faker.helpers.arrayElement(nonNullTypes);
    return generateDataFromType(randomType, ensureNumber);
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
        data[propName] = generateDataFromType(propType, ensureNumber);
      } else {
        data[propName] = `Unknown type for property: ${propName}`;
      }
    });
    return data;
  } else if (type.isArray()) {
    const elementType = type.getArrayElementType();
    if (elementType) {
      // Генерируем массив с несколькими элементами
      return Array.from({ length: 3 }, () =>
        generateDataFromType(elementType, ensureNumber)
      );
    }
    return [];
  } else if (type.isTuple()) {
    const elementTypes = type.getTupleElements();
    return elementTypes.map((elementType, index) =>
      generateDataFromType(elementType, index === 0)
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
