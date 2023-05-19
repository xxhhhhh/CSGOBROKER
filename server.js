export { handleRequest };

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  const searchResults = performSearch(query);
  const response = {
    results: searchResults
  };
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function performSearch(query) {
  const searchResults = []; // Массив для хранения результатов поиска

  const reviewsDirectory = '/reviews'; // Путь к папке с отзывами

  // Чтение содержимого директории
  const fileList = getFilesInDirectory(reviewsDirectory);
  fileList.forEach(file => {
    // Создание URL-адреса на основе пути к файлу и добавление его в массив
    const url = `/reviews/${file}`;

    // Проверка наличия совпадения с запросом
    if (url.includes(query)) {
      // Создание объекта результата и добавление его в массив
      const result = { title: getTitleFromURL(url), url: url };
      searchResults.push(result);
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

// Вспомогательная функция для получения списка файлов в директории
function getFilesInDirectory(directory) {
  const fileList = [];
  const prefix = 'workers-site';
  const files = WORKERSKV.getWithMetadata(prefix + directory, { type: 'json' }).metadata.contents;
  for (const file of files) {
    fileList.push(file.name);
  }
  return fileList;
}
