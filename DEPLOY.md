# Деплой на свой сервер (Ubuntu/Debian + Docker)

Сайт крутится в Docker за nginx с бесплатным SSL. База и файлы — на Supabase (на сервере ничего не хранится).

---

## 0. Предусловия
- Сервер Ubuntu/Debian, есть `root` или sudo-пользователь.
- Реальный домен: в DNS создай **A-запись** → IP сервера (и `www` тоже).
  Затем замени `turan-os.local` на свой домен в `deploy/nginx.conf` и `.env.production`.
- В Supabase выполнена схема `supabase-schema.sql` (см. конец файла).

---

## 1. Установить Docker (один раз)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # запускать docker без sudo
# выйди и зайди заново по SSH, чтобы группа применилась
docker --version && docker compose version
```

## 2. Получить код на сервер
Репозиторий приватный → нужен доступ. Самый простой способ — **deploy key**:
```bash
ssh-keygen -t ed25519 -C "server-deploy" -f ~/.ssh/turan_deploy -N ""
cat ~/.ssh/turan_deploy.pub
```
Скопируй вывод → в GitHub: репозиторий → **Settings → Deploy keys → Add deploy key**.

Настрой ssh и клонируй:
```bash
cat >> ~/.ssh/config <<'EOF'
Host github-turan
  HostName github.com
  User git
  IdentityFile ~/.ssh/turan_deploy
EOF

sudo mkdir -p /opt/turan-os && sudo chown $USER /opt/turan-os
git clone github-turan:ВАШ_ПОЛЬЗОВАТЕЛЬ/turan-os.git /opt/turan-os
cd /opt/turan-os
```

## 3. Переменные окружения
```bash
cp .env.example .env.production
nano .env.production   # впиши реальные значения (из локального .env.local)
```
> `.env.production` не попадёт в git.

## 4. Первый запуск
```bash
docker compose --env-file .env.production up -d --build
docker compose ps                # web должен быть Up
curl -I http://127.0.0.1:3000    # должен ответить
```

## 5. nginx + SSL
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

sudo cp deploy/nginx.conf /etc/nginx/sites-available/turan-os
sudo ln -s /etc/nginx/sites-available/turan-os /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# certbot сам впишет SSL и включит редирект на https
sudo certbot --nginx -d turan-os.local -d www.turan-os.local
```
Открой `https://turan-os.local`. Сертификат продлевается автоматически.

---

## Обновлять сайт дальше
После пуша нового кода в GitHub — на сервере:
```bash
cd /opt/turan-os && ./deploy/deploy.sh
```
Заберёт код, пересоберёт, перезапустит за ~1–2 минуты.

### (Опционально) Авто-деплой по пушу — «как на Vercel»
Добавь в GitHub секреты (**Settings → Secrets and variables → Actions**):
`SERVER_HOST` (IP), `SERVER_USER` (напр. root), `SERVER_SSH_KEY` (приватный SSH-ключ входа на сервер), `SERVER_PATH` (`/opt/turan-os`).
Дальше каждый пуш в `main` сам обновит сервер (`.github/workflows/deploy.yml`).

---

## Полезное
- Логи: `docker compose logs -f web`
- Перезапуск: `docker compose restart web`
- Контейнер сам поднимается после перезагрузки сервера.

## Схема БД (в Supabase SQL Editor)
Выполни весь `supabase-schema.sql` один раз в новом проекте. Затем создай
первого админа: `node scripts/seed-admin.mjs <email> <пароль> "<Имя>"`.

---

## Альтернатива: Vercel
Если решишь не возиться с сервером — импортируй репозиторий на vercel.com, добавь те же переменные окружения в Settings → Environment Variables, подключи домен. Деплой пойдёт сам от каждого пуша.
