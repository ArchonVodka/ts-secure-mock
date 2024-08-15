# TS Secure Mock

TS Secure Mock is a tool for creating a local mock server with HTTPS support that automatically generates responses based on a TypeScript configuration. This library is useful for testing and development, allowing developers to quickly create API endpoints with mock data.

## Installation

1. **Install the library in your project**

   ```bash
   npm install path/to/mock-server-library
   ```

## WINDOWS: Installing mkcert

1. **Install Chocolatey (if not already installed):**

   1.1 **_Open the command prompt as an administrator._**

   1.2 **_Enter the following command and press Enter:_**

   ```bash
   @"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
   ```

2. **Install mkcert:**

   2.1 **_Open the command prompt as an administrator._**

   2.2 **_Enter the following command and press Enter:_**

   ```bash
   choco install mkcert
   ```

   2.3 **_Install the root certificate:_**

   After installing mkcert, enter the following command in the command prompt:

   ```bash
   mkcert -install
   ```

   This command will create and install a local root certificate, which will be used to create local certificates.

## Using

### Create a configuration file src/mock.ts in your project:

```typescript
// src/mock.ts

// Definition of Item type
export type Item = {
  id: number;
  name: string;
  price: number;
  available: boolean;
};

// API Configuration
export default {
  port: 3000, // Server port
  routes: [
    {
      method: "GET",
      path: "/api/data",
      data: { message: "some mock data" },
      timeout: 500,
    },
    {
      method: "POST",
      path: "/api/items",
      data: "Item", // Reference to the Item type (Important! To create responses based on types, their names must match.)
      timeout: 1000, // Timeout in milliseconds
    },
    {},
  ],
};
```

## **Starting the Server:**

**_Use the following command to start the mock server:_**

```bash
npx ts-secure-mock
```

The server will automatically generate SSL certificates if they are missing and add them to .gitignore.

**_Checking the Server:_**

Once started, the server will be available at https://localhost:3000 (or another port specified in the configuration).

## Supported types TypeScript

### Primitive

- `number` - as, `0`
- `string` - as, `""`
- `boolean` - as, `false`
- `Array<>` | `<primitive>[]` - as, `[]`
- `null` - as `null`
- `undefined` - as nothing

> Optional types can not be responded.
> Instead of this. use Union types - `Type | undefined`.

## TypeScript type using example

### Origin Type

```typescript
// src/mock.ts

export enum EnumType {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}

export type ExampleType = {
  literal: "1234";
  number: number;
  string: string;
  boolean: boolean;
  enum: EnumType;
  stringAndNullUnion: string | null;
  numberTuple: [number, number]; //tuple will be iterpreted by swagger as {[index]: value}
  numberAndStringTuple: [number, string];
  array: Array<{
    stringLiteralUnion: "active" | "inactive" | "pending";
  }>;
  enumArray: EnumType[];
  object: {
    objectAndNullUnion: {
      literal: "1234";
    } | null;
  };
  // optional?: string;
  optional: string | undefined;
};

export default {
  port: 3000,
  routes: [
    {
      method: "GET",
      path: "api/example",
      data: "ExampleType",
      timeout: 1000,
    },
  ],
};
```

### Response

```JSON
{
  "literal": "1234",
  "number": 74329,
  "string": "quidem",
  "boolean": false,
  "enum": "pending",
  "stringAndNullUnion": null,
  "numberTuple": [31346, 87526],
  "numberAndStringTuple": [53896, "illo"],
  "array": [
    {
      "stringLiteralUnion": "active"
    },
    {
      "stringLiteralUnion": "inactive"
    },
    {
      "stringLiteralUnion": "active"
    }
  ],
  "enumArray": [
    "active",
    "pending",
    "pending"
  ],
  "object": {
    "objectAndNullUnion": null
  }
}
```
