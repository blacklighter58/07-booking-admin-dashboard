# Booking Desk Dashboard

Административная панель Booking Desk: заявки, календарь, услуги, сотрудники, клиенты и настройки. Панель использует JWT из sessionStorage и единый клиент API; пароль и API-ключи в браузер не передаются.

## Локальный запуск в Windows

Сначала запустите `09-booking-api` на порту `3002`, затем:

```powershell
cd "C:\Users\Михаил\Desktop\vibe-coding-summer-2026\landings\07-booking-admin-dashboard"
Copy-Item .env.example .env.local
corepack enable
pnpm install
pnpm dev
```

Откройте `http://localhost:5173`. Для локальной работы укажите адрес API в `VITE_API_URL`; для опубликованной панели укажите HTTPS-адрес API.

## Проверка сборки

```powershell
pnpm build
```

## Переменные окружения

Разрешена только одна публичная переменная: `VITE_API_URL`. Никогда не добавляйте в frontend `.env` API-ключ, JWT secret, пароль или Telegram token: любые `VITE_*` значения доступны в собранном JavaScript.

## Поведение при ошибках

Все запросы используют единый API-клиент с timeout, безопасной обработкой JSON/non-JSON и сетевых ошибок. При `401` JWT очищается один раз, затем пользователь возвращается на форму входа без цикла редиректов.

## Production checklist

1. В настройках хостинга задайте `VITE_API_URL=https://api.example.com`.
2. Запустите `npm run build` и публикуйте только содержимое `dist/` через статический HTTPS-хостинг.
3. Укажите production-домен Dashboard в `ALLOWED_ORIGIN` API без `*`.
4. Проверьте вход, обновление страницы, выход и ответ API `401` после очистки JWT.

Dashboard — vanilla JavaScript без React, поэтому `memo` и React lazy-loading к нему неприменимы. Запросы уже централизованы в `requestApi`, начальная загрузка защищена флагом `dashboardStarted`, а обзор отменяет предыдущий незавершённый запрос через `AbortController`.

## Стек и архитектура

- Vite и vanilla JavaScript;
- статическая сборка `dist/`;
- единый HTTP-клиент в `src/api/`;
- `VITE_API_URL` передаётся в сборку и указывает на `09-booking-api`.

## Deploy на Vercel

В репозитории есть `vercel.json` с настройками Vite: `npm install`, `npm run build` и каталог `dist`.

1. Импортируйте приватный GitHub-репозиторий `booking-admin-dashboard` в Vercel.
2. В **Environment Variables** добавьте `VITE_API_URL=https://<ваш-api-домен>` для Production.
3. Убедитесь, что этот же домен указан в `ALLOWED_ORIGIN` проекта `09-booking-api`.
4. Выполните Deploy и проверьте вход, обновление страницы и выход.

Не добавляйте в Vercel переменные `API_KEY`, `BOT_TOKEN`, `JWT_SECRET` или пароль: переменные с префиксом `VITE_` попадают в браузерную сборку.
