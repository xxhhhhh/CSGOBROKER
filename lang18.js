var userChoice; // Объявляем переменную в глобальной области видимости

function handleLanguageRedirect() {
  userChoice = getCookie('languageChoice'); // Присваиваем значение переменной

  if (!userChoice && window.location.hostname !== 'localhost') {
    var userLang = navigator.language || navigator.userLanguage;

    if ((userLang === 'ru' || userLang === 'ru-RU') && window.location.pathname === '/') {
      var currentUrl = window.location.href;

      if (currentUrl === 'https://csgobroker.cc/') {
        var newUrl = currentUrl.replace('.cc/', '.cc/ru.html');

        if (newUrl !== currentUrl) {
          setCookie('languageChoice', 'ru', 365); // Устанавливаем куки с выбранным языком
          window.location.href = newUrl;
          return false;
        }
      }
    }
  }
}

// Обработчик события клика на элементах меню выбора языка
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('lang-switch')) {
    var selectedLang = event.target.dataset.lang;

    setCookie('languageChoice', selectedLang, 365);

    if (selectedLang !== userChoice) {
      userChoice = selectedLang; // Обновляем значение переменной userChoice
      location.reload();
    }
  }
});

function setCookie(name, value, days) {
  var expires = '';
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  
  // Добавляем атрибуты "SameSite=None" и "Secure" для поддержки сторонних контекстов
  var cookieString = name + '=' + value + expires + '; path=/; SameSite=None; Secure';
  document.cookie = cookieString;
}

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

handleLanguageRedirect();
