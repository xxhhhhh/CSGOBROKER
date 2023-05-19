// // Импортируйте необходимые модули
// const fs = require('fs');
// const path = require('path');

// // Определите функцию-обработчик запроса
// async function handleRequest(request) {
//   const query = new URL(request.url).searchParams.get('query');
//   const searchResults = await performSearch(query);
//   const response = new Response(JSON.stringify(searchResults), {
//     headers: { 'Content-Type': 'application/json' },
//   });
//   return response;
// }

// // Вспомогательная функция для выполнения поиска
// async function performSearch(query) {
//   const searchResults = [];

//   const reviewsDirectory = path.join(__dirname, 'reviews');

//   // Асинхронно читаем содержимое директории
//   const files = await fs.promises.readdir(reviewsDirectory);

//   // Итерация по файлам и выполнение поиска
//   for (const file of files) {
//     const filePath = path.join(reviewsDirectory, file);

//     // Асинхронно проверяем, является ли элемент файлом
//     const fileStat = await fs.promises.stat(filePath);
//     if (fileStat.isFile()) {
//       const url = `/reviews/${file}`;

//       // Проверка наличия совпадения с запросом
//       if (url.includes(query)) {
//         const result = { title: getTitleFromURL(url), url: url };
//         searchResults.push(result);
//       }
//     }
//   }

//   return searchResults;
// }

// // Вспомогательная функция для получения заголовка из URL-адреса
// function getTitleFromURL(url) {
//   const lastIndex = url.lastIndexOf('/');
//   const titleWithExtension = url.substring(lastIndex + 1);
//   const title = titleWithExtension.split('.')[0];
//   return title;
// }

// // Экспортируйте функцию-обработчик запроса
// addEventListener('fetch', event => {
//   event.respondWith(handleRequest(event.request));
// });


import { handleRequest } from './server.js'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
