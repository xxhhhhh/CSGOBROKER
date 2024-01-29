var userChoice = getCookie('languageChoice');

function getLanguagePrefix() {
  var userLang = navigator.language || navigator.userLanguage;
  var langPrefix = '';

  switch (userLang.toLowerCase()) {
    case 'ru':
    case 'ru-ru':
      langPrefix = 'ru';
      break;
    case 'pt':
    case 'pt-br':
      langPrefix = 'pt';
      break;
    case 'es':
    case 'es-es':
      langPrefix = 'es';
      break;
    case 'tr':
    case 'tr-tr':
      langPrefix = 'tr';
      break;
    case 'hi':
    case 'hi-in':
      langPrefix = 'hi';
      break;
    default:
      langPrefix = 'en';
  }

  return langPrefix;
}

function handleLanguageRedirect() {
  if (!userChoice && window.location.pathname === '/') {
    var langPrefix = getLanguagePrefix();

    if (langPrefix !== 'en') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace(/\.co\//g, '/' + langPrefix + '/');
      newUrl = newUrl.replace(/\.cc\//g, '/' + langPrefix + '/');      

      if (newUrl !== currentUrl) {
        userChoice = langPrefix;
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
  }
  else if (userChoice && window.location.pathname === '/') {
    var currentUrl = window.location.href;

    if (userChoice !== 'en') {
      var langPrefix = userChoice;
      var newUrl = currentUrl.replace(/\.co\//g, '/' + langPrefix + '/');
      newUrl = newUrl.replace(/\.cc\//g, '/' + langPrefix + '/');      

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
        return false;
      }
    } else {
      var newUrl = currentUrl.replace(/\.co\//g, '.co/');
      newUrl = newUrl.replace(/\.cc\//g, '.cc/');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
        return false;
      }
    }
  }
}

document.addEventListener('click', function(event) {
  if (event.target.classList.contains('lang-switch')) {
    var selectedLang = event.target.dataset.lang;

    setCookie('languageChoice', selectedLang, 365);
    userChoice = selectedLang;

    if (selectedLang !== userChoice) {
      location.reload();
    } else if (selectedLang !== 'en' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace(/\.co\//g, '.co/' + selectedLang + '/');
      newUrl = newUrl.replace(/\.cc\//g, '.cc/' + selectedLang + '/');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
    } else if (selectedLang === 'en' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace(/\.co\//g, '.co/');
      newUrl = newUrl.replace(/\.cc\//g, '.cc/');

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

function sendRequest(url, targetId) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var divToImport = document.getElementById(targetId);
        if (divToImport) {
          divToImport.innerHTML = xhr.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
}

var requests = [
  { url: '/multitop/csgo-best-sites.html', targetId: 'csgo-best-sites' },
  { url: '/multitop/freebies-sites.html', targetId: 'freebies-sites' },
  { url: '/multitop/earning-sites.html', targetId: 'earning-sites' },
  { url: '/multitop/rust-sites.html', targetId: 'rust-sites' },
  { url: '/multitop/dota-sites.html', targetId: 'dota-sites' },
  { url: '/multitop/newest-sites.html', targetId: 'newest-sites-list' },
  { url: '/multitop/crypto-sites.html', targetId: 'crypto-sites' },
  { url: '/multitop/csgo/buy-skins.html', targetId: 'buy-skins-csgo' },
  { url: '/multitop/csgo/caseopening.html', targetId: 'caseopening-csgo' },
  { url: '/multitop/csgo/case-battle.html', targetId: 'case-battle-csgo' },
  { url: '/multitop/csgo/casino.html', targetId: 'casino-csgo' },
  { url: '/multitop/csgo/coinflip.html', targetId: 'coinflip-csgo' },
  { url: '/multitop/csgo/crash.html', targetId: 'crash-csgo' },
  { url: '/multitop/csgo/dice.html', targetId: 'dice-csgo' },
  { url: '/multitop/csgo/earn-by-play-csgo.html', targetId: 'earn-by-play-csgo' },
  { url: '/multitop/csgo/instant-sell.html', targetId: 'instant-sell-csgo' },
  { url: '/multitop/csgo/jackpot.html', targetId: 'jackpot-csgo' },
  { url: '/multitop/csgo/marketplaces.html', targetId: 'marketplaces-csgo' },
  { url: '/multitop/csgo/matchbetting.html', targetId: 'matchbetting-csgo' },
  { url: '/multitop/csgo/roulette.html', targetId: 'roulette-csgo' },
  { url: '/multitop/csgo/sell-skins.html', targetId: 'sell-skins-csgo' },
  { url: '/multitop/csgo/trade-skins.html', targetId: 'trade-skins-csgo' },
  { url: '/multitop/csgo/upgrader.html', targetId: 'upgrader-csgo' },
  { url: '/multitop/earning/earn-by-play.html', targetId: 'earn-by-play-sites' },
  { url: '/multitop/earning/offerwalls.html', targetId: 'offerwalls-list' },
  { url: '/multitop/freebies/daily-rewards.html', targetId: 'daily-rewards-list' },
  { url: '/multitop/freebies/deposit-bonuses.html', targetId: 'deposit-bonuses-list' },
  { url: '/multitop/freebies/giveaways.html', targetId: 'giveaways-list' },
  { url: '/multitop/freebies/sign-up-bonuses.html', targetId: 'sign-up-bonuses-list' },
  { url: '/multitop/steam/levelup.html', targetId: 'levelup-list' },
  { url: '/multitop/steam/buy-games.html', targetId: 'buygames-list' },
  { url: '/multitop/crypto/casino.html', targetId: 'casino-crypto' },
  { url: '/multitop/crypto/coinflip.html', targetId: 'coinflip-crypto' },
  { url: '/multitop/crypto/crash.html', targetId: 'crash-crypto' },
  { url: '/multitop/crypto/matchbetting.html', targetId: 'matchbetting-crypto' },
  { url: '/multitop/crypto/roulette.html', targetId: 'roulette-crypto' },
  { url: '/multitop/rust/buy-skins.html', targetId: 'buy-skins-rust' },
  { url: '/multitop/rust/caseopening.html', targetId: 'caseopening-rust' },
  { url: '/multitop/rust/case-battle.html', targetId: 'case-battle-rust' },
  { url: '/multitop/rust/coinflip.html', targetId: 'coinflip-rust' },
  { url: '/multitop/rust/crash.html', targetId: 'crash-rust' },
  { url: '/multitop/rust/instant-sell.html', targetId: 'instant-sell-rust' },
  { url: '/multitop/rust/jackpot.html', targetId: 'jackpot-rust' },
  { url: '/multitop/rust/marketplaces.html', targetId: 'marketplaces-rust' },
  { url: '/multitop/rust/matchbetting.html', targetId: 'matchbetting-rust' },
  { url: '/multitop/rust/roulette.html', targetId: 'roulette-rust' },
  { url: '/multitop/rust/sell-skins.html', targetId: 'sell-skins-rust' },
  { url: '/multitop/rust/trade-skins.html', targetId: 'trade-skins-rust' },
  { url: '/multitop/rust/upgrader.html', targetId: 'upgrader-rust' },
  { url: '/multitop/dota/buy-items.html', targetId: 'buy-skins-dota' },
  { url: '/multitop/dota/caseopening.html', targetId: 'caseopening-dota' },
  { url: '/multitop/dota/marketplaces.html', targetId: 'marketplaces-dota' },
  { url: '/multitop/dota/matchbetting.html', targetId: 'matchbetting-dota' },
  { url: '/multitop/dota/roulette.html', targetId: 'roulette-dota' },
  { url: '/multitop/dota/sell-items.html', targetId: 'sell-skins-dota' },
  { url: '/multitop/dota/trade-items.html', targetId: 'trade-skins-dota' },
  { url: '/multitop/dota/upgrader.html', targetId: 'upgrader-dota' },
  { url: '/multitop/dota/instant-sell.html', targetId: 'instant-sell-dota' }
];

for (var i = 0; i < requests.length; i++) {
  sendRequest(requests[i].url, requests[i].targetId);
}