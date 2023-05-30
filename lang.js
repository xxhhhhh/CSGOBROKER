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

  var xhr8 = new XMLHttpRequest();
  xhr8.onreadystatechange = function() {
    if (xhr8.readyState === XMLHttpRequest.DONE) {
      if (xhr8.status === 200) {
        var divToImport = document.getElementById('caseopening-csgo');
        if (divToImport) {
          divToImport.innerHTML = xhr8.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr8.open('GET', '/multitop/csgo/caseopening.html', true);
  xhr8.send();

  var xhr9 = new XMLHttpRequest();
  xhr9.onreadystatechange = function() {
    if (xhr9.readyState === XMLHttpRequest.DONE) {
      if (xhr9.status === 200) {
        var divToImport = document.getElementById('casino-csgo');
        if (divToImport) {
          divToImport.innerHTML = xhr9.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr9.open('GET', '/multitop/csgo/casino.html', true);
  xhr9.send();

  var xhr10 = new XMLHttpRequest();
  xhr10.onreadystatechange = function() {
    if (xhr10.readyState === XMLHttpRequest.DONE) {
      if (xhr10.status === 200) {
        var divToImport = document.getElementById('coinflip-csgo');
        if (divToImport) {
          divToImport.innerHTML = xhr10.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr10.open('GET', '/multitop/csgo/coinflip.html', true);
  xhr10.send();

  var xhr11 = new XMLHttpRequest();
  xhr11.onreadystatechange = function() {
    if (xhr11.readyState === XMLHttpRequest.DONE) {
      if (xhr11.status === 200) {
        var divToImport = document.getElementById('crash-csgo');
        if (divToImport) {
          divToImport.innerHTML = xhr11.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr11.open('GET', '/multitop/csgo/crash.html', true);
  xhr11.send();

  var dicecsgo = new XMLHttpRequest();
  dicecsgo.onreadystatechange = function() {
    if (dicecsgo.readyState === XMLHttpRequest.DONE) {
      if (dicecsgo.status === 200) {
        var divToImport = document.getElementById('dice-csgo');
        if (divToImport) {
          divToImport.innerHTML = dicecsgo.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  dicecsgo.open('GET', '/multitop/csgo/dice.html', true);
  dicecsgo.send();

  var earnbyplaycsgo = new XMLHttpRequest();
  earnbyplaycsgo.onreadystatechange = function() {
    if (earnbyplaycsgo.readyState === XMLHttpRequest.DONE) {
      if (earnbyplaycsgo.status === 200) {
        var divToImport = document.getElementById('earn-by-play-csgo');
        if (divToImport) {
          divToImport.innerHTML = earnbyplaycsgo.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  earnbyplaycsgo.open('GET', '/multitop/csgo/earn-by-play-csgo.html', true);
  earnbyplaycsgo.send();
}
