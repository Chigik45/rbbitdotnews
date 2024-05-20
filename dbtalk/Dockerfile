# Используй официальный образ Node.js Node.js 15.14.0
FROM node:16

# Установи рабочую директорию в контейнере
WORKDIR /usr/src/app

# Копируй файлы package.json и package-lock.json
COPY package*.json ./

# Установи зависимости
RUN npm install

# Копируй остальные файлы проекта
COPY . .

# Открой порт 8080
EXPOSE 3001

# Запусти приложение
CMD [ "node", "index.js" ]
