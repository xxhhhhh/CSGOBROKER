// Проверяем, был ли ранее сделан выбор пользователем
var userChoice = getCookie('languageChoice');

if (!userChoice) {
  // Получаем языковую настройку браузера пользователя
  var userLang = navigator.language || navigator.userLanguage;

  // Проверяем значение языковой настройки и перенаправляем на соответствующую страницу
  if (userLang === 'ru' || userLang === 'ru-RU') {
    // Получаем текущий URL-адрес
    var currentUrl = window.location.href;

    // Проверяем, содержит ли URL-адрес "https://csgobroker.cc/ru/"
    if (currentUrl.indexOf('https://csgobroker.cc/ru/') !== 0) {
      // Удаляем возможные повторяющиеся "/ru" в URL-адресе
      currentUrl = currentUrl.replace(/\/ru/g, '');

      // Формируем новый URL-адрес с добавленным '/ru/'
      var newUrl = 'https://csgobroker.cc/ru/' + currentUrl.substr('https://csgobroker.cc/'.length);

      // Перенаправляем на новый URL-адрес
      window.location.href = newUrl;
    }
  }
}

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
