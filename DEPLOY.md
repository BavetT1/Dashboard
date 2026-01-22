# Инструкция по деплою (Home Server + Cloudflare)

## 1. Запуск приложения в Docker

Убедитесь, что на сервере установлен Docker.

1. Перейдите в папку проекта.
2. Соберите и запустите контейнер:
   ```bash
   sudo docker compose up -d --build
   ```
3. Ваше приложение будет доступно по адресу: **http://192.168.1.39:3005**

## 2. Настройка Cloudflare Tunnel

Это позволит "пробросить" ваш локальный сервер в интернет на домен `dashboard.ваш-домен.com`.

1. **Зайдите в Cloudflare Dashboard**:
   - Откройте раздел **Zero Trust**.
   - Networks -> **Tunnels**.
   - Нажмите **Create a Tunnel**.

2. **Создайте туннель**:
   - Connector: **Cloudflared**.
   - Назовите его (например, `home-server`).
   - Скопируйте команду установки Docker и запустите её на сервере.

3. **Настройка домена (Public Hostname)**:
   - **Service**: 
     - Type: `HTTP`
     - URL: `host.docker.internal:3005` (или `192.168.1.39:3005`)

## 3. Обновление версии (Скрипт обновления)

Если вы внесли изменения в код и хотите обновить сервер:

```bash
# 1. Заходим в папку
cd ~/dashboard

# 2. Сбрасываем возможные конфликты и обновляем код
git reset --hard
git pull origin main

# 3. Перезапускаем контейнер
sudo docker compose down
sudo docker compose up -d --build
```

### Решение проблем

Если `git pull` выдает ошибку 500 или не работает:
- Подождите пару минут и попробуйте снова (бывает, GitHub сбоит).
- Проверьте интернет на сервере (`ping google.com`).
- Если совсем не работает git, можно просто удалить папку и склонировать заново:
  ```bash
  cd ~
  rm -rf dashboard
  git clone https://github.com/BavetT1/Dashboard.git dashboard
  # Не забудьте заново создать .env.local!
  ```
