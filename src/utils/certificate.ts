import fs from "fs";
import { execSync } from "child_process";
import forge from "node-forge";

export function logCertificateExpiration(certPath: string) {
  try {
    const certPem = fs.readFileSync(certPath, "utf8");
    const cert = forge.pki.certificateFromPem(certPem);

    // const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;

    console.log(`Текущий сертификат валиден до: ${validTo}`);

    const now = new Date();
    if (now > validTo) {
      console.warn("Внимние: Сертификат просрочен.");
    } else {
      console.log("Сертификат валиден.");
    }
  } catch (error) {
    console.error("Ошибка чтения сертификата:", error);
  }
}

/**
 * Генерирует SSL-сертификаты, если они отсутствуют, и добавляет их в .gitignore.
 */
export function generateCertificates() {
  const certFile = "localhost.pem";
  const keyFile = "localhost-key.pem";
  const gitignoreFile = ".gitignore";

  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.log("Сертификаты отсутствуют. Генерация новых сертификатов...");
    try {
      execSync("mkcert -install", { stdio: "inherit" });
      execSync(`mkcert -key-file ${keyFile} -cert-file ${certFile} localhost`, {
        stdio: "inherit",
      });
      console.log("Сертификаты успешно созданы.");
    } catch (error) {
      console.error("Ошибка при генерации сертификатов:", error);
      process.exit(1);
    }
  } else {
    console.log("Сертификаты уже существуют.");
  }

  // Добавляем сертификаты в .gitignore, если они еще не добавлены
  const gitignoreEntry = `${certFile}\n${keyFile}\n`;
  if (fs.existsSync(gitignoreFile)) {
    const gitignoreContent = fs.readFileSync(gitignoreFile, "utf8");
    if (
      !gitignoreContent.includes(certFile) ||
      !gitignoreContent.includes(keyFile)
    ) {
      fs.appendFileSync(gitignoreFile, gitignoreEntry);
      console.log("Сертификаты добавлены в .gitignore.");
    }
  } else {
    fs.writeFileSync(gitignoreFile, gitignoreEntry);
    console.log(".gitignore создан и сертификаты добавлены.");
  }
}
