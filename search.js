const searchForm = document.querySelector('form');
const searchInput = document.querySelector('input[name="query"]');
const resultsContainer = document.querySelector('#results');

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const query = searchInput.value;
  
  fetch(`/search?query=${query}`)
    .then(response => response.json())
    .then(results => {
      showResults(results);
    })
    .catch(error => {
      console.error('Ошибка при выполнении поиска:', error);
    });
});

function showResults(results) {
  resultsContainer.innerHTML = '';
  
  if (results.length === 0) {
    resultsContainer.textContent = 'Ничего не найдено.';
    return;
  }
  
  const ul = document.createElement('ul');
  
  results.forEach(result => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = result.url;
    a.textContent = result.title;
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  resultsContainer.appendChild(ul);
}
