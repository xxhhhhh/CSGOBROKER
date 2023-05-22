var userLang = navigator.language || navigator.userLanguage;

if (userLang === 'ru' || userLang === 'ru-RU') {
  var currentUrl = window.location.href;

  if (currentUrl.indexOf('https://csgobroker.cc/') === 0) {
    var newUrl = 'https://csgobroker.cc/ru' + currentUrl.substr('https://csgobroker.cc/'.length);

    window.location.href = newUrl;
  }
}