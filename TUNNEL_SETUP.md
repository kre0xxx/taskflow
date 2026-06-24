# VSCode Tunnel Setup Guide

## Что такое VSCode Tunnel?
VSCode Tunnel позволяет получить удалённый доступ к VS Code и вашему приложению через безопасный туннель без необходимости открывать порты.

## Быстрый старт для локального режима (разработка)

### Backend
```bash
cd backend
npm install
npm start
```
Сервер запустится на `http://0.0.0.0:5002` и будет доступен через:
- `http://localhost:5002`
- `http://127.0.0.1:5002`
- VSCode туннели

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```
Приложение запустится на `http://0.0.0.0:5175` и будет доступно через:
- `http://localhost:5175`
- `http://127.0.0.1:5175`
- VSCode туннели

## Использование через VSCode Tunnel

### 1. Запустить VSCode Tunnel
```bash
# В корне проекта или в любой папке
code tunnel
```
VSCode выдаст URL вида: `https://yourname.tunnel.vscode.dev`

### 2. Настроить Backend для туннеля

**Создать `backend/.env`:**
```env
PORT=5002
VITE_FRONTEND_URL=https://yourname.tunnel.vscode.dev
TELEGRAM_BOT_TOKEN=your_token_here
```

**Запустить:**
```bash
cd backend
npm start
```

### 3. Настроить Frontend для туннеля

**Способ 1: Использовать переменную окружения (рекомендуется)**

**Создать `frontend/.env.local`:**
```env
VITE_API_URL=https://yourname.tunnel.vscode.dev/api
```

**Запустить:**
```bash
cd frontend
npm run dev
```

**Способ 2: Использовать параметры командной строки**
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Приложение автоматически определит туннель URL и подключится к API.

### 4. Проверка подключения
- Backend health check: `https://yourname.tunnel.vscode.dev/api/health`
- Frontend: `https://yourname.tunnel.vscode.dev:5175`

## Технические детали адаптации

### Backend (server.js)
- ✅ Слушает на `0.0.0.0:5002` вместо `localhost`
- ✅ CORS настроен для принятия туннель URL (`*.tunnel.vscode.dev`)
- ✅ Поддерживает настройку через переменные окружения

### Frontend (vite.config.js)
- ✅ Слушает на `0.0.0.0:5175` вместо `127.0.0.1`
- ✅ Proxy `/api` к backend с поддержкой WebSocket
- ✅ Поддерживает `VITE_API_URL` для туннелей

### Frontend (axiosConfig.js)
- ✅ Динамическое определение API URL
- ✅ Автоматическое использование туннель хоста
- ✅ Fallback на локальный proxy в dev режиме

## Решение проблем

### Проблема: CORS ошибка при подключении через туннель
**Решение:** 
1. Убедитесь, что `VITE_FRONTEND_URL` установлен правильно в `backend/.env`
2. Перезапустите backend
3. Проверьте консоль браузера - там должна быть информация об API URL

### Проблема: Cannot GET /
**Решение:** 
1. Frontend должен быть запущен на `http://0.0.0.0:5175`
2. Используйте `npm run dev -- --host 0.0.0.0`

### Проблема: API недоступен
**Решение:**
1. Проверьте, что оба сервиса запущены
2. В консоли браузера проверьте, какой API URL используется: 
   ```javascript
   console.log(axios.defaults.baseURL)
   ```
3. Проверьте health check: `https://yourname.tunnel.vscode.dev/api/health`

## Переменные окружения

### Backend (.env или backend/.env)
| Переменная | По умолчанию | Описание |
|-----------|--------------|---------|
| PORT | 5002 | Порт для backend |
| VITE_FRONTEND_URL | http://localhost:5175 | URL frontend для CORS |
| DB_HOST | localhost | MySQL хост |
| DB_USER | task_user | DB пользователь |
| DB_PASSWORD | task_password | DB пароль |
| DB_NAME | task_manager | Имя БД |

### Frontend (.env.local или frontend/.env.local)
| Переменная | По умолчанию | Описание |
|-----------|--------------|---------|
| VITE_API_URL | /api | API базовый URL |
| VITE_API_PORT | 5002 | Backend порт для туннелей |

## Примеры использования

### Локальная разработка
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```
Откройте `http://localhost:5175`

### Удалённая разработка через туннель
```bash
# Terminal 1 - Backend
cd backend
VITE_FRONTEND_URL=https://myname.tunnel.vscode.dev npm start

# Terminal 2 - Frontend
cd frontend
VITE_API_URL=https://myname.tunnel.vscode.dev/api npm run dev

# Terminal 3 - VSCode Tunnel (опционально)
code tunnel
```
Откройте `https://myname.tunnel.vscode.dev:5175`

## Безопасность

⚠️ **Важно:**
- Туннели VSCode требуют аутентификации для доступа
- Не коммитьте файлы `.env` с реальными значениями
- Используйте `.env.example` для документации переменных
- Все токены и пароли хранить в `.env` (в .gitignore)

## Дополнительные ресурсы

- [VSCode Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels)
- [Express and CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
