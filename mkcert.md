# Установка Mkcert

### Windows

**_Установите Chocolatey (если еще не установлен):_**

- Откройте командную строку от имени администратора.

- Введите следующую команду и нажмите Enter:

```bash
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
```

**_Установите mkcert:_**

```bash
choco install mkcert
```

**_Установите корневой сертификат:_**

```bash
mkcert -install
```

### macOS

**_Установите Homebrew (если еще не установлен):_**

Откройте терминал и введите:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**_Установите mkcert:_**

```bash
brew install mkcert
```

**_Установите корневой сертификат:_**

```bash
mkcert -install
```

### Linux

**_Установите mkcert:_**

> В зависимости от дистрибутива, используйте пакетный менеджер или скачайте бинарный файл с [GitHub](https://github.com/FiloSottile/mkcert/releases).

**_Для Ubuntu/Debian:_**

```bash
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

```bash
mkcert -install
```

# Использование Mkcert

**_Создание сертификата:_**

Перейдите в директорию вашего проекта.

```bash
cd path/to/your/project
```

**_Введите команду для создания сертификата:_**

```bash
mkcert example.com "\*.example.com" localhost 127.0.0.1 ::1
```

> Это создаст два файла: example.com.pem и example.com-key.pem.

### Примечания

> Mkcert создает сертификаты, которые действительны только для локальной разработки.

Убедитесь, что вы не используете эти сертификаты в производственной среде.

Mkcert [Документация](https://github.com/FiloSottile/mkcert).
