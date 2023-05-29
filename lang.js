var userChoice = getCookie('languageChoice'); // Получаем значение выбранного языка из куки

function handleLanguageRedirect() {
  if (!userChoice && window.location.hostname !== 'localhost') {
    var userLang = navigator.language || navigator.userLanguage;

    if ((userLang === 'ru' || userLang === 'ru-RU') && window.location.pathname === '/') {
      var currentUrl = window.location.href;

      if (currentUrl === 'https://csgobroker.cc/') {
        var newUrl = currentUrl.replace('.cc/', '.cc/ru.html');

        if (newUrl !== currentUrl) {
          userChoice = 'ru'; // Устанавливаем выбранный язык в переменную userChoice
          setCookie('languageChoice', userChoice, 365); // Сохраняем выбранный язык в куки
          window.location.href = newUrl;
          return false;
        }
      }
    }
  } else if (userChoice === 'ru' && window.location.pathname === '/') {
    var currentUrl = window.location.href;
    var newUrl = currentUrl.replace('.cc/', '.cc/ru.html');

    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
      return false;
    }
  }
}

// Обработчик события клика на элементах меню выбора языка
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('lang-switch')) {
    var selectedLang = event.target.dataset.lang;

    setCookie('languageChoice', selectedLang, 365);
    userChoice = selectedLang; // Обновляем значение переменной userChoice

    if (selectedLang !== userChoice) {
      location.reload();
    } else if (selectedLang === 'ru' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/ru.html');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
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


function importDivContent() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var divToImport = document.getElementById('csgo-best-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };

  xhr.open('GET', '/multitop/csgo-best-sites.html', true);
  xhr.send();

  var xhr2 = new XMLHttpRequest();
  xhr2.onreadystatechange = function() {
    if (xhr2.readyState === XMLHttpRequest.DONE) {
      if (xhr2.status === 200) {
        var divToImport = document.getElementById('freebies-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr2.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };

  xhr2.open('GET', '/multitop/freebies-sites.html', true);
  xhr2.send();

  var xhr3 = new XMLHttpRequest();
  xhr3.onreadystatechange = function() {
    if (xhr3.readyState === XMLHttpRequest.DONE) {
      if (xhr3.status === 200) {
        var divToImport = document.getElementById('earning-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr3.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr3.open('GET', '/multitop/earning-sites.html', true);
  xhr3.send();

  var xhr4 = new XMLHttpRequest();
  xhr4.onreadystatechange = function() {
    if (xhr4.readyState === XMLHttpRequest.DONE) {
      if (xhr4.status === 200) {
        var divToImport = document.getElementById('rust-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr4.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr4.open('GET', '/multitop/rust-sites.html', true);
  xhr4.send();

  var xhr5 = new XMLHttpRequest();
  xhr5.onreadystatechange = function() {
    if (xhr5.readyState === XMLHttpRequest.DONE) {
      if (xhr5.status === 200) {
        var divToImport = document.getElementById('dota-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr5.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr5.open('GET', '/multitop/dota-sites.html', true);
  xhr5.send();

  var xhr6 = new XMLHttpRequest();
  xhr6.onreadystatechange = function() {
    if (xhr6.readyState === XMLHttpRequest.DONE) {
      if (xhr6.status === 200) {
        var divToImport = document.getElementById('crypto-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr6.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr6.open('GET', '/multitop/crypto-sites.html', true);
  xhr6.send();

  var xhr7 = new XMLHttpRequest();
  xhr7.onreadystatechange = function() {
    if (xhr7.readyState === XMLHttpRequest.DONE) {
      if (xhr7.status === 200) {
        var divToImport = document.getElementById('buy-skins-csgo');
        if (divToImport) {
          divToImport.innerHTML = xhr7.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr7.open('GET', '/multitop/csgo/buy-skins.html', true);
  xhr7.send();
}
