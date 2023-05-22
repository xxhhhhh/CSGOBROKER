// Проверяем, был ли ранее сделан выбор пользователем
var userChoice = getCookie('languageChoice');

if (!userChoice && window.location.hostname !== 'localhost') {
  // Получаем языковую настройку браузера пользователя
  var userLang = navigator.language || navigator.userLanguage;

  // Проверяем значение языковой настройки и перенаправляем на соответствующую страницу
  if ((userLang === 'ru' || userLang === 'ru-RU') && !window.location.pathname.includes('/ru/')) {
    // Получаем текущий URL-адрес
    var currentUrl = window.location.href;

    // Удаляем первый слэш из пути, если есть
    var newPath = window.location.pathname.replace(/^\//, '');

    // Проверяем, отсутствует ли уже '/ru/' в текущем пути
    if (!newPath.startsWith('ru/')) {
      // Формируем новый URL-адрес с добавленным '/ru/'
      var newUrl = window.location.origin + '/ru/' + newPath;

      // Проверяем, является ли новый URL-адрес отличным от текущего
      if (newUrl !== window.location.href) {
        // Перенаправляем на новый URL-адрес
        window.location.href = newUrl;
      }
    }
  }
}

// Обработчик события клика на элементах меню выбора языка
document.addEventListener('click', function(event) {
  // Проверяем, был ли клик на элементе с классом "lang-switch"
  if (event.target.classList.contains('lang-switch')) {
    event.preventDefault(); // Предотвращаем переход по ссылке

    var selectedLang = event.target.dataset.lang; // Получаем выбранный язык из атрибута "data-lang"

    // Устанавливаем куку "languageChoice" с выбранным языком на 365 дней
    setCookie('languageChoice', selectedLang, 365);

    // Проверяем, является ли выбранный язык отличным от текущего
    if (selectedLang !== userChoice) {
      // Перезагружаем страницу для применения изменений языка
      location.reload();
    }
  }
});

// Функция для установки куки
function setCookie(name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + expires + '; path=/';
}

// Функция для получения значения куки
function getCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}
