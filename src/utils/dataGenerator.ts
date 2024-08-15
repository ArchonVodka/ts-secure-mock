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

export function generateDataFromType(type: Type): any {
  if (type.isUnion() && !type.isBoolean()) {
    const unionTypes = type.getUnionTypes();
    const isNullable = unionTypes.some((t) => t.isNull());
    const nonNullTypes = unionTypes.filter((t) => !t.isNull());
    console.log(
      "union",
      unionTypes.map((t) => t.isNull())
    );

    // Если тип может быть null, случайно возвращаем null
    if (isNullable && faker.datatype.boolean()) {
      return null;
    }

    // Выбираем случайный не-null тип для генерации данных
    const randomType = faker.helpers.arrayElement(nonNullTypes);
    return generateDataFromType(randomType);
  }

  if (type.isTuple()) {
    return type.getTupleElements().map((t) => generateDataFromType(t));
  }

  if (type.isString()) {
    return faker.lorem.word();
  }

  if (type.isLiteral()) {
    return type.getLiteralValue();
  }

  if (type.isNumber()) {
    return faker.datatype.number();
  }

  if (type.isNumberLiteral()) {
    return type.getLiteralValue();
  }

  if (type.isBooleanLiteral() || type.isBoolean()) {
    return faker.datatype.boolean();
  }

  if (type.isNull()) {
    return null;
  }

  if (type.isUndefined() || type.isUnknown()) {
    return;
  }

  if (type.isEnum()) {
    const enumValues = type.getUnionTypes().map((t) => t.getLiteralValue());
    return faker.helpers.arrayElement(enumValues);
  }

  if (type.isObject() && !type.isArray()) {
    const properties = type.getProperties();
    const data: any = {};
    properties.forEach((prop) => {
      const propName = prop.getName();

      const valueDeclaration = prop.getValueDeclaration();
      if (valueDeclaration) {
        const propType = valueDeclaration.getType();
        data[propName] = generateDataFromType(propType);
      } else {
        data[propName] = `Unknown type for property: ${propName}`;
      }
    });
    return data;
  }

  if (type.isArray()) {
    const elementType = type.getArrayElementType();
    if (elementType) {
      // Генерируем массив с несколькими элементами
      return Array.from({ length: 3 }, () => generateDataFromType(elementType));
    }
    return [];
  }

  if (type.isTuple()) {
    const elementTypes = type.getTupleElements();
    return elementTypes.map((elementType) => generateDataFromType(elementType));
  }

  return `Unsupported type: ${type.getText()}`;
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
