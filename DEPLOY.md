# Инструкция по деплою (Home Server + Cloudflare)

## 1. Запуск приложения в Docker

Убедитесь, что на сервере установлен Docker.

1. Перейдите в папку проекта.
2. Соберите и запустите контейнер:
   ```bash
   docker-compose up -d --build
   ```
3. Проверьте, что приложение работает локально: `http://localhost:3000`

## 2. Настройка Cloudflare Tunnel

Это позволит "пробросить" ваш локальный `http://localhost:3000` на домен `dashboard.ваш-домен.com`.

1. **Зайдите в Cloudflare Dashboard**:
   - Откройте раздел **Zero Trust** (в левом меню).
   - Networks -> **Tunnels**.
   - Нажмите **Create a Tunnel**.

2. **Создайте туннель**:
   - Connector: **Cloudflared**.
   - Назовите его (например, `home-server`).

3. **Установка коннектора**:
   - Cloudflare покажет команду для установки (Choose your environment -> Docker).
   - Скопируйте команду, она выглядит примерно так:
     ```bash
     docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <ВАШ_ТОКЕН>
     ```
   - Запустите эту команду на своем сервере! Туннель подключится (статус станет "Healthy").

4. **Настройка домена (Public Hostname)**:
   - Нажмите **Next** в Cloudflare.
   - **Public Hostname**:
     - Subdomain: `dashboard` (или как хотите)
     - Domain: `ваш-домен.com`
   - **Service**:
     - Type: `HTTP`
     - URL: `host.docker.internal:3000` (если туннель тоже в докере) ИЛИ `localhost:3000` (если туннель запущен просто в системе).
     
     *Совет: Если не заработает `localhost`, используйте IP адрес вашего компьютера в локальной сети, например `192.168.1.50:3000`.*

5. **Готово!**
   Открывайте `https://dashboard.ваш-домен.com`.

## 3. Обновление версии

Когда вы вносите изменения в код:

```bash
# Остановка
docker-compose down

# Получение обновлений (если через git)
git pull

# Пересборка и запуск
docker-compose up -d --build
```
