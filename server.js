const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname)); // Используем текущую директорию (корень проекта) для статических файлов

app.get('/search', (req, res) => {
  const query = req.query.query;
  const searchResults = performSearch(query);
  res.json(searchResults);
});

function performSearch(query) {
  const searchResults = []; // Массив для хранения результатов поиска

  const reviewsDirectory = path.join(__dirname, 'reviews'); // Путь к папке с отзывами

  // Чтение содержимого директории
  fs.readdirSync(reviewsDirectory).forEach(file => {
    const filePath = path.join(reviewsDirectory, file);

    // Проверка, является ли элемент файлом
    if (fs.statSync(filePath).isFile()) {
      // Создание URL-адреса на основе пути к файлу и добавление его в массив
      const url = `/reviews/${file}`;

      // Проверка наличия совпадения с запросом
      if (url.includes(query)) {
        // Создание объекта результата и добавление его в массив
        const result = { title: getTitleFromURL(url), url: url };
        searchResults.push(result);
      }
    }
  });

  return searchResults; // Возвращение результатов поиска
}

// Вспомогательная функция для получения заголовка из URL-адреса
function getTitleFromURL(url) {
  // Ваш код для извлечения заголовка из URL-адреса
  // Верните соответствующий заголовок
  // Например, можно извлечь часть URL-адреса между последним слешем и расширением файла
  const lastIndex = url.lastIndexOf('/');
  const titleWithExtension = url.substring(lastIndex + 1);
  const title = titleWithExtension.split('.')[0]; // Извлечение части без расширения файла
  return title;
}

app.listen(52300, () => {
  console.log('Сервер запущен на порту 52330');
});