var userChoice = getCookie('languageChoice');

function handleLanguageRedirect() {
  if (!userChoice && window.location.hostname !== 'localhost') {
    var userLang = navigator.language || navigator.userLanguage;

    if ((userLang === 'ru' || userLang === 'ru-RU') && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/ru');

      if (newUrl !== currentUrl) {
        userChoice = 'ru';
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
    else if ((userLang === 'pt' || userLang === 'pt-BR') && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/pt');

      if (newUrl !== currentUrl) {
        userChoice = 'pt';
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
    else if ((userLang === 'es' || userLang === 'es-ES') && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/es');

      if (newUrl !== currentUrl) {
        userChoice = 'es';
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
    else if ((userLang === 'hi' || userLang === 'hi-IN') && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/hi');

      if (newUrl !== currentUrl) {
        userChoice = 'hi';
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
    else if ((userLang === 'en' || userLang === 'en-US') && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/');

      if (newUrl !== currentUrl) {
        userChoice = 'en';
        setCookie('languageChoice', userChoice, 365);
        window.location.href = newUrl;
        return false;
      }
    }
  } else if (userChoice === 'ru' && window.location.pathname === '/') {
    var currentUrl = window.location.href;
    var newUrl = currentUrl.replace('.cc/', '.cc/ru');

    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
      return false;
    }
  }
  else if (userChoice === 'pt' && window.location.pathname === '/') {
    var currentUrl = window.location.href;
    var newUrl = currentUrl.replace('.cc/', '.cc/pt');

    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
      return false;
    }
  }
  else if (userChoice === 'es' && window.location.pathname === '/') {
    var currentUrl = window.location.href;
    var newUrl = currentUrl.replace('.cc/', '.cc/es');

    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
      return false;
    }
  }
  else if (userChoice === 'hi' && window.location.pathname === '/') {
    var currentUrl = window.location.href;
    var newUrl = currentUrl.replace('.cc/', '.cc/hi');

    if (newUrl !== currentUrl) {
      window.location.href = newUrl;
      return false;
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
    } else if (selectedLang === 'ru' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/ru');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
    }
    else if (selectedLang === 'pt' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/pt');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
    }
    else if (selectedLang === 'es' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/es');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
    }
    else if (selectedLang === 'hi' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/hi');

      if (newUrl !== currentUrl) {
        window.location.href = newUrl;
      }
    }
    else if (selectedLang === 'en' && window.location.pathname === '/') {
      var currentUrl = window.location.href;
      var newUrl = currentUrl.replace('.cc/', '.cc/');

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


function importDivContent() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var divToImport = document.getElementById('csgo-best-sites');
        if (divToImport) {
          divToImport.innerHTML = xhr.responseText;
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
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
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  earnbyplaycsgo.open('GET', '/multitop/csgo/earn-by-play-csgo.html', true);
  earnbyplaycsgo.send();

  var instantsellcsgo = new XMLHttpRequest();
  instantsellcsgo.onreadystatechange = function() {
    if (instantsellcsgo.readyState === XMLHttpRequest.DONE) {
      if (instantsellcsgo.status === 200) {
        var divToImport = document.getElementById('instant-sell-csgo');
        if (divToImport) {
          divToImport.innerHTML = instantsellcsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  instantsellcsgo.open('GET', '/multitop/csgo/instant-sell.html', true);
  instantsellcsgo.send();

  var jackpotcsgo = new XMLHttpRequest();
  jackpotcsgo.onreadystatechange = function() {
    if (jackpotcsgo.readyState === XMLHttpRequest.DONE) {
      if (jackpotcsgo.status === 200) {
        var divToImport = document.getElementById('jackpot-csgo');
        if (divToImport) {
          divToImport.innerHTML = jackpotcsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  jackpotcsgo.open('GET', '/multitop/csgo/jackpot.html', true);
  jackpotcsgo.send();

  var marketplacescsgo = new XMLHttpRequest();
  marketplacescsgo.onreadystatechange = function() {
    if (marketplacescsgo.readyState === XMLHttpRequest.DONE) {
      if (marketplacescsgo.status === 200) {
        var divToImport = document.getElementById('marketplaces-csgo');
        if (divToImport) {
          divToImport.innerHTML = marketplacescsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  marketplacescsgo.open('GET', '/multitop/csgo/marketplaces.html', true);
  marketplacescsgo.send();

  var matchbettingcsgo = new XMLHttpRequest();
  matchbettingcsgo.onreadystatechange = function() {
    if (matchbettingcsgo.readyState === XMLHttpRequest.DONE) {
      if (matchbettingcsgo.status === 200) {
        var divToImport = document.getElementById('matchbetting-csgo');
        if (divToImport) {
          divToImport.innerHTML = matchbettingcsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  matchbettingcsgo.open('GET', '/multitop/csgo/matchbetting.html', true);
  matchbettingcsgo.send();

  var roulettecsgo = new XMLHttpRequest();
  roulettecsgo.onreadystatechange = function() {
    if (roulettecsgo.readyState === XMLHttpRequest.DONE) {
      if (roulettecsgo.status === 200) {
        var divToImport = document.getElementById('roulette-csgo');
        if (divToImport) {
          divToImport.innerHTML = roulettecsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  roulettecsgo.open('GET', '/multitop/csgo/roulette.html', true);
  roulettecsgo.send();

  var sellskinscsgo = new XMLHttpRequest();
  sellskinscsgo.onreadystatechange = function() {
    if (sellskinscsgo.readyState === XMLHttpRequest.DONE) {
      if (sellskinscsgo.status === 200) {
        var divToImport = document.getElementById('sell-skins-csgo');
        if (divToImport) {
          divToImport.innerHTML = sellskinscsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  sellskinscsgo.open('GET', '/multitop/csgo/sell-skins.html', true);
  sellskinscsgo.send();

  var tradeskinscsgo = new XMLHttpRequest();
  tradeskinscsgo.onreadystatechange = function() {
    if (tradeskinscsgo.readyState === XMLHttpRequest.DONE) {
      if (tradeskinscsgo.status === 200) {
        var divToImport = document.getElementById('trade-skins-csgo');
        if (divToImport) {
          divToImport.innerHTML = tradeskinscsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  tradeskinscsgo.open('GET', '/multitop/csgo/trade-skins.html', true);
  tradeskinscsgo.send();

  var upgradercsgo = new XMLHttpRequest();
  upgradercsgo.onreadystatechange = function() {
    if (upgradercsgo.readyState === XMLHttpRequest.DONE) {
      if (upgradercsgo.status === 200) {
        var divToImport = document.getElementById('upgrader-csgo');
        if (divToImport) {
          divToImport.innerHTML = upgradercsgo.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  upgradercsgo.open('GET', '/multitop/csgo/upgrader.html', true);
  upgradercsgo.send();

  var earnbyplay = new XMLHttpRequest();
  earnbyplay.onreadystatechange = function() {
    if (earnbyplay.readyState === XMLHttpRequest.DONE) {
      if (earnbyplay.status === 200) {
        var divToImport = document.getElementById('earn-by-play-sites');
        if (divToImport) {
          divToImport.innerHTML = earnbyplay.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  earnbyplay.open('GET', '/multitop/earning/earn-by-play.html', true);
  earnbyplay.send();

  var offerwalls = new XMLHttpRequest();
  offerwalls.onreadystatechange = function() {
    if (offerwalls.readyState === XMLHttpRequest.DONE) {
      if (offerwalls.status === 200) {
        var divToImport = document.getElementById('offerwalls-list');
        if (divToImport) {
          divToImport.innerHTML = offerwalls.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  offerwalls.open('GET', '/multitop/earning/offerwalls.html', true);
  offerwalls.send();

  var dailyrewards = new XMLHttpRequest();
  dailyrewards.onreadystatechange = function() {
    if (dailyrewards.readyState === XMLHttpRequest.DONE) {
      if (dailyrewards.status === 200) {
        var divToImport = document.getElementById('daily-rewards-list');
        if (divToImport) {
          divToImport.innerHTML = dailyrewards.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  dailyrewards.open('GET', '/multitop/freebies/daily-rewards.html', true);
  dailyrewards.send();

  var depositbonuses = new XMLHttpRequest();
  depositbonuses.onreadystatechange = function() {
    if (depositbonuses.readyState === XMLHttpRequest.DONE) {
      if (depositbonuses.status === 200) {
        var divToImport = document.getElementById('deposit-bonuses-list');
        if (divToImport) {
          divToImport.innerHTML = depositbonuses.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  depositbonuses.open('GET', '/multitop/freebies/deposit-bonuses.html', true);
  depositbonuses.send();

  var giveaways = new XMLHttpRequest();
  giveaways.onreadystatechange = function() {
    if (giveaways.readyState === XMLHttpRequest.DONE) {
      if (giveaways.status === 200) {
        var divToImport = document.getElementById('giveaways-list');
        if (divToImport) {
          divToImport.innerHTML = giveaways.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  giveaways.open('GET', '/multitop/freebies/giveaways.html', true);
  giveaways.send();

  var signupbonuses = new XMLHttpRequest();
  signupbonuses.onreadystatechange = function() {
    if (signupbonuses.readyState === XMLHttpRequest.DONE) {
      if (signupbonuses.status === 200) {
        var divToImport = document.getElementById('sign-up-bonuses-list');
        if (divToImport) {
          divToImport.innerHTML = signupbonuses.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  signupbonuses.open('GET', '/multitop/freebies/sign-up-bonuses.html', true);
  signupbonuses.send();

  var steamlevelup = new XMLHttpRequest();
  steamlevelup.onreadystatechange = function() {
    if (steamlevelup.readyState === XMLHttpRequest.DONE) {
      if (steamlevelup.status === 200) {
        var divToImport = document.getElementById('levelup-list');
        if (divToImport) {
          divToImport.innerHTML = steamlevelup.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  steamlevelup.open('GET', '/multitop/steam/levelup.html', true);
  steamlevelup.send();

  var cryptocasino = new XMLHttpRequest();
  cryptocasino.onreadystatechange = function() {
    if (cryptocasino.readyState === XMLHttpRequest.DONE) {
      if (cryptocasino.status === 200) {
        var divToImport = document.getElementById('casino-crypto');
        if (divToImport) {
          divToImport.innerHTML = cryptocasino.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  cryptocasino.open('GET', '/multitop/crypto/casino.html', true);
  cryptocasino.send();

  var cryptocoinflip = new XMLHttpRequest();
  cryptocoinflip.onreadystatechange = function() {
    if (cryptocoinflip.readyState === XMLHttpRequest.DONE) {
      if (cryptocoinflip.status === 200) {
        var divToImport = document.getElementById('coinflip-crypto');
        if (divToImport) {
          divToImport.innerHTML = cryptocoinflip.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  cryptocoinflip.open('GET', '/multitop/crypto/coinflip.html', true);
  cryptocoinflip.send();

  var cryptocrash = new XMLHttpRequest();
  cryptocrash.onreadystatechange = function() {
    if (cryptocrash.readyState === XMLHttpRequest.DONE) {
      if (cryptocrash.status === 200) {
        var divToImport = document.getElementById('crash-crypto');
        if (divToImport) {
          divToImport.innerHTML = cryptocrash.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  cryptocrash.open('GET', '/multitop/crypto/crash.html', true);
  cryptocrash.send();

  var cryptomatchbetting = new XMLHttpRequest();
  cryptomatchbetting.onreadystatechange = function() {
    if (cryptomatchbetting.readyState === XMLHttpRequest.DONE) {
      if (cryptomatchbetting.status === 200) {
        var divToImport = document.getElementById('matchbetting-crypto');
        if (divToImport) {
          divToImport.innerHTML = cryptomatchbetting.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  cryptomatchbetting.open('GET', '/multitop/crypto/matchbetting.html', true);
  cryptomatchbetting.send();

  var cryptoroulette = new XMLHttpRequest();
  cryptoroulette.onreadystatechange = function() {
    if (cryptoroulette.readyState === XMLHttpRequest.DONE) {
      if (cryptoroulette.status === 200) {
        var divToImport = document.getElementById('roulette-crypto');
        if (divToImport) {
          divToImport.innerHTML = cryptoroulette.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  cryptoroulette.open('GET', '/multitop/crypto/roulette.html', true);
  cryptoroulette.send();

  var buyskinsrust = new XMLHttpRequest();
  buyskinsrust.onreadystatechange = function() {
    if (buyskinsrust.readyState === XMLHttpRequest.DONE) {
      if (buyskinsrust.status === 200) {
        var divToImport = document.getElementById('buy-skins-rust');
        if (divToImport) {
          divToImport.innerHTML = buyskinsrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  buyskinsrust.open('GET', '/multitop/rust/buy-skins.html', true);
  buyskinsrust.send();

  var caseopeningrust = new XMLHttpRequest();
  caseopeningrust.onreadystatechange = function() {
    if (caseopeningrust.readyState === XMLHttpRequest.DONE) {
      if (caseopeningrust.status === 200) {
        var divToImport = document.getElementById('caseopening-rust');
        if (divToImport) {
          divToImport.innerHTML = caseopeningrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  caseopeningrust.open('GET', '/multitop/rust/caseopening.html', true);
  caseopeningrust.send();

  var coinfliprust = new XMLHttpRequest();
  coinfliprust.onreadystatechange = function() {
    if (coinfliprust.readyState === XMLHttpRequest.DONE) {
      if (coinfliprust.status === 200) {
        var divToImport = document.getElementById('coinflip-rust');
        if (divToImport) {
          divToImport.innerHTML = coinfliprust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  coinfliprust.open('GET', '/multitop/rust/coinflip.html', true);
  coinfliprust.send();

  var crashrust = new XMLHttpRequest();
  crashrust.onreadystatechange = function() {
    if (crashrust.readyState === XMLHttpRequest.DONE) {
      if (crashrust.status === 200) {
        var divToImport = document.getElementById('crash-rust');
        if (divToImport) {
          divToImport.innerHTML = crashrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  crashrust.open('GET', '/multitop/rust/crash.html', true);
  crashrust.send();

  var instantsellrust = new XMLHttpRequest();
  instantsellrust.onreadystatechange = function() {
    if (instantsellrust.readyState === XMLHttpRequest.DONE) {
      if (instantsellrust.status === 200) {
        var divToImport = document.getElementById('instant-sell-rust');
        if (divToImport) {
          divToImport.innerHTML = instantsellrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  instantsellrust.open('GET', '/multitop/rust/instant-sell.html', true);
  instantsellrust.send();

  var jackpotrust = new XMLHttpRequest();
  jackpotrust.onreadystatechange = function() {
    if (jackpotrust.readyState === XMLHttpRequest.DONE) {
      if (jackpotrust.status === 200) {
        var divToImport = document.getElementById('jackpot-rust');
        if (divToImport) {
          divToImport.innerHTML = jackpotrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  jackpotrust.open('GET', '/multitop/rust/jackpot.html', true);
  jackpotrust.send();

  var marketplacesrust = new XMLHttpRequest();
  marketplacesrust.onreadystatechange = function() {
    if (marketplacesrust.readyState === XMLHttpRequest.DONE) {
      if (marketplacesrust.status === 200) {
        var divToImport = document.getElementById('marketplaces-rust');
        if (divToImport) {
          divToImport.innerHTML = marketplacesrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  marketplacesrust.open('GET', '/multitop/rust/marketplaces.html', true);
  marketplacesrust.send();

  var matchbettingrust = new XMLHttpRequest();
  matchbettingrust.onreadystatechange = function() {
    if (matchbettingrust.readyState === XMLHttpRequest.DONE) {
      if (matchbettingrust.status === 200) {
        var divToImport = document.getElementById('matchbetting-rust');
        if (divToImport) {
          divToImport.innerHTML = matchbettingrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  matchbettingrust.open('GET', '/multitop/rust/matchbetting.html', true);
  matchbettingrust.send();

  var rouletterust = new XMLHttpRequest();
  rouletterust.onreadystatechange = function() {
    if (rouletterust.readyState === XMLHttpRequest.DONE) {
      if (rouletterust.status === 200) {
        var divToImport = document.getElementById('roulette-rust');
        if (divToImport) {
          divToImport.innerHTML = rouletterust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  rouletterust.open('GET', '/multitop/rust/roulette.html', true);
  rouletterust.send();

  var sellskinsrust = new XMLHttpRequest();
  sellskinsrust.onreadystatechange = function() {
    if (sellskinsrust.readyState === XMLHttpRequest.DONE) {
      if (sellskinsrust.status === 200) {
        var divToImport = document.getElementById('sell-skins-rust');
        if (divToImport) {
          divToImport.innerHTML = sellskinsrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  sellskinsrust.open('GET', '/multitop/rust/sell-skins.html', true);
  sellskinsrust.send();

  var tradeskinsrust = new XMLHttpRequest();
  tradeskinsrust.onreadystatechange = function() {
    if (tradeskinsrust.readyState === XMLHttpRequest.DONE) {
      if (tradeskinsrust.status === 200) {
        var divToImport = document.getElementById('trade-skins-rust');
        if (divToImport) {
          divToImport.innerHTML = tradeskinsrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  tradeskinsrust.open('GET', '/multitop/rust/trade-skins.html', true);
  tradeskinsrust.send();

  var upgraderrust = new XMLHttpRequest();
  upgraderrust.onreadystatechange = function() {
    if (upgraderrust.readyState === XMLHttpRequest.DONE) {
      if (upgraderrust.status === 200) {
        var divToImport = document.getElementById('upgrader-rust');
        if (divToImport) {
          divToImport.innerHTML = upgraderrust.responseText;
          translateURLs(divToImport); 
        }
      } else {
        console.error('Cant load div.');
      }
    }
  };
  upgraderrust.open('GET', '/multitop/rust/upgrader.html', true);
  upgraderrust.send();

  var buyskinsdota = new XMLHttpRequest();
buyskinsdota.onreadystatechange = function() {
  if (buyskinsdota.readyState === XMLHttpRequest.DONE) {
    if (buyskinsdota.status === 200) {
      var divToImport = document.getElementById('buy-skins-dota');
      if (divToImport) {
        divToImport.innerHTML = buyskinsdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
buyskinsdota.open('GET', '/multitop/dota/buy-items.html', true);
buyskinsdota.send();

var caseopeningdota = new XMLHttpRequest();
caseopeningdota.onreadystatechange = function() {
  if (caseopeningdota.readyState === XMLHttpRequest.DONE) {
    if (caseopeningdota.status === 200) {
      var divToImport = document.getElementById('caseopening-dota');
      if (divToImport) {
        divToImport.innerHTML = caseopeningdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
caseopeningdota.open('GET', '/multitop/dota/caseopening.html', true);
caseopeningdota.send();


var marketplacesdota = new XMLHttpRequest();
marketplacesdota.onreadystatechange = function() {
  if (marketplacesdota.readyState === XMLHttpRequest.DONE) {
    if (marketplacesdota.status === 200) {
      var divToImport = document.getElementById('marketplaces-dota');
      if (divToImport) {
        divToImport.innerHTML = marketplacesdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
marketplacesdota.open('GET', '/multitop/dota/marketplaces.html', true);
marketplacesdota.send();

var matchbettingdota = new XMLHttpRequest();
matchbettingdota.onreadystatechange = function() {
  if (matchbettingdota.readyState === XMLHttpRequest.DONE) {
    if (matchbettingdota.status === 200) {
      var divToImport = document.getElementById('matchbetting-dota');
      if (divToImport) {
        divToImport.innerHTML = matchbettingdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
matchbettingdota.open('GET', '/multitop/dota/matchbetting.html', true);
matchbettingdota.send();

var roulettedota = new XMLHttpRequest();
roulettedota.onreadystatechange = function() {
  if (roulettedota.readyState === XMLHttpRequest.DONE) {
    if (roulettedota.status === 200) {
      var divToImport = document.getElementById('roulette-dota');
      if (divToImport) {
        divToImport.innerHTML = roulettedota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
roulettedota.open('GET', '/multitop/dota/roulette.html', true);
roulettedota.send();

var sellskinsdota = new XMLHttpRequest();
sellskinsdota.onreadystatechange = function() {
  if (sellskinsdota.readyState === XMLHttpRequest.DONE) {
    if (sellskinsdota.status === 200) {
      var divToImport = document.getElementById('sell-skins-dota');
      if (divToImport) {
        divToImport.innerHTML = sellskinsdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
sellskinsdota.open('GET', '/multitop/dota/sell-items.html', true);
sellskinsdota.send();

var tradeskinsdota = new XMLHttpRequest();
tradeskinsdota.onreadystatechange = function() {
  if (tradeskinsdota.readyState === XMLHttpRequest.DONE) {
    if (tradeskinsdota.status === 200) {
      var divToImport = document.getElementById('trade-skins-dota');
      if (divToImport) {
        divToImport.innerHTML = tradeskinsdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
tradeskinsdota.open('GET', '/multitop/dota/trade-items.html', true);
tradeskinsdota.send();

var upgraderdota = new XMLHttpRequest();
upgraderdota.onreadystatechange = function() {
  if (upgraderdota.readyState === XMLHttpRequest.DONE) {
    if (upgraderdota.status === 200) {
      var divToImport = document.getElementById('upgrader-dota');
      if (divToImport) {
        divToImport.innerHTML = upgraderdota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
upgraderdota.open('GET', '/multitop/dota/upgrader.html', true);
upgraderdota.send();

var instantselldota = new XMLHttpRequest();
instantselldota.onreadystatechange = function() {
  if (instantselldota.readyState === XMLHttpRequest.DONE) {
    if (instantselldota.status === 200) {
      var divToImport = document.getElementById('instant-sell-dota');
      if (divToImport) {
        divToImport.innerHTML = instantselldota.responseText;
        translateURLs(divToImport); 
      }
    } else {
      console.error('Cant load div.');
    }
  }
};
instantselldota.open('GET', '/multitop/dota/instant-sell.html', true);
instantselldota.send();
}