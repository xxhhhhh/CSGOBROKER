document.getElementById('search-form').addEventListener('submit', function(event) {
  event.preventDefault(); // Предотвращаем отправку формы

  var searchTerm = document.getElementById('search-input').value;
  searchPages(searchTerm);
});

function searchPages(searchTerm) {
  var pages = document.getElementsByTagName('a');
  var resultsContainer = document.getElementById('search-results');
  var results = [];

  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];
    if (page.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
      results.push(page);
    }
  }

  // Очищаем контейнер с результатами
  while (resultsContainer.firstChild) {
    resultsContainer.removeChild(resultsContainer.firstChild);
  }

  // Отображаем результаты поиска
  if (results.length > 0) {
    for (var j = 0; j < results.length; j++) {
      var result = document.createElement('p');
      result.textContent = results[j].textContent;
      resultsContainer.appendChild(result);
    }
  } else {
    var noResults = document.createElement('p');
    noResults.textContent = 'Ничего не найдено.';
    resultsContainer.appendChild(noResults);
  }
}
