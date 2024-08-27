document.addEventListener('DOMContentLoaded', function() {

  var userChoice = getCookie('languageChoice');

  function handleLanguageRedirect() {
    if (userChoice && userChoice !== 'en' && !window.location.pathname.includes(`/${userChoice}`)) {
      const parts = window.location.pathname.split('/');
      if (isLanguageTag(parts[1])) {
        parts[1] = userChoice;
      } else {
        parts.splice(1, 0, userChoice);
      }
      window.location.pathname = parts.join('/');
    }
  }
  
  const supportedLanguages = ['ru', 'hi', 'pt', 'es', 'tr'];
  function isLanguageTag(tag) {
    return supportedLanguages.includes(tag);
  }
  
  
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('lang-switch')) {
      var selectedLang = event.target.dataset.lang;
  
      setCookie('languageChoice', selectedLang, 365);
  
      if (selectedLang !== userChoice) {
        location.reload();
      } else {
        var currentPath = window.location.pathname;
        var newPath = '/' + selectedLang + currentPath.slice(3);
        window.location.pathname = newPath;
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
  
  if (![
    "/topic", "/reviews/", "/mirrors/", "/privacy-policy", 
    "/terms-of-service", "/contact-us"
].some(path => window.location.pathname.includes(path)) && 
    !document.getElementById("error-404")
) {
    handleLanguageRedirect();
}

var requests = [
  { url: '/index.html', targetId: 'csgo-best-sites' },
  { url: '/freebies.html', targetId: 'freebies-sites' },
  { url: '/earning.html', targetId: 'earning-sites' },
  { url: '/rust.html', targetId: 'rust-sites' },
  { url: '/dota.html', targetId: 'dota-sites' },
  { url: '/newest.html', targetId: 'newest-sites-list' },
  { url: '/crypto.html', targetId: 'crypto-sites' },
  { url: '/csgo/buy-skins.html', targetId: 'buy-skins-csgo' },
  { url: '/csgo/caseopening.html', targetId: 'caseopening-csgo' },
  { url: '/csgo/case-battle.html', targetId: 'case-battle-csgo' },
  { url: '/csgo/casino.html', targetId: 'casino-csgo' },
  { url: '/csgo/coinflip.html', targetId: 'coinflip-csgo' },
  { url: '/csgo/crash.html', targetId: 'crash-csgo' },
  { url: '/csgo/dice.html', targetId: 'dice-csgo' },
  { url: '/csgo/earn-by-play-csgo.html', targetId: 'earn-by-play-csgo' },
  { url: '/csgo/instant-sell.html', targetId: 'instant-sell-csgo' },
  { url: '/csgo/jackpot.html', targetId: 'jackpot-csgo' },
  { url: '/csgo/marketplaces.html', targetId: 'marketplaces-csgo' },
  { url: '/csgo/matchbetting.html', targetId: 'matchbetting-csgo' },
  { url: '/csgo/roulette.html', targetId: 'roulette-csgo' },
  { url: '/csgo/sell-skins.html', targetId: 'sell-skins-csgo' },
  { url: '/csgo/trade-skins.html', targetId: 'trade-skins-csgo' },
  { url: '/csgo/upgrader.html', targetId: 'upgrader-csgo' },
  { url: '/csgo/mines.html', targetId: 'mines-cs2' },
  { url: '/csgo/plinko.html', targetId: 'plinko-cs2' },
  { url: '/earning/earn-by-play.html', targetId: 'earn-by-play-sites' },
  { url: '/earning/offerwalls.html', targetId: 'offerwalls-list' },
  { url: '/freebies/daily-rewards.html', targetId: 'daily-rewards-list' },
  { url: '/freebies/deposit-bonuses.html', targetId: 'deposit-bonuses-list' },
  { url: '/freebies/giveaways.html', targetId: 'giveaways-list' },
  { url: '/freebies/sign-up-bonuses.html', targetId: 'sign-up-bonuses-list' },
  { url: '/steam/levelup.html', targetId: 'levelup-list' },
  { url: '/steam/topup.html', targetId: 'topup-list' },
  { url: '/steam/buy-games.html', targetId: 'buygames-list' },
  { url: '/crypto/casino.html', targetId: 'casino-crypto' },
  { url: '/crypto/coinflip.html', targetId: 'coinflip-crypto' },
  { url: '/crypto/crash.html', targetId: 'crash-crypto' },
  { url: '/crypto/matchbetting.html', targetId: 'matchbetting-crypto' },
  { url: '/crypto/roulette.html', targetId: 'roulette-crypto' },
  { url: '/rust/buy-skins.html', targetId: 'buy-skins-rust' },
  { url: '/rust/caseopening.html', targetId: 'caseopening-rust' },
  { url: '/rust/case-battle.html', targetId: 'case-battle-rust' },
  { url: '/rust/coinflip.html', targetId: 'coinflip-rust' },
  { url: '/rust/crash.html', targetId: 'crash-rust' },
  { url: '/rust/instant-sell.html', targetId: 'instant-sell-rust' },
  { url: '/rust/jackpot.html', targetId: 'jackpot-rust' },
  { url: '/rust/marketplaces.html', targetId: 'marketplaces-rust' },
  { url: '/rust/matchbetting.html', targetId: 'matchbetting-rust' },
  { url: '/rust/roulette.html', targetId: 'roulette-rust' },
  { url: '/rust/sell-skins.html', targetId: 'sell-skins-rust' },
  { url: '/rust/trade-skins.html', targetId: 'trade-skins-rust' },
  { url: '/rust/upgrader.html', targetId: 'upgrader-rust' },
  { url: '/dota/buy-items.html', targetId: 'buy-skins-dota' },
  { url: '/dota/caseopening.html', targetId: 'caseopening-dota' },
  { url: '/dota/marketplaces.html', targetId: 'marketplaces-dota' },
  { url: '/dota/matchbetting.html', targetId: 'matchbetting-dota' },
  { url: '/dota/roulette.html', targetId: 'roulette-dota' },
  { url: '/dota/sell-items.html', targetId: 'sell-skins-dota' },
  { url: '/dota/trade-items.html', targetId: 'trade-skins-dota' },
  { url: '/dota/upgrader.html', targetId: 'upgrader-dota' },
  { url: '/dota/instant-sell.html', targetId: 'instant-sell-dota' },
  { url: '/tf2/buy-items.html', targetId: 'buy-items-tf2' },
  { url: '/tf2/instant-sell.html', targetId: 'instant-sell-tf2' },
  { url: '/tf2/marketplaces.html', targetId: 'marketplaces-tf2' },
  { url: '/tf2/sell-items.html', targetId: 'sell-items-tf2' },
  { url: '/tf2/trade-items.html', targetId: 'trade-items-tf2' }
];

const basePath = "/code-parts/site-infos";

function loadJsonData(filePath, callback) {
    const cachedData = sessionStorage.getItem(filePath);
    if (cachedData) {
        callback(JSON.parse(cachedData));
    } else {
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load JSON data');
                return response.json();
            })
            .then(data => {
                sessionStorage.setItem(filePath, JSON.stringify(data));
                callback(data);
            })
            .catch(error => console.error("Error loading JSON data: ", error));
    }
}


function modifyBox(box, mainMode) {
  const logobg = box.querySelector('.logobg');
  if (!logobg) return;

  const mainModeDiv = document.createElement('div');
  mainModeDiv.className = `main-mode ${mainMode} lang-${languageTag}`; // Добавление классов к main-mode
  mainModeDiv.innerHTML = `<div class="main-mode-box"><div class="main-mode-icon"></div></div>`;

  logobg.appendChild(mainModeDiv);
}

function processBoxes(boxes) {
  boxes.forEach(box => {
      const logoLink = box.querySelector('.logobg a');
      if (logoLink) {
          const path = logoLink.getAttribute('href');
          const pageKey = path.split('/').pop();
          const jsonFilePath = `${basePath}/${pageKey}.json`;

          loadJsonData(jsonFilePath, data => {
              if (!data) return;
              if (data["Main Mode"]) {
                  modifyBox(box, data["Main Mode"]);
              }
              if (data.code) {
                  const copyButton = box.querySelector('.copy');
                  if (copyButton) {
                      copyButton.addEventListener('click', () => copyToClipboard(data.code, copyButton));
                  }
              }
          });
      }
  });
}

function sendRequest(url, targetId) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(xhr.responseText, 'text/html');
          var boxesHolder = doc.querySelector('.boxes-holder');
          if (boxesHolder) {
              var divToImport = document.getElementById(targetId);
              if (divToImport) {
                  divToImport.innerHTML = boxesHolder.innerHTML;
                  translateURLsIfNeeded(divToImport);
                  addStarRatingToBoxesHolders();
                  forcemodsboxes(); 
                  const importedBoxes = divToImport.querySelectorAll('.box');
                  processBoxes(importedBoxes);

                  if (isPageInTurkish()) {
                      updateURLs(sitesList);
                  }
              }
          }
      }
  };
  xhr.open('GET', url, true);
  xhr.send();
}

function copyToClipboard(text, copyButton) {
  const tempInput = document.createElement('input');
  document.body.appendChild(tempInput);
  tempInput.value = text;
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  const title = document.createElement('div');
  title.className = 'copied-title';
  title.textContent = (languageTag === 'ru') ? 'Скопировано' : 'Copied';

  copyButton.appendChild(title);

  copyButton.classList.add('icon-changed');

  title.style.display = 'none';
  $(title).fadeIn(150, function() {
      $(this).delay(400).fadeOut(150, function() {
          $(this).remove();
      });
  });

  setTimeout(function() {
      copyButton.classList.remove('icon-changed');
  }, 800);
}

function isPageInTurkish() {
  var path = window.location.pathname;
  return path.startsWith('/tr/') || path.endsWith('/tr') || path.endsWith('/tr.html');
}

var boxesHolderElement = document.querySelector('.boxes-holder');
var neededTargetId = boxesHolderElement ? boxesHolderElement.id : null;

var request = requests.find(function(item) {
  return item.targetId === neededTargetId;
});

if (request) {
  sendRequest(request.url, request.targetId);
}

function extractLanguageTagFromHTML() {
  const htmlElement = document.querySelector('html');
  if (htmlElement) {
    const langAttribute = htmlElement.getAttribute('lang');
    if (langAttribute) {
      return langAttribute.split('-')[0];
    }
  }
  return null;
}

function translateURLsIfNeeded() {
  if (!window.location.pathname.includes('/reviews/') && !window.location.pathname.includes('/ru/') && !window.location.pathname.includes('/mirrors/')) {
    var languageTag = extractLanguageTagFromHTML();
    
    var translations = {
      "Splits is a new gambling site for Rust skins with various game modes, instant skin withdrawals, rakeback, and rewards for activity.": {
        "es": "Splits es un nuevo sitio de apuestas para skins de Rust con varios modos de juego, retiros instantáneos de skins y diferentes bonificaciones.",
        "tr": "Splits, çeşitli oyun modları, anlık skin çekme ve çeşitli bonuslarla Rust skinleri için yeni bir kumar sitesidir.",
        "pt": "Splits é um novo site de apostas para skins de Rust com vários modos de jogo, retiradas instantâneas de skins e diferentes bônus.",
        "hi": "Splits.gg एक नया जुआ साइट है जहाँ Rust स्किन्स के लिए विभिन्न गेम मोड्स, तुरंत स्किन निकासी और विभिन्न बोनस हैं।"
      },
      "Cobalt Lab - a popular CIS gambling platform for Rust with a unique design, fast transactions, cashback, and rewards for activity.": {
        "es": "Cobalt Lab - una plataforma de juegos de azar popular para Rust con un diseño único, transacciones rápidas, reembolsos y recompensas por actividad.",
        "tr": "Cobalt Lab - Rust için benzersiz tasarımı, hızlı işlemleri, cashback ve aktivite ödülleri ile popüler bir kumar platformu.",
        "pt": "Cobalt Lab - uma plataforma de jogos de azar popular para Rust com um design único, transações rápidas, cashback e recompensas por atividade.",
        "hi": "कोबाल्ट लैब - एक लोकप्रिय जुआ मंच है जो रस्ट के लिए अद्वितीय डिज़ाइन, तेज लेन-देन, कैशबैक और गतिविधि के लिए पुरस्कार प्रदान करता है।"
      },
      "RustReaper - crypto-casino and betting platform offering various modes with Rust skins gameplay, as well as generous bonuses.": {
        "es": "RustReaper es un cripto-casino y plataforma de apuestas que ofrece varios modos con juego de skins de Rust, así como generosos bonos.",
        "tr": "RustReaper, Rust kaplamalı oyun modları ve cömert bonuslar sunan bir kripto-kumarhane ve bahis platformudur.",
        "pt": "RustReaper é um cripto-cassino e plataforma de apostas que oferece vários modos com jogo de skins de Rust, bem como bônus generosos.",
        "hi": "RustReaper एक क्रिप्टो-कसीनो और सट्टेबाजी मंच है जो रस्ट स्किन्स गेमप्ले के साथ विभिन्न मोड्स और उदार बोनस प्रदान करता है।"
      },
      "RustBounty - a gambling site for Rust skins and Cryptocurrency. It includes Cases, Roulette, as well as Giveaways and a Rakeback system.": {
        "es": "RustBounty - un sitio de apuestas para skins de Rust. Incluye Cajas, Ruleta, así como Sorteos y un sistema de Rakeback.",
        "tr": "RustBounty - Rust kaplamaları için bir kumar sitesi. Kasa, Ruletin yanı sıra Çekilişler ve Rakeback sistemi içerir.",
        "pt": "RustBounty - um site de jogos de azar para skins de Rust. Inclui Caixas, Roleta, bem como Sorteios e um sistema de Rakeback.",
        "hi": "RustBounty - रस्ट स्किन्स के लिए एक जुआ साइट। इसमें केस, रूलेट, साथ ही गिवअवे और रेकबैक सिस्टम शामिल हैं।"
      },
      "GGDROP - a well-known platform for opening cases in CS2. In addition, there are Case Battle, Contracts, Upgrader, and Regular Promotions.": {
        "es": "GGDROP - una plataforma conocida para abrir casos en CS2. Además, hay Batalla de Casos, Contratos, Mejoras y Promociones Regulares.",
        "tr": "GGDROP - CS2'de kutu açmak için tanınmış bir platform. Bunun yanı sıra, Kasa Savaşı, Sözleşmeler, Yükseltici ve Düzenli Promosyonlar bulunmaktadır.",
        "pt": "GGDROP - uma plataforma conhecida para abrir caixas no CS2. Além disso, há Batalha de Caixas, Contratos, Aperfeiçoador e Promoções Regulares.",
        "hi": "GGDROP - सीएस2 में केस खोलने के लिए एक प्रसिद्ध प्लेटफ़ॉर्म। इसके अलावा, केस बैटल, कॉन्ट्रैक्ट्स, अपग्रेडर, और नियमित प्रस्ताव हैं।"
      },
      "RustClash - a popular gambling site in the Rust community, with unique modes featuring beautiful animations and plenty of bonuses.": {
        "es": "RustClash ofrece juegos populares como Ruleta, Mejorador y Cajas, además de casos diarios para el disfrute de los jugadores.",
        "tr": "RustClash, Rulet, Yükseltici ve Kutular gibi popüler oyunları içeren üst düzey Rust kumar sitesidir, ayrıca oyuncuların keyfi için günlük kutular da sunmaktadır.",
        "pt": "RustClash é um site popular de apostas em Rust, oferecendo jogos como Roleta, Upgrader e Caixas, além de casos diários para entretenimento dos jogadores.",
        "hi": "RustClash एक शीर्ष Rust जुआ साइट है, जिसमें रूलेट, अपग्रेडर और केस्स जैसे लोकप्रिय खेल शामिल हैं, साथ ही खिलाड़ियों के मनोरंजन के लिए रोजाना केसेस भी होते हैं।"
      },
      "DaddySkins is a valid CSGO Case Battle website that has been in operation since 2017, and it offers Case Battles, Case Battles, and Upgrader.": {
        "es": "DaddySkins es un sitio web válido de Batallas de Cajas de CSGO que ha estado en funcionamiento desde 2017, y ofrece Batallas de Cajas, Batallas de Cajas y Mejoras.",
        "tr": "DaddySkins, 2017'den beri faaliyette olan geçerli bir CSGO Kasa Savaşı web sitesidir ve Kasa Savaşları, Kasa Savaşları ve Yükseltici sunar.",
        "pt": "DaddySkins é um site válido de Batalha de Caixas de CSGO que está em operação desde 2017 e oferece Batalhas de Caixas, Batalhas de Caixas e Upgrader.",
        "hi": "डैडी स्किन्स एक मान्य सीएसजीओ केस बैटल वेबसाइट है जो 2017 से कार्यान्वित है, और यह केस बैटल्स, केस बैटल्स, और अपग्रेडर प्रदान करता है।"
      },
      "Aim.Market - CS2, Dota 2, Rust Instant-sell and skin purchasing service with a user-friendly interface. Sell any amount with no minimum.": {
        "es": "Aim.Market - ofrece un servicio de compra y venta de skins instantáneo para CS2, Dota 2 y Rust, sin requisitos mínimos y con una interfaz fácil de usar.",
        "tr": "Aim.Market - CS2, Dota 2 ve Rust için anında satış ve cilt satın alma hizmeti sunar. Herhangi bir minimum miktar gerekmez.",
        "pt": "Aim.Market - Venda instantânea e compra de skins de CS2, Dota 2 e Rust com interface amigável. Sem mínimo de quantidade.",
        "hi": "एम.मार्केट - सीएस2, डोटा 2, रस्ट तत्काल बिक्री और त्वचा खरीदी सेवा जिसमें एक उपयोगकर्ता मित्रपूर्ण इंटरफ़ेस होता है। कोई न्यूनतम नहीं, किसी भी मात्रा को बेचें।"
      },
      "Swap.gg is a website that allows users to buy, sell, and trade CS2, Rust , TF2 and other virtual items from various games. Working since 2017.": {
        "es": "Swap.gg es un sitio web para comprar, vender e intercambiar objetos virtuales de varios juegos, como CS2, Rust y TF2. Funciona desde 2017.",
        "tr": "Swap.gg, 2017'den beri CS2, Rust, TF2 ve diğer oyunlardan sanal öğeleri satın alıp, satıp ve takas etmeye olanak sağlayan bir web sitesidir.",
        "pt": "Swap.gg é um site que permite aos usuários comprar, vender e trocar itens virtuais de CS2, Rust, TF2 e outros jogos. Trabalhando desde 2017.",
        "hi": "Swap.gg एक वेबसाइट है जो उपयोगकर्ताओं को CS2, Rust, TF2 और अन्य विभिन्न खेलों की आभासी आइटम खरीदने, बेचने और व्यापार करने की अनुमति देती है। 2017 से काम कर रहा है।"
      },
      "CS.Money is a leading CS2 skin trading platform with extensive features, including 3D inspection, quick sale, and efficient support.": {
        "es": "CS.Money es una plataforma líder de intercambio de skins de CS2 con amplias características, incluyendo inspección en 3D, venta rápida y soporte eficiente.",
        "tr": "CS.Money, 3D inceleme, hızlı satış ve etkili destek gibi geniş özelliklere sahip, önde gelen bir CS2 skin takas platformudur.",
        "pt": "CS.Money é uma plataforma líder de troca de skins de CS2 com recursos extensivos, incluindo inspeção em 3D, venda rápida e suporte eficiente.",
        "hi": "CS.Money एक अग्रणी CS2 स्किन ट्रेडिंग प्लेटफ़ॉर्म है जिसमें 3D निरीक्षण, त्वरित बिक्री और प्रभावी समर्थन सहित व्यापक विशेषताएं हैं।"
      },
      "CSGOStake - Skin gambling site for Counter-Strike. Offers five engaging games, provably fair system, and transparent gameplay for enthusiasts.": {
        "es": "CSGOStake - Sitio de apuestas de skins de Counter-Strike. Cinco juegos emocionantes, sistema justo y transparente para los fans.",
        "tr": "CSGOStake - Counter-Strike için cilt kumar sitesi. Beş çekici oyun, kanıtlanabilir adil sistem ve meraklılar için şeffaf oyun sunar.",
        "pt": "CSGOStake - Site de apostas de skins para Counter-Strike. Oferece cinco jogos envolventes, sistema comprovadamente justo e jogabilidade transparente para entusiastas.",
        "hi": "CSGOStake - काउंटर-स्ट्राइक के लिए स्किन जुआ साइट। प्रशंसकों के लिए पांच आकर्षक खेल, प्रमाणित निष्पक्ष प्रणाली और पारदर्शी खेल प्रस्तुत करता है।"
      },
      "Rustly - Rust skin gambling platform, offers nine game modes, third-party skin marketplace, crypto support, and CSGOLuck partnership for reliability.": {
        "es": "Rustly - Plataforma apuestas skins Rust, 9 modos juego, mercado skins terceros, criptomonedas, asociación CSGOLuck fiabilidad.",
        "tr": "Rustly - Rust cilt kumar platformu, dokuz oyun modu, üçüncü taraf cilt pazarı, kripto desteği ve güvenilirlik için CSGOLuck ortaklığı sunar.",
        "pt": "Rustly - Plataforma de apostas de skins do Rust com 9 modos de jogo, mercado de skins, criptomoedas e parceria com CSGOLuck.",
        "hi": "Rustly - रस्ट स्किन गेम्ब्लिंग प्लेटफ़ॉर्म, नौ गेम मोड, थर्ड-पार्टी स्किन बाजार, क्रिप्टो समर्थन, और CSGOLuck साझेदारी की भरोसेमंदता के लिए।"
      },
      "CSGORUN is the leading platform for skin gambling in the CIS, offering Crash, Roulette, Cases, PVP, and esports betting modes.": {
        "es": "CSGORUN es la plataforma líder para el juego de skins en la CIS, ofreciendo modos de Crash, Ruleta, Cajas, PVP y apuestas en deportes electrónicos.",
        "tr": "CSGORUN, BDT'de skin bahisleri için önde gelen platform olup Crash, Rulet, Kasalar, PVP ve espor bahis modları sunmaktadır.",
        "pt": "CSGORUN é a principal plataforma para apostas de skins na CIS, oferecendo modos de Crash, Roleta, Caixas, PVP e apostas em esports.",
        "hi": "CSGORUN CIS में स्किन जुआ खेलने के लिए अग्रणी प्लेटफ़ॉर्म है, जो क्रैश, रूले, केस, PVP और ईस्पोर्ट्स सट्टेबाजी मोड्स की पेशकश करता है।"
      },
      "RapidSkins is a platform for trading, instant selling, and purchasing CS2 and Rust skins, with support for cryptocurrency transactions.": {
        "es": "RapidSkins es una plataforma para intercambiar, vender instantáneamente y comprar skins de CS2 y Rust, con soporte para transacciones con criptomonedas.",
        "tr": "RapidSkins, CS2 ve Rust kaplamalarının takası, anında satışı ve satın alınması için bir platform olup, kripto para işlemlerini destekler.",
        "pt": "RapidSkins é uma plataforma para troca, venda instantânea e compra de skins de CS2 e Rust, com suporte para transações com criptomoedas.",
        "hi": "RapidSkins एक प्लेटफ़ॉर्म है जहाँ CS2 और Rust स्किन्स का लेन-देन, तत्काल बिक्री और ख़रीदारी की जा सकती है, और यह क्रिप्टोकरेन्सी लेनदेन का समर्थन करता है।"
      },
      "RustMagic is a gambling site for Rust fans, featuring a variety of games and slots, bonuses, a user-friendly design, and instant payouts.": {
        "es": "RustMagic es un sitio de apuestas para fanáticos de Rust, que ofrece una variedad de juegos, bonificaciones, un diseño fácil de usar y pagos instantáneos.",
        "tr": "RustMagic, Rust hayranları için birçok oyun, bonus, kullanıcı dostu tasarım ve anında ödeme sunan bir kumar sitesidir.",
        "pt": "RustMagic é um site de apostas para fãs de Rust, com uma variedade de jogos, bônus, design amigável e pagamentos instantâneos.",
        "hi": "रस्टमैजिक रस्ट के प्रशंसकों के लिए एक जुआ साइट है, जिसमें कई गेम, बोनस, उपयोगकर्ता के अनुकूल डिज़ाइन और त्वरित भुगतान शामिल हैं।"
      },
      "SKINFANS - CS2 skin case opening , beautiful animations, provably fair system. Regular giveaways, Battle-pass for newcomers, sleek design.": {
        "es": "SKINFANS - Apertura cajas piel CS2, animaciones impresionantes, sistema justo. Sorteos frecuentes, Pase batalla, diseño elegante.",
        "tr": "SKINFANS - CS2 cilt kılıfı açma, güzel animasyonlar, ispatlanabilir adil sistem. Düzenli ödüller, yeni gelenler için Savaş Pası, şık tasarım.",
        "pt": "SKINFANS - Abertura de caixas CS2, animações incríveis, sistema justo, sorteios, Passe de Batalha para novatos, design elegante.",
        "hi": "SKINFANS - CS2 स्किन केस ओपनिंग, सुंदर एनीमेशन, प्रमाणित निष्पक्ष सिस्टम। नियमित गिफ्टवे, नए आनेवालों के लिए बैटल-पास, सुंदर डिज़ाइन।"
      },
      "CSFAIL, a prominent website in Skin Gambling, offers diverse modes, user-friendly interface, and bonus features for CS2, Dota 2, and RUST skins.": {
        "es": "CSFAIL, un sitio web destacado en Skin Gambling, ofrece diversos modos, una interfaz fácil de usar y características de bonificación para las skins de CS2, Dota 2 y RUST.",
        "tr": "CSFAIL, Skin Gambling'de öne çıkan bir web sitesi, CS2, Dota 2 ve RUST skinleri için çeşitli modlar, kullanıcı dostu arayüz ve bonus özellikler sunar.",
        "pt": "CSFAIL, um site proeminente em Skin Gambling, oferece diversos modos, interface amigável e recursos de bônus para skins de CS2, Dota 2 e RUST.",
        "hi": "CSFAIL, Skin Gambling में एक प्रमुख वेबसाइट, CS2, Dota 2, और RUST skins के लिए विविध मोड, उपयोगकर्ता-सहायक इंटरफेस, और बोनस सुविधाएं प्रदान करती है।"
      },
      "500 Casino - a leading site in the CS2 gambling sector with numerous modes, regular promotions, and bonuses for players.": {
        "es": "500 Casino - un sitio líder en el sector de apuestas de CS2 con numerosos modos, promociones regulares y bonificaciones para los jugadores.",
        "tr": "500 Casino - CS2 kumar sektöründe çeşitli oyun modları, düzenli promosyonlar ve oyuncular için bonuslar sunan önde gelen bir site.",
        "pt": "500 Casino - um site líder no setor de jogos de azar de CS2 com diversos modos, promoções regulares e bônus para os jogadores.",
        "hi": "500 कैसीनो - CS2 जुआ क्षेत्र में एक प्रमुख साइट है जिसमें कई मोड, नियमित प्रचार और खिलाड़ियों के लिए बोनस हैं।"
      },
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": {
        "es": "CSGORoll es uno de los sitios más populares. Incluye ruleta, crash y muchos más. Ahora probando las apuestas en e-sports.",
        "tr": "CSGORoll, en popüler sitelerden biridir. Rulet, crash ve çok daha fazlasını içerir. Şu anda e-spor bahisleri test ediliyor.",
        "pt": "CSGORoll é um dos sites mais populares. Inclui roleta, crash e muitos outros. Agora testando apostas em e-sports.",
        "hi": "CSGORoll एक लोकप्रिय साइटों में से एक है। जिसमें रूलेट, क्रैश और और भी कई खेल शामिल हैं। अब ई-स्पोर्ट्स बेटिंग का परीक्षण हो रहा है।"
      },
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": {
        "es": "CSGOEmpire es uno de los sitios más populares. Incluye ruleta y coinflip. Trabajando desde 2016. Apuesta en partidas con prioridad.",
        "tr": "CSGOEmpire, en popüler sitelerden biridir. Rulet ve coinflip içerir. 2016'dan beri faaliyet gösteriyor. Öncelikli olarak maç bahisleri.",
        "pt": "CSGOEmpire é um dos sites mais populares. Inclui roleta e coinflip. Trabalhando desde 2016. Aposta em partidas com prioridade.",
        "hi": "CSGOEmpire एक प्रसिद्ध साइटों में से एक है। जिसमें रूलेट और कॉइनफ्लिप शामिल हैं। 2016 से कार्यरत है। प्राथमिकता में मैच बेटिंग है।"
      },
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improve.": {
        "es": "Plataforma CS2 confiable respaldada por YouTubers, segura para alquilar pieles CS2. Tarifas aplicables, reseñas sugieren mejoras.",
        "tr": "YouTuber'ların onayladığı güvenilir CS2 cilt platformu kiralama imkanı sunuyor. Ücretli, kullanıcı yorumları geliştirme alanı olduğunu gösteriyor.",
        "pt": "Plataforma confiável de skins CS2 com aluguel, endossada por YouTubers. Segura, limitada a skins de CS2, taxas aplicáveis, avaliações indicam melhorias.",
        "hi": "विश्वसनीय CS2 स्किन प्लेटफ़ॉर्म जिसमें किराए पर मिलने वाली सेवाएं हैं, YouTubers द्वारा समर्थित। सुरक्षित, सीएस: जीओ स्किनों तक सीमित है, शुल्क लागू होता है, और उपयोगकर्ता समीक्षाएं सुधार के लिए संकेत करती हैं।"
      },
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": {
        "es": "CSGOPolygon es un sitio legendario como CSGODouble con ruleta clásica, ¡pero también tiene Dados, Crash, Tragamonedas y apuestas en e-sports!",
        "tr": "CSGOPolygon, klasik Rulet gibi efsanevi bir sitedir, ancak Zarlar, Crash, Slotlar ve hatta e-spor bahisleri de bulunur!",
        "pt": "CSGOPolygon é um site lendário como o CSGODouble, com roleta clássica, mas tem dados, crash, caça-níqueis e até apostas em e-sports!",
        "hi": "CSGOPolygon CSGODouble की तरह एक पुरानी साइट है जिसमें क्लासिक रूलेट है, लेकिन डाइस, क्रैश, स्लॉट्स और इसी साथ ई-स्पोर्ट्स बेटिंग भी है!"
      },
      "CSGOPositive is a popular betting platform for esports, offering cashback, a user-friendly interface, and multiple payment methods.": {
        "es": "CSGOPositive es una plataforma popular de apuestas en deportes electrónicos, con reembolsos, interfaz fácil de usar y múltiples métodos de pago.",
        "tr": "CSGOPositive, nakit geri ödeme, kullanıcı dostu bir arayüz ve çeşitli ödeme yöntemleri sunan popüler bir e-spor bahis platformudur.",
        "pt": "CSGOPositive é uma plataforma de apostas popular para esports, oferecendo cashback, uma interface amigável e vários métodos de pagamento.",
        "hi": "CSGOPositive एक लोकप्रिय ईस्पोर्ट्स सट्टेबाजी प्लेटफ़ॉर्म है, जो कैशबैक, एक उपयोगकर्ता-अनुकूल इंटरफ़ेस, और कई भुगतान विधियाँ प्रदान करता है।"
      },
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": {
        "es": "Rollbit es un nuevo sitio de casino que incluye apuestas deportivas y muchos juegos clásicos como la ruleta. ¡Incluye bonos diarios!",
        "tr": "Rollbit, spor bahislerini ve rulet gibi birçok klasik oyunu içeren yeni bir Casino sitesidir. Günlük bonuslar içerir!",
        "pt": "Rollbit é um novo site de cassino que inclui apostas esportivas e muitos jogos clássicos como roleta. Inclui bônus diários!",
        "hi": "Rollbit एक नया कैसीनो साइट है जिसमें स्पोर्ट्स बेटिंग और रूलेट जैसे क्लासिक खेल शामिल हैं। रोजाना बोनस भी मिलते हैं!"
      },
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": {
        "es": "CSGOLuck es un sitio de apuestas de skins de CSGO con licencia que acepta múltiples métodos de depósito, ofrece varios juegos y un diseño fácil de usar.",
        "tr": "CSGOLuck, birden fazla para yatırma yöntemini kabul eden lisanslı bir CSGO skin bahis sitesidir ve çeşitli oyunlar ile kullanıcı dostu bir tasarım sunar.",
        "pt": "É um site de apostas de skins de CSGO licenciado que aceita vários métodos de depósito, oferecendo diversos jogos e um design amigável para o usuário.",
        "hi": "CSGOLuck एक लाइसेंसधारक CSGO स्किन जुआ साइट है जो कई जमा विधियों को स्वीकार करती है, विभिन्न खेल और एक उपयोगकर्ता-मित्रीपूर्ण डिज़ाइन प्रदान करती है।"
      },
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": {
        "es": "Duelbits es un casino en línea seguro y con licencia que ofrece juegos, apuestas deportivas, e-sports y transacciones con criptomonedas.",
        "tr": "Duelbits, çeşitli oyunlar, spor bahisleri, e-spor bahisleri ve anında kripto para işlemleri sunan güvenli ve lisanslı bir çevrimiçi kumarhanedir.",
        "pt": "Um cassino online seguro e licenciado com jogos, apostas esportivas, apostas em e-sports e transações de criptomoedas instantâneas.",
        "hi": "Duelbits एक सुरक्षित और लाइसेंस प्राप्त ऑनलाइन कैसीनो है जिसमें विभिन्न खेल, स्पोर्ट्स बेटिंग, ई-स्पोर्ट्स बेटिंग और तत्काल क्रिप्टोकरेंसी सौदों की सुविधा है।"
      },
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": {
        "es": "InsaneGG es una plataforma en línea que ofrece una variedad de juegos de apuestas de skins de CSGO con animaciones profesionales y fluidas.",
        "tr": "InsaneGG, profesyonel olarak tasarlanmış ve akıcı animasyonlara sahip bir dizi CSGO skin bahis oyunu sunan bir çevrimiçi platformdur.",
        "pt": "Uma plataforma online que oferece jogos de apostas de skins de CSGO com animações profissionalmente projetadas e suaves.",
        "hi": "InsaneGG एक ऑनलाइन प्लेटफॉर्म है जो पेशेवर डिज़ाइन की गई और सुविधाजनक एनिमेशन के साथ CSGO स्किन जुआ खेलने की विभिन्न गेम्स प्रदान करती है।"
      },
      "Bounty Stars - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": {
        "es": "Bounty Stars: plataforma de apuestas para CS2 y Rust con juegos originales, juego justo, bonificaciones e impresionantes animaciones.",
        "tr": "Bounty Stars - CS2 ve Rust için orijinal oyunlar, adil oyun, bonuslar ve etkileyici animasyonlarla kumar platformu. 2023 yılında açıldı.",
        "pt": "Bounty Stars - plataforma de apostas para CS2 e Rust com jogos originais, jogabilidade justa, bônus e animações impressionantes. Aberto em 2023.",
        "hi": "Bounty Stars - CS2 और Rust के लिए एक जुआ प्लेटफॉर्म है जिसमें मूलभूत खेल, निष्पक्ष गेमप्ले, बोनस और अद्भुत एनिमेशन शामिल हैं। 2023 में खुला है।"
      },
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": {
        "es": "CSGO-Skins es una plataforma en línea confiable donde los usuarios pueden abrir estuches personalizados de CS2 y participar en sorteos diarios.",
        "tr": "CSGO-Skins, kullanıcıların özel CS2 estuches açabileceği ve günlük çekilişlere katılabileceği saygın bir çevrimiçi platformdur.",
        "pt": "CSGO-Skins é uma plataforma online confiável onde os usuários podem abrir caixas personalizadas de CS2 e participar de brindes diários.",
        "hi": "CSGO-Skins एक प्रमाणित ऑनलाइन प्लेटफॉर्म है जहां उपयोगकर्ता विशेष रूप से तैयार किए गए CS2 केस खोल सकते हैं और दैनिक गिवअवे में भाग ले सकते हैं।"
      },
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": {
        "es": "FlameCases es una plataforma en línea que permite abrir estuches para CS2 y Dota 2. Desde 2017, el sitio web ofrece varias funciones.",
        "tr": "FlameCases, CS2 ve Dota 2 için estuches açma imkanı sağlayan bir çevrimiçi platformdur. 2017'den bu yana hizmet vermektedir.",
        "pt": "Uma plataforma online que permite aos usuários abrir caixas para CS2 e Dota 2 desde 2017, oferecendo várias funcionalidades.",
        "hi": "एक ऑनलाइन प्लेटफॉर्म है जो उपयोगकर्ताओं को CS2 और Dota 2 के लिए केस खोलने की अनुमति देता है। 2017 में शुरू किए जाने के बाद, वेबसाइट विभिन्न सुविधाएं प्रदान करता है।"
      },
      "KNIFEX is a CS2 gambling site that offers various game modes, including betting, slots, coinflip, crash, case openings, and more!": {
        "es": "KNIFEX es un sitio de apuestas de CS2 que ofrece varios modos de juego, incluyendo apuestas, tragamonedas, apertura de cajas y mucho más.",
        "tr": "KNIFEX, bahisler, slotlar, kasa açma ve daha fazlasını içeren çeşitli oyun modları sunan bir CS2 kumar sitesidir!",
        "pt": "KNIFEX é um site de apostas de CS2 que oferece vários modos de jogo, incluindo apostas, slots, abertura de caixas e muito mais!",
        "hi": "KNIFEX एक CS2 जुआ साइट है जो विभिन्न गेम मोड्स प्रदान करता है, जिसमें सट्टेबाजी, स्लॉट्स, केस ओपनिंग और बहुत कुछ शामिल है!"
      },
      "DatDrop is a popular site in the CS2 case opening sphere, with a focus on case battles. There is also an upgrader and a fairness verification system.": {
        "es": "DatDrop es un sitio popular en el ámbito de la apertura de cajas de CS2, con un enfoque en las batallas de cajas. También cuenta con un mejorador.",
        "tr": "DatDrop, kasa savaşlarına odaklanan popüler bir CS2 kasa açma sitesidir. Ayrıca bir yükseltici ve adalet doğrulama sistemi de bulunmaktadır.",
        "pt": "DatDrop é um site popular no mundo de abertura de caixas do CS2, com foco em batalhas de caixas. Também possui um aprimorador.",
        "hi": "DatDrop CS2 केस ओपनिंग के क्षेत्र में एक लोकप्रिय साइट है, जो केस बैटल्स पर ध्यान केंद्रित करता है। इसमें एक अपग्रेडर और ईमानदारी सत्यापन प्रणाली भी है।"
      },
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": {
        "es": "DaddySkins es un sitio web de apertura de estuches de CSGO válido desde 2017 que ofrece Apertura de Estuches, Batallas de Estuches y Mejoras.",
        "tr": "DaddySkins, 2017'den beri faaliyet gösteren geçerli bir CSGO estuche açma web sitesidir ve Estuche Açma, Estuche Savaşları ve Upgrader sunar.",
        "pt": "DaddySkins é um site de abertura de caixas do CSGO que está em operação desde 2017 e oferece Aberturas de Caixas, Batalhas de Caixas e Upgrader.",
        "hi": "DaddySkins एक मान्य CSGO केस खोलने वेबसाइट है जो 2017 से संचालित हो रही है और इसमें केस खोलने, केस युद्ध और अपग्रेडर शामिल हैं।"
      },
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": {
        "es": "Clash.gg es un nuevo sitio de apuestas de CS2 que incluye muchos juegos como la ruleta, upgrader, estuches ¡y muchos más!",
        "tr": "Clash.gg, Rulet, Upgrader, Estuches gibi birçok oyunu içeren yeni bir CS2 Kumar sitesidir!",
        "pt": "Clash.gg é um novo site de apostas de CS2 que oferece uma ampla variedade de jogos emocionantes, como Roleta, Upgrader, Caixas e muito mais!",
        "hi": "Clash.gg एक नया CS2 जुआ साइट है जिसमें रूलेट, अपग्रेडर, केस और बहुत कुछ जैसे बहुत सारे खेल शामिल हैं!"
      },
      "HellStore - a gambling platform from 2016, specializes in CS2 skins, offering Coin Flip, Jackpot, Upgrader, Crash, and Wheel.": {
        "es": "HellStore - una plataforma de apuestas de 2016, se especializa en skins de CS2, ofrece Moneda, Jackpot, Mejorador, Crash y Rueda.",
        "tr": "HellStore - 2016 yılında kurulan bir kumar platformu, CS2 skinlerinde uzmanlaşmış, Para Tura, Jackpot, Yükseltici, Crash ve Çark sunar.",
        "pt": "HellStore - uma plataforma de apostas de 2016, especializada em skins de CS2, oferece Cara ou Coroa, Jackpot, Melhorador, Crash e Roda.",
        "hi": "HellStore - 2016 का जुआ प्लेटफ़ॉर्म, CS2 स्किन्स में विशेषज्ञता, सिक्का उछाल, जैकपॉट, अपग्रेडर, क्रैश और पहिया प्रदान करता है।"
      },
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": {
        "es": "Hellcase es una plataforma en línea donde puedes comprar estuches virtuales con skins y objetos para juegos como CS2, Dota 2 y Rust.",
        "tr": "Hellcase, CS2, Dota 2 ve Rust gibi oyunlar için skin ve eşya dolu sanal estuches satın almanıza olanak sağlayan bir çevrimiçi platformdur.",
        "pt": "Hellcase é uma plataforma que permite aos usuários comprar caixas virtuais preenchidas com skins e itens para vários jogos como CS2, Dota 2 e Rust.",
        "hi": "Hellcase एक ऑनलाइन प्लेटफॉर्म है जो CS2, Dota 2 और Rust जैसे विभिन्न खेलों के लिए स्किन्स और आइटम्स से भरे हुए वर्चुअल केस खरीदने की अनुमति देती है।"
      },
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": {
        "es": "CSGOBIG: un sitio de apuestas de skins de CS2 con modos de juego como Jackpot, Coinflip, Ruleta, Estuches y Batallas de Estuches. Abrió en 2015.",
        "tr": "CSGOBIG - CS2 skinleri için Jackpot, Coinflip, Rulet, Estuches ve Estuche Savaşları gibi oyun modlarına sahip bir kumar sitesi. 2015 yılında açıldı.",
        "pt": "CSGOBIG - um site de apostas de skins do CS2 com modos de jogo como Jackpot, Coinflip, Roleta, Caixas e Batalhas de Caixas. Aberto em 2015.",
        "hi": "CSGOBIG - CS2 स्किन्स के साथ जैकपॉट, कॉइनफ्लिप, रूलेट, केस और केस युद्ध जैसे खेल मोड्स के साथ एक जुआ साइट। 2015 में शुरू हुआ है।"
      },
      "CSGOFast is a popular gambling platform for CS2 skin betting, offering 13 original games, various payment methods and regular bonuses.": {
        "es": "CSGOFast es una plataforma de apuestas de skins de CS2, que ofrece 13 juegos originales y varios métodos de pago.",
        "tr": "CSGOFast, CS2 kaplamalarıyla kumar oynama olanağı sunan popüler bir kumar platformudur ve 13 orijinal oyun ve çeşitli ödeme yöntemleri sunar.",
        "pt": "CSGOFast é uma plataforma popular de jogos de azar para apostas com skins de CS2, oferecendo 13 jogos originais e vários métodos de pagamento.",
        "hi": "CSGOFast एक लोकप्रिय जुआ प्लेटफ़ॉर्म है जो CS2 स्किन्स पर दांव लगाने के लिए है, जो 13 मौलिक खेल और विभिन्न भुगतान विधियाँ प्रदान करता है।"
      },
      "Key-Drop is a reputable online platform focused on Case Opening and Case Battles, as well as custom CS2 skin cases, featuring regular giveaways.": {
        "es": "Key-Drop es una plataforma de apuestas en línea que ofrece actividades como Batallas de Cajas, Mejoras y estuches personalizados de skins de CSGO.",
        "tr": "Key-Drop, Case Battles ve Upgrader gibi çeşitli etkinlikler sunan ve özel CSGO skin estuches'lerine sahip olan saygın bir çevrimiçi kumar platformudur.",
        "pt": "Key-Drop é uma plataforma de apostas online renomada que oferece Batalhas de Caixas, Upgrader e caixas de skins personalizadas do CSGO.",
        "hi": "Key-Drop एक प्रमुख ऑनलाइन जुआ प्लेटफॉर्म है जो केस युद्ध और अपग्रेडर के अलावा कस्टम CSGO स्किन केस भी प्रदान करता है।"
      },
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": {
        "es": "Farmskins es un sitio web de apertura de cajas de CSGO que opera desde 2016, ofreciendo una amplia selección de skins para desempaquetar.",
        "tr": "Farmskins, 2016 yılından bu yana faaliyet gösteren, oyuncuların açabileceği geniş bir skin seçeneği sunan tanınmış bir CSGO estuche açma web sitesidir.",
        "pt": "Farmskins é um conhecido site de abertura de caixas do CSGO, operando desde 2016, com ampla seleção de skins para os jogadores.",
        "hi": "Farmskins एक प्रसिद्ध CSGO केस खोलने वेबसाइट है जो दैनिक रिवॉर्ड, प्रोमो कोड और केस युद्ध जैसी विशेषताएं प्रदान करती है।"
      },
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": {
        "es": "Bets4.pro es una plataforma en línea que ofrece apuestas en partidos de deportes electrónicos, incluyendo CS2, Dota 2, Valorant y más.",
        "tr": "Bets4.pro, kullanıcılara özellikle CS2, Dota 2, Valorant ve daha birçok e-spor maçına bahis koyma imkanı sunan bir çevrimiçi platformdur.",
        "pt": "Bets4.pro é uma plataforma online para apostas em esportes eletrônicos, incluindo CS2, Dota 2, Valorant e mais.",
        "hi": "एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को इस्पोर्ट्स मैचों पर सट्टे लगाने की क्षमता प्रदान करती है, विशेष रूप से CS2, Dota 2, Valorant और बहुत सारे अन्य मैचों के लिए।"
      },
      "Freecash is one of the best platforms for earning money through tasks, offering high payouts, regular rewards, and a user-friendly interface.": {
        "es": "Freecash es uno de los mejores servicios para ganar dinero realizando tareas, con altos pagos, recompensas regulares y una interfaz fácil de usar.",
        "tr": "Freecash, yüksek ödemeler, düzenli ödüller ve kullanıcı dostu bir arayüz sunan görevlerle para kazanmak için en iyi platformlardan biridir.",
        "pt": "Freecash é um dos melhores serviços para ganhar dinheiro com tarefas, oferecendo pagamentos altos, recompensas regulares e uma interface amigável.",
        "hi": "Freecash कार्यों के माध्यम से पैसे कमाने के लिए सबसे अच्छे प्लेटफ़ॉर्म में से एक है, जो उच्च भुगतान, नियमित पुरस्कार और एक उपयोगकर्ता-अनुकूल इंटरफेस प्रदान करता है।"
      },
      "HowlGG is a Rust gambling platform with a variety of modes, a fairness system, a user-friendly interface, and an active community.": {
        "es": "HowlGG es una plataforma de apuestas de Rust con una variedad de modos, un sistema de equidad, una interfaz fácil de usar y una comunidad activa.",
        "tr": "HowlGG, çeşitli modlar, adalet sistemi, kullanıcı dostu arayüzü ve aktif bir topluluğa sahip bir Rust kumar platformudur.",
        "pt": "HowlGG é uma plataforma de apostas de Rust com uma variedade de modos, sistema de justiça, interface amigável e uma comunidade ativa.",
        "hi": "HowlGG एक Rust जुआ प्लेटफ़ॉर्म है जिसमें विभिन्न मोड, निष्पक्षता प्रणाली, उपयोगकर्ता-अनुकूल इंटरफेस और एक सक्रिय समुदाय है।"
      },
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip.": {
        "es": "BanditCamp es un sitio web de apuestas de skins de Rust que ofrece modos de juego temáticos, como la rueda de la fortuna, la apertura de cajas y el coinflip.",
        "tr": "BanditCamp, tekerlek of fortune, estuche açma ve coinflip gibi Rust temalı oyun modlarını sağlayan bir Rust skin bahis sitesidir.",
        "pt": "BanditCamp é um site de apostas de skins do Rust que oferece vários modos de jogo temáticos do Rust, como roda da fortuna, abertura de caixas e coinflip.",
        "hi": "BanditCamp एक Rust स्किन जुआ वेबसाइट है जो व्हील ऑफ़ फ़ॉर्च्यून, केस अनबॉक्सिंग और कॉइनफ्लिप जैसे कई Rust थीम के खेल मोड प्रदान करती है।"
      },
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016.": {
        "es": "GCSkins es una popular aplicación móvil y sitio web que ofrece skins y objetos de CSGO como recompensa por completar tareas en línea. Disponible desde 2016.",
        "tr": "GCSkins, CSGO skinleri ve eşyalarını ödül olarak sunan popüler bir mobil uygulama ve web sitesidir. 2016'dan beri hizmet vermektedir.",
        "pt": "GCSkins é um aplicativo móvel e um site bem conhecidos que oferecem skins e itens de CSGO como recompensa por completar tarefas online.",
        "hi": "GCSkins एक प्रसिद्ध मोबाइल ऐप और वेबसाइट है जो ऑनलाइन कार्यों को पूरा करने के बदले में CSGO स्किन और आइटम प्रदान करती है। 2016 से उपलब्ध है।"
      },
      "GrindBux is a trusted platform where you can earn some money by completing surveys or play mobile and desktop games.": {
        "es": "GrindBux es una plataforma confiable donde puedes ganar dinero completando encuestas o jugando juegos para dispositivos móviles y de escritorio.",
        "tr": "GrindBux, anketleri tamamlayarak veya mobil ve masaüstü oyunları oynayarak para kazanabileceğiniz güvenilir bir platformdur.",
        "pt": "GrindBux é uma plataforma confiável onde você pode ganhar dinheiro completando pesquisas ou jogando jogos para dispositivos móveis e desktop.",
        "hi": "GrindBux एक विश्वसनीय प्लेटफ़ॉर्म है जहाँ आप सर्वेक्षण पूरा करके या मोबाइल और डेस्कटॉप गेम खेलकर कुछ पैसे कमा सकते हैं।"
      },
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games.": {
        "es": "Sitio de apuestas de skins de Rust desde 2017. Ofrece juegos populares como jackpot y coinflip para grandes apostadores.",
        "tr": "2017'den beri faaliyet gösteren bir Rust skin bahis sitesi. Platform, yüksek bahisçi jackpot ve coinflip gibi popüler oyunları sunar.",
        "pt": "Site de apostas de skins do Rust em operação desde 2017. Oferece variedade de jogos populares, incluindo jackpot e coinflip.",
        "hi": "2017 से चल रही एक Rust स्किन जुआ साइट। इस प्लेटफ़ॉर्म पर लोकप्रिय खेलों की एक विस्तृत विकल्प सुविधा है, जिसमें हाई-रोलर जैकपॉट और कॉइनफ्लिप खेल शामिल हैं।"
      },
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly.": {
        "es": "RustBet: sitio confiable de apuestas de skins de Rust. Jackpot, coinflip y mejora de skins. Buena reputación, encriptación SSL, fácil de usar.",
        "tr": "RustBet - Güvenilir bir bahis sitesi, ödül olarak Rust skinleri. Jackpot, coinflip ve skin yükseltme oyunları. Temiz itibar, SSL şifreleme, kullanıcı dostu.",
        "pt": "RustBet - Site confiável de apostas com skins do Rust. Jogos de jackpot, coinflip e aprimoramento. Reputação sólida, criptografia SSL, interface amigável.",
        "hi": "RustBet - विश्वसनीय जुआ साइट, पुरस्कार के रूप में Rust स्किन्स। जैकपॉट, कॉइनफ्लिप और स्किन अपग्रेडर खेल। साफ नाम, SSL एन्क्रिप्शन, उपयोगकर्ता के लिए सुविधाजनक।"
      },
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot and coinflip. Easily enter and withdraw items from games.": {
        "es": "RustStake: plataforma de apuestas de skins de Rust. Jackpot, coinflip y más. Fácil depósito y retiro de elementos del juego.",
        "tr": "RustStake, jackpot ve coinflip dahil olmak üzere çeşitli oyunlar sunan bir Rust skin bahis platformudur. Oyunlardan kolayca eşya girip çıkartabilirsiniz.",
        "pt": "RustStake é uma plataforma de jogos de apostas de skins do Rust que oferece uma variedade de jogos, incluindo jackpot e coinflip. Entre e retire itens dos jogos com facilidade.",
        "hi": "RustStake एक Rust स्किन जुआ मंच है जो जैकपॉट और कॉइनफ्लिप सहित कई खेलों की पेशकश करता है। आप आसानी से खेलों में आइटम प्रवेश कर सकते हैं और निकाल सकते हैं।"
      },
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods.": {
        "es": "De hecho, el precursor de los sitios para ganar a través de Steam se destaca por su gran selección de métodos de retiro.",
        "tr": "Aslında, Steam üzerinden kazanç elde etmek için sitelerin öncüsü olan bu site, büyük çaplı çekim yöntemleri seçeneğiyle öne çıkmaktadır.",
        "pt": "Na verdade, o precursor de sites para ganhar dinheiro através do Steam, destaca-se pela enorme seleção de métodos de saque.",
        "hi": "वास्तव में, स्टीम के माध्यम से कमाई के लिए साइटों का पितामह, इसके वापसी विधियों के विशाल चयन के लिए मशहूर है।"
      },
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable.": {
        "es": "RustyLoot ofrece juegos como Ruleta y Plinko, asegurando diversión y seguridad con su sistema transparente y comprobable.",
        "tr": "RustyLoot, Tekerlek, Plinko ve daha fazlasını içeren çeşitli oyunlar sunar. Güvenli ve eğlenceli RustyLoot, şeffaf ve ispat edilebilir adil bir sistem sunar.",
        "pt": "RustyLoot oferece vários jogos, incluindo Roleta, Plinko e mais. Seguro e divertido, com sistema transparente e justo.",
        "hi": "RustyLoot व्हील, प्लिंको और अन्य खेल समेत विविधता प्रदान करता है। अपने पारदर्शी और सत्यापन योग्य सिस्टम के साथ, RustyLoot सुरक्षित और मजेदार है।"
      },
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.": {
        "es": "RustChance ha estado operando desde 2017 y ofrece varios juegos populares, incluyendo Jackpot, Ruleta, Cara o Cruz, Crash y Minas terrestres.",
        "tr": "RustChance, 2017 yılından bu yana faaliyet gösteren ve Jackpot, Tekerlek, Coinflip, Crash ve Mayınlar gibi birçok popüler oyun sunan bir platformdur.",
        "pt": "O RustChance está em operação desde 2017 e oferece vários jogos populares, incluindo Jackpot, Roleta, Cara ou Coroa, Queda e Campo Minado.",
        "hi": "RustChance 2017 से संचालित हो रहा है और जैकपॉट, व्हील, कॉइनफ्लिप, क्रैश और लैंडमाइंस समेत कई लोकप्रिय खेल प्रदान करता है।"
      },
      "Gamehag is a GPT platform that rewards users for gaming tasks with the ability to exchange rewards for real prizes.": {
        "es": "Gamehag es una plataforma GPT que recompensa a los usuarios por completar tareas de juegos, pudiendo canjear las recompensas por premios reales.",
        "tr": "Gamehag, kullanıcıları oyun görevleri için ödüllendiren ve ödülleri gerçek ödüllerle değiştirme imkanı sunan bir GPT platformudur.",
        "pt": "Gamehag é uma plataforma GPT que recompensa os usuários por tarefas de jogos, com a possibilidade de trocar as recompensas por prêmios reais.",
        "hi": "Gamehag एक GPT प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को गेमिंग कार्यों के लिए पुरस्कृत करता है, जिसमें पुरस्कारों को वास्तविक पुरस्कारों में बदलने की सुविधा है।"
      },
      "SkinSwap - a convenient and reliable platform for trading and quickly selling items from CS2 and Rust with instant payouts.": {
        "es": "SkinSwap - una plataforma conveniente y confiable para intercambiar y vender rápidamente artículos de CS2 y Rust con pagos instantáneos.",
        "tr": "SkinSwap - CS2 ve Rust'tan öğeleri takas etmek ve hızlıca satmak için kullanışlı ve güvenilir bir platform, anında ödeme ile.",
        "pt": "SkinSwap - uma plataforma conveniente e confiável para trocar e vender rapidamente itens de CS2 e Rust com pagamentos instantâneos.",
        "hi": "SkinSwap - CS2 और Rust से आइटमों के व्यापार और त्वरित बिक्री के लिए एक सुविधाजनक और विश्वसनीय मंच, त्वरित भुगतान के साथ।"
      },
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.": {
        "es": "Sitio único donde puedes ganar dinero ganando juegos en varias disciplinas cibernéticas de juegos móviles. También tiene muchos muros de ofertas.",
        "tr": "Bu site, çeşitli mobil oyunlarda para kazanmanızı sağlayan birçok teklif duvarı gibi farklı mobil oyun disiplinlerinde gelir elde etmenizi sağlar.",
        "pt": "Um site único onde você pode ganhar dinheiro ganhando jogos em várias disciplinas cibernéticas de jogos móveis. Também possui muitos offerwalls.",
        "hi": "एक अद्वितीय साइट जहां आप विभिन्न मोबाइल गेमिंग साइबर विषयों में खेल जीतकर पैसे कमा सकते हैं। इसके अलावा कई ऑफरवॉल्स भी हैं।"
      },
      "RustMoment is a Rust skin gambling platform offering unique modes and bonuses, including rakeback and a daily case.": {
        "es": "RustMoment es una plataforma de juegos de azar con skins de Rust que ofrece modos únicos y bonificaciones, incluyendo rakeback y un caso diario.",
        "tr": "RustMoment, Rust skinleriyle bahis yapma platformudur ve rakeback ile günlük kasa dahil olmak üzere benzersiz modlar ve bonuslar sunar.",
        "pt": "RustMoment é uma plataforma de apostas com skins de Rust que oferece modos e bônus exclusivos, incluindo rakeback e um caso diário.",
        "hi": "RustMoment एक Rust स्किन जुआ प्लेटफार्म है, जो अद्वितीय मोड और बोनस प्रदान करता है, जिसमें रेकबैक और दैनिक केस शामिल हैं।"
      },
      "Freeward is a platform for earning through surveys, watching videos, and games, featuring an achievements system and a wide variety of withdrawal methods.": {
        "es": "Freeward es una plataforma para ganar a través de encuestas, ver videos y juegos, con un sistema de logros y una amplia variedad de métodos de retiro.",
        "tr": "Freeward, anketler, video izleme ve oyunlar yoluyla kazanç sağlama platformudur; başarı sistemi ve geniş bir çekilme yöntemleri yelpazesi sunar.",
        "pt": "Freeward é uma plataforma para ganhar dinheiro respondendo pesquisas, assistindo vídeos e jogando, com conquistas e diversos métodos de saque.",
        "hi": "Freeward एक प्लेटफ़ॉर्म है जहाँ सर्वेक्षणों, वीडियो देखने और खेलों के माध्यम से कमाई की जा सकती है, जिसमें एक उपलब्धि प्रणाली और निकासी के कई विकल्प हैं।"
      },
      "Roobet is a popular crypto-casino. It offers a variety of games, a VIP program, sport and esport betting, and quality customer support.": {
        "es": "Roobet es un popular cripto-casino. Ofrece una variedad de juegos, un programa VIP, apuestas y soporte al cliente de calidad.",
        "tr": "Roobet, popüler bir kripto-kumarhanedir. Çeşitli oyunlar, VIP programı, bahisler ve kaliteli müşteri desteği sunar.",
        "pt": "Roobet é um popular cripto-cassino. Ele oferece uma variedade de jogos, um programa VIP, apostas e suporte ao cliente de qualidade.",
        "hi": "रूबेट एक लोकप्रिय क्रिप्टो-कैसिनो है। यह विभिन्न प्रकार के खेल, वीआईपी कार्यक्रम, दांव और उच्च गुणवत्ता वाली ग्राहक सहायता प्रदान करता है।"
      },
      "xplay is a platform where CS2 players earn skins by completing in-game tasks on servers, with a battle pass and subscription.": {
        "es": "xplay es una plataforma donde los jugadores de CS2 ganan skins completando tareas en el juego en servidores, con pase de batalla.",
        "tr": "xplay, CS2 oyuncularının sunucularda oyun içi görevleri tamamlayarak kaplamalar kazandığı, savaş bileti ve abonelik bulunan bir platformdur.",
        "pt": "xplay é uma plataforma onde os jogadores de CS2 ganham skins completando tarefas no jogo em servidores, com passe de batalha e assinatura.",
        "hi": "xplay एक प्लेटफ़ॉर्म है जहाँ CS2 खिलाड़ी सर्वरों पर गेम के कार्यों को पूरा करके स्किन्स कमाते हैं, साथ ही बैटल पास और सब्सक्रिप्शन की सुविधा भी है।"
      },
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations.": {
        "es": "Establecido en 2018, ofrece juegos de jackpot, coinflip y ruleta con características mejoradas, equidad demostrable y animaciones atractivas.",
        "tr": "2018 yılında kurulan bu site, gelişmiş özelliklere, ispat edilebilir adalet sistemine ve çekici animasyonlara sahip jackpot, coinflip ve rulet oyunları sunar.",
        "pt": "Estabelecido em 2018, oferece jogos de jackpot, coinflip e roleta com recursos aprimorados, justiça comprovável e animações atrativas.",
        "hi": "2018 में स्थापित किया गया, यह जैकपॉट, कॉइनफ्लिप और रूलेट खेल प्रदान करता है जिनमें उन्नत सुविधाएं, साबित करने योग्य न्यायता और आकर्षक एनिमेशन होते हैं।"
      },
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers.": {
        "es": "GameTame es un sitio GPT que ofrece recompensas por completar actividades y ofertas. Es especialmente diseñado para jugadores.",
        "tr": "GameTame, çeşitli aktiviteleri ve teklifleri tamamlamanın karşılığında ödüller sunan bir GPT sitesidir. Platform özellikle oyuncular için tasarlanmıştır.",
        "pt": "GameTame é um site que oferece recompensas por completar atividades e ofertas. É projetado especialmente para jogadores.",
        "hi": "GameTame एक GPT साइट है जो विभिन्न गतिविधियों और प्रस्तावों के पूरा करने के लिए पुरस्कार प्रदान करती है। प्लेटफ़ॉर्म विशेष रूप से गेमर्स के लिए डिज़ाइन किया गया है।"
      },
      "Salad.com is a platform for earning through PC mining, offering mining optimization and rewards in the form of cryptocurrency, games, and gift cards.": {
        "es": "Salad.com es una plataforma para ganar dinero minando con una PC, que ofrece optimización y recompensas en criptomonedas, juegos y tarjetas de regalo.",
        "tr": "Salad.com, PC madenciliği yoluyla kazanç sağlayan, madencilik optimizasyonu ve kripto para birimi, oyunlar ve hediye kartları şeklinde ödüller sunan bir platformdur.",
        "pt": "Salad.com é uma plataforma para ganhar dinheiro minerando com um PC, oferecendo otimização e recompensas em criptomoedas, jogos e cartões de presente.",
        "hi": "Salad.com एक ऐसा प्लेटफ़ॉर्म है जो पीसी माइनिंग के माध्यम से कमाई और क्रिप्टोकरेंसी, गेम्स और गिफ्ट कार्ड्स के रूप में पुरस्कार प्रदान करता है।"
      },
      "Earnweb is a GPT site from the owners of Gamehag, offering earnings through gaming tasks, and stands out with its simple interface.": {
        "es": "Earnweb es un sitio GPT de los propietarios de Gamehag, que ofrece ganancias a través de tareas de juegos y se destaca por su interfaz simple.",
        "tr": "Earnweb, Gamehag sahiplerinin sunduğu, oyun görevleri ile kazanç sağlayan bir GPT sitesidir ve basit arayüzüyle öne çıkar.",
        "pt": "Earnweb é um site GPT dos proprietários do Gamehag, que oferece ganhos através de tarefas de jogos e se destaca por sua interface simples.",
        "hi": "Earnweb Gamehag के मालिकों द्वारा संचालित एक GPT साइट है, जो गेमिंग कार्यों के माध्यम से कमाई की पेशकश करती है और इसके सरल इंटरफ़ेस के साथ अलग दिखती है।"
      },
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources.": {
        "es": "SteamGifts es un sitio web legítimo para sorteos de juegos de Steam con una comunidad solidaria y recursos útiles.",
        "tr": "SteamGifts, destekleyici bir topluma ve yardımcı kaynaklara sahip Steam Oyun Hediye Çekilişleri için güvenilir bir web sitesidir.",
        "pt": "SteamGifts é um site legítimo para sorteios de jogos do Steam, com uma comunidade solidária e recursos úteis.",
        "hi": "SteamGifts एक वैध वेबसाइट है जो Steam गेम गिवअवे के लिए एक सहायक समुदाय और मददगार संसाधनों के साथ है।"
      },
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. Owned by RustChance.": {
        "es": "RustCases es un sitio de apuestas confiable para Rust con varios modos de juego, una amplia selección de cajas y opciones de retiro de skins. Propiedad de RustChance.",
        "tr": "RustCases, çeşitli oyun modlarına, geniş bir kutu seçeneğine ve skin çekme seçeneklerine sahip güvenilir bir Rust kumar sitesidir. RustChance tarafından sahiplenilmiştir.",
        "pt": "RustCases é um site confiável de apostas em Rust com diversos modos de jogo, uma ampla seleção de cases e opções de retirada de skins.",
        "hi": "RustCases एक भरोसेमंद Rust जुआ साइट है जिसमें विभिन्न खेल मोड, विशाल संख्या में केस, और स्किन निकासी के विकल्प होते हैं। RustChance के मालिकों द्वारा।"
      },
      "RustClash - a popular gambling site in the Rust community, with unique modes featuring beautiful animations and plenty of bonuses.": {
        "es": "RustClash - un sitio de apuestas popular en la comunidad de Rust, con modos únicos que presentan hermosas animaciones y una gran cantidad de bonificaciones.",
        "tr": "RustClash - Rust topluluğunda popüler bir kumar sitesi, güzel animasyonlarla benzersiz modlar ve bol miktarda bonus sunuyor.",
        "pt": "RustClash - um site de apostas popular na comunidade de Rust, com modos únicos, animações bonitas e muitos bônus.",
        "hi": "RustClash - Rust समुदाय में एक लोकप्रिय जुआ साइट, अनोखे मोड्स के साथ सुंदर एनीमेशन और ढेर सारे बोनस।"
      },
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.": {
        "es": "BC.Game es un casino en línea y casa de apuestas deportivas lanzado en 2017, ofreciendo más de 8,000 juegos, incluyendo juegos propietarios.",
        "tr": "BC.Game, 2017'de piyasaya sürülen bir çevrimiçi kumarhane ve spor kitabıdır. 8.000'den fazla oyun sunar ve mülkiyetindeki ve adil olduğu bilinir.",
        "pt": "BC.Game é um cassino online e casa de apostas lançado em 2017, com mais de 8.000 jogos, incluindo jogos proprietários e provavelmente justos.",
        "hi": "BC.Game एक ऑनलाइन कैसीनो और स्पोर्ट्सबुक है जिसे 2017 में लॉन्च किया गया था, जो स्वामित्व वाले और संभावित इंसाफ़ वाले गेम्स सहित 8,000 से अधिक गेम्स प्रदान करता है।"
      },
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.": {
        "es": "Primedice es un casino en línea que utiliza criptomonedas para juegos de dados. Lanzado en 2013, fue uno de los pioneros en esta forma de juego.",
        "tr": "Primedice, 2013 yılından bu yana faaliyet gösteren bir çevrimiçi kripto zar oyunu kumarhanesidir. Kripto parayı kumar için kullanan ilk platformlardan biridir.",
        "pt": "Primedice é um cassino de dados criptografados online em operação desde 2013, pioneiro no uso de criptomoedas em jogos de azar.",
        "hi": "Primedice एक ऑनलाइन क्रिप्टो डाइस गेम कैसीनो है जो 2013 से संचालन में है। यह जुए के लिए क्रिप्टो का प्रयोग करने वाले पहले प्लेटफ़ॉर्मों में से एक था।"
      },
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.": {
        "es": "Tradeit es un mercado en línea que permite a los jugadores intercambiar, comprar y vender skins de varios juegos, como CS2. Funciona desde 2017.",
        "tr": "Tradeit, CS2 ve diğer oyunlar için skin takasını, alımını ve satımını sağlayan çevrimiçi bir pazardır. 2017'den beri hizmet vermektedir.",
        "pt": "Tradeit é um mercado online de skins de jogos, incluindo CS2, onde os jogadores podem trocar, comprar e vender skins. Trabalhando desde 2017.",
        "hi": "Tradeit एक ऑनलाइन व्यापार जगत है जो खिलाड़ियों को अवसर प्रदान करता है खेलों की विभिन्न प्रकारों के लिए स्किन व्यापार, खरीद और बेचने का। 2017 से काम कर रहा है।"
      },
      "DMarket is a popular platform for trading CS2, Rust, Dota 2, and Team Fortress 2 items, offering a wide assortment and security.": {
        "es": "DMarket es una plataforma popular para el comercio de objetos de CS2, Rust, Dota 2 y Team Fortress 2, que ofrece una amplia variedad y seguridad.",
        "tr": "DMarket, CS2, Rust, Dota 2 ve Team Fortress 2 öğelerinin ticareti için popüler bir platform olup geniş bir ürün yelpazesi ve güvenlik sunmaktadır.",
        "pt": "DMarket é uma plataforma popular para a troca de itens de CS2, Rust, Dota 2 e Team Fortress 2, oferecendo uma ampla variedade e segurança.",
        "hi": "DMarket CS2, Rust, Dota 2 और Team Fortress 2 आइटम्स की ट्रेडिंग के लिए एक लोकप्रिय प्लेटफ़ॉर्म है, जो व्यापक विकल्प और सुरक्षा प्रदान करता है।"
      },
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.": {
        "es": "BitSkins es un mercado en línea para skins de juegos, especialmente para Counter-Strike 2, Dota 2 y Team Fortress 2. Lanzado en 2015.",
        "tr": "BitSkins, CS2, Dota 2 ve Team Fortress 2 gibi oyunlardaki skinleri alıp satabileceğiniz çevrimiçi bir pazardır. 2015 yılında kurulmuştur.",
        "pt": "BitSkins é um mercado online para skins de jogos, especialmente para Counter-Strike 2, Dota 2 e Team Fortress 2. Lançado em 2015.",
        "hi": "BitSkins एक ऑनलाइन बाजार है खेल की स्किनों के लिए, विशेष रूप से Counter-Strike 2, Dota 2 और Team Fortress 2 के लिए। 2015 में लॉन्च किया गया।"
      },
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": {
        "es": "Mercado P2P seguro de Hellcase. Encriptado SSL, verificación KYC, diseño amigable, precios competitivos, plataforma confiable.",
        "tr": "Hellcase'e ait güvenli P2P pazar. SSL şifrelemeli, KYC doğrulaması, kullanıcı dostu tasarım, rekabetçi fiyatlandırma, güvenilir ticaret platformu.",
        "pt": "Mercado P2P seguro da Hellcase. Criptografado com SSL, verificação KYC, design amigável, preços competitivos, plataforma confiável.",
        "hi": "Hellcase द्वारा स्वामित्व में रखा गया सुरक्षित P2P बाजार। SSL एन्क्रिप्टेड, KYC सत्यापन, मित्रतापूर्ण डिज़ाइन, प्रतिस्पर्धी मूल्य निर्धारण, विश्वसनीय व्यापार प्लेटफ़ॉर्म।"
      },
      "GamerPay is a trusted platform for buying and selling CS2 skins, with a free selling option, secure transactions, and high-quality skin inspection tool.": {
        "es": "GamerPay: plataforma confiable de compra y venta de skins de CS2. Venta gratuita, transacciones seguras y alta calidad en la inspección de skins.",
        "tr": "GamerPay, CS2 skinlerinin alınıp satılabildiği güvenilir bir platformdur. Ücretsiz satış seçeneği, güvenli işlemler ve yüksek kaliteli skin kontrol aracı sunar.",
        "pt": "GamerPay é uma plataforma confiável para compra e venda de skins de CS2. Venda gratuita, transações seguras, inspeção de skins de alta qualidade.",
        "hi": "GamerPay एक विश्वसनीय प्लेटफ़ॉर्म है CS2 स्किन खरीद और बेचने के लिए, जिसमें एक मुफ्त बिक्री विकल्प, सुरक्षित लेन-देन और उच्च गुणवत्ता वाला स्किन जांच उपकरण है।"
      },
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.": {
        "es": "CSGO Market es un mercado P2P en línea que ofrece una plataforma segura para comprar y vender skins de CS2. Establecido en 2015.",
        "tr": "CSGO Market, CS2 skinlerinin alınıp satılabildiği güvenli ve güvenli bir platform sunan çevrimiçi bir P2P pazarıdır. 2015 yılında kuruldu.",
        "pt": "CSGO Market é um mercado P2P online que oferece uma plataforma segura para comprar e vender skins de CS2. Estabelecido em 2015.",
        "hi": "CSGO Market एक ऑनलाइन P2P बाजार है जो CS2 स्किन खरीद और बेचने के लिए एक सुरक्षित और सुरक्षित प्लेटफ़ॉर्म प्रदान करता है। 2015 में स्थापित किया गया।"
      },
      "Lis-Skins is a popular platform for buying and quickly selling items from CS2, Rust, and Dota 2, with bonuses and cryptocurrency withdrawals.": {
        "es": "Lis-Skins es una plataforma popular para comprar y vender rápidamente objetos de CS2, Rust y Dota 2, con bonificaciones y retiros en criptomonedas.",
        "tr": "Lis-Skins, CS2, Rust ve Dota 2'den öğeler satın almak ve hızlıca satmak için popüler bir platformdur; bonuslar ve kripto para çekme seçenekleri sunar.",
        "pt": "Lis-Skins é uma plataforma popular para comprar e vender rapidamente itens de CS2, Rust e Dota 2, com bônus e saques em criptomoeda.",
        "hi": "Lis-Skins CS2, Rust और Dota 2 के आइटम खरीदने और तेजी से बेचने के लिए एक लोकप्रिय प्लेटफ़ॉर्म है, जिसमें बोनस और क्रिप्टोक्यूरेंसी निकासी की सुविधा है।"
      },
      "SkinCashier is an online platform that allows players to Instant Sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": {
        "es": "SkinCashier es una plataforma en línea que permite vender instantáneamente skins de CS2, Rust, Dota 2 y TF2 por dinero real. Desde 2020.",
        "tr": "SkinCashier, CS2, Rust, Dota 2 ve TF2 kaplamalarını anında satmanızı sağlayan bir çevrimiçi platformdur. 2020'den beri faaliyette.",
        "pt": "SkinCashier é uma plataforma online de venda instantânea de skins de CS2, Rust, Dota 2 e TF2 por dinheiro real desde 2020.",
        "hi": "SkinCashier एक ऑनलाइन प्लेटफ़ॉर्म है जो खिलाड़ियों को अपने CS2, Rust, Dota 2 और TF2 स्किन को तत्काल बेचने की अनुमति देता है और वास्तविक धन के लिए। 2020 से संचालित हो रहा है।"
      },
      "WhiteMarket is a P2P platform developed for trading items from the game CS2. Safe transactions, various deposit options, and regular activities.": {
        "es": "WhiteMarket es una plataforma P2P desarrollada para el intercambio de artículos del juego CS2. Transacciones seguras y actividades regulares.",
        "tr": "WhiteMarket, CS2 oyununun eşyalarını takas etmek için geliştirilen bir P2P platformudur. Güvenli işlemler ve düzenli etkinlikler.",
        "pt": "WhiteMarket é uma plataforma P2P desenvolvida para a negociação de itens do jogo CS2. Transações seguras e atividades regulares.",
        "hi": "WhiteMarket एक P2P प्लेटफ़ॉर्म है जिसे CS2 खेल से आइटमों की ट्रेडिंग के लिए विकसित किया गया है। सुरक्षित लेन-देन और नियमित गतिविधियाँ।"
      },
      "CS.Deals is a popular trading platform for CS2, Dota 2, Rust, and TF2 game items, featuring low fees and a user-friendly interface.": {
        "es": "CS.Deals es una plataforma de intercambio popular para artículos de juegos de CS2, Dota 2, Rust y TF2, con bajas comisiones y una interfaz fácil de usar.",
        "tr": "CS.Deals, düşük komisyonlar ve kullanıcı dostu arayüzü ile CS2, Dota 2, Rust ve TF2 oyun eşyaları için popüler bir ticaret platformudur.",
        "pt": "CS.Deals é uma plataforma de negociação popular para itens de jogos CS2, Dota 2, Rust e TF2, com taxas baixas e uma interface amigável.",
        "hi": "CS.Deals कम शुल्क और उपयोगकर्ता के अनुकूल इंटरफेस के साथ CS2, Dota 2, Rust और TF2 गेम आइटम के लिए एक लोकप्रिय ट्रेडिंग प्लेटफ़ॉर्म है।"
      },
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": {
        "es": "SkinBid: mercado en línea para skins de CS2 y objetos de juego con funciones de compra, venta y subasta y una interfaz intuitiva.",
        "tr": "SkinBid, CS2 skinleri ve oyun içi ürünler için bir çevrimiçi pazardır ve kullanıcı dostu bir arayüzle alım, satım ve açık artırma özellikleri sunar.",
        "pt": "SkinBid é um mercado online para skins de CS2 e itens de jogos, oferecendo recursos de compra, venda e leilão com uma interface amigável.",
        "hi": "SkinBid एक ऑनलाइन बाजार है CS2 स्किन और खेल की आइटमों के लिए, जो एक उपयोगकर्ता-मित्रतापूर्ण इंटरफ़ेस के साथ खरीदने, बेचने और नीलामी की सुविधाएं प्रदान करता है।"
      },
      "LOOT.Farm is a popular platform for trading items from CS2, Rust, Dota 2, and TF2 with transparent conditions and an active community.": {
        "es": "LOOT.Farm es una plataforma popular para intercambiar objetos de CS2, Rust, Dota 2 y TF2 con condiciones transparentes y una comunidad activa.",
        "tr": "LOOT.Farm, CS2, Rust, Dota 2 ve TF2 öğelerinin takası için şeffaf koşullar ve aktif bir topluluğa sahip popüler bir platformdur.",
        "pt": "LOOT.Farm é uma plataforma popular para trocar itens de CS2, Rust, Dota 2 e TF2 com condições transparentes e uma comunidade ativa.",
        "hi": "LOOT.Farm CS2, Rust, Dota 2 और TF2 आइटम्स के लिए एक लोकप्रिय प्लेटफ़ॉर्म है, जिसमें पारदर्शी शर्तें और एक सक्रिय समुदाय है।"
      },
      "SkinBaron is an online platform based in Germany that enables users to buy and sell their CS2 skins. The platform has gained a good reputation.": {
        "es": "SkinBaron es una plataforma en línea alemana para comprar y vender skins de CS2, reconocida por su excelente reputación.",
        "tr": "SkinBaron, kullanıcıların CS2 skinlerini satın alıp satmalarını sağlayan Almanya merkezli bir çevrimiçi platformdur. Platform iyi bir üne sahiptir.",
        "pt": "SkinBaron é uma plataforma online alemã para compra e venda de skins de CS2 com boa reputação.",
        "hi": "SkinBaron जर्मनी में स्थित एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को उनकी CS2 स्किन खरीदने और बेचने की सुविधा प्रदान करता है। प्लेटफ़ॉर्म को एक अच्छी प्रतिष्ठा हासिल हुई है।"
      },
      "Gamdom, a leader in the world of crypto-casinos, offers a wide variety of games, numerous bonuses, fair play, and social interaction.": {
        "es": "Gamdom, líder en el mundo de los cripto-casinos, ofrece una gran variedad de juegos, numerosos bonos, juego justo e interacción social.",
        "tr": "Gamdom, kripto kumarhaneleri dünyasında bir lider olarak, geniş bir oyun yelpazesi, birçok bonus, adil oyun ve sosyal etkileşim sunuyor.",
        "pt": "Gamdom, líder no mundo dos cripto-casinos, oferece uma grande variedade de jogos, muitos bônus, jogo justo e interação social.",
        "hi": "Gamdom, क्रिप्टो-कैसीनो की दुनिया में अग्रणी, कई प्रकार के खेल, बड़ी संख्या में बोनस, निष्पक्ष खेल और सामाजिक बातचीत की पेशकश करता है।"
      },
      "Avan.Market is a platform for quickly buying and selling in-game items from CS2, Rust, Dota 2, and TF2, with support for cryptocurrencies and bank cards.": {
        "es": "Avan.Market es una plataforma para la compra y venta rápida de objetos de juego de CS2, Rust, Dota 2 y TF2, con soporte para criptomonedas y tarjetas bancarias.",
        "tr": "Avan.Market, CS2, Rust, Dota 2 ve TF2'deki oyun içi öğeleri hızlıca satın almak ve satmak için bir platformdur; kripto para birimleri ve banka kartları desteğiyle.",
        "pt": "Avan.Market é uma plataforma para comprar e vender rapidamente itens de jogos de CS2, Rust, Dota 2 e TF2, com suporte para criptomoeda.",
        "hi": "Avan.Market CS2, Rust, Dota 2 और TF2 के इन-गेम आइटम को तेजी से खरीदने और बेचने के लिए एक प्लेटफ़ॉर्म है, जो क्रिप्टोकरेंसी और बैंक कार्ड का समर्थन करता है।"
      },
      "Moon.Market - a platform for the quick sale of items from games CS2, Dota 2, Rust, and TF2 at fair prices with fast payouts.": {
        "es": "Moon.Market - una plataforma para la venta rápida de artículos de los juegos CS2, Dota 2, Rust y TF2 a precios justos con pagos rápidos.",
        "tr": "Moon.Market - CS2, Dota 2, Rust ve TF2 oyunlarındaki öğeleri hızlı bir şekilde satmak için adil fiyatlarla ve hızlı ödemelerle bir platform.",
        "pt": "Moon.Market - uma plataforma para a venda rápida de itens dos jogos CS2, Dota 2, Rust e TF2 a preços justos com pagamentos rápidos.",
        "hi": "Moon.Market - CS2, Dota 2, Rust, और TF2 खेलों के आइटम्स को तेजी से बेचने के लिए एक प्लेटफ़ॉर्म, उचित कीमतों पर और तेज़ भुगतान के साथ।"
      },
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": {
        "es": "Skins.Cash: plataforma confiable con buenas reseñas, soporte al cliente confiable y más de seis años de experiencia. Precios no óptimos.",
        "tr": "Skins.Cash, güvenilir müşteri desteği sunan ve altı yılı aşkın süredir aktif olan bir platformdur, ancak fiyatlandırma en iyi değildir.",
        "pt": "Skins.Cash é uma plataforma confiável com avaliações positivas e mais de seis anos de operação, mas preços não são os melhores.",
        "hi": "Skins.Cash एक प्रतिष्ठित प्लेटफ़ॉर्म है जिसके पास सकारात्मक समीक्षा, विश्वसनीय ग्राहक सहायता और छह साल से अधिक कार्यकाल है। मूल्य बेहतर नहीं है।"
      },
      "CYBERSHOKE is a website that provides servers for playing CS2. It offers various servers for players to choose.": {
        "es": "CYBERSHOKE es un sitio web que ofrece servidores para jugar CS2. Ofrece varios servidores para que los jugadores elijan.",
        "tr": "CYBERSHOKE, CS2 oynamak için sunucular sağlayan bir web sitesidir. Oyuncuların seçebileceği çeşitli sunucular sunar.",
        "pt": "A CYBERSHOKE é um site que disponibiliza servidores para jogar CS2. Ele oferece vários servidores para os jogadores escolherem.",
        "hi": "CYBERSHOKE एक वेबसाइट है जो CS2 खेलने के लिए सर्वर प्रदान करती है। यह खिलाड़ियों के लिए विभिन्न सर्वर प्रदान करता है जिन्हें चुनने के लिए।"
      },
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": {
        "es": "Sube de nivel fácilmente en Steam. Vende emojis y fondos de perfil para Cartas de Intercambio de Steam y progresa rápidamente.",
        "tr": "Bu site, Steam seviyenizi hızla yükseltmek için tasarlandı. Steam Ticaret Kartlarından emoji ve profil arka planları satabilir, seviye atlayabilirsiniz.",
        "pt": "Este site facilita o aumento de nível no Steam. Venda emojis e fundos de perfil em troca de cartas de troca do Steam para subir de nível rapidamente.",
        "hi": "यह साइट स्टीम को आसान बनाने के लिए बनाई गई है, आप स्टीम ट्रेडिंग कार्ड के लिए इमोजी और प्रोफ़ाइल बैकग्राउंड बेचकर तेजी से स्तर बढ़ा सकते हैं।"
      },
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": {
        "es": "SteamLevelU es una plataforma confiable para mejorar los niveles de tu cuenta de Steam mediante la compra de paquetes de cartas de intercambio.",
        "tr": "SteamLevelU, Steam hesap seviyelerini yükseltmek için güvenilir bir platformdur. SH Level Up ile bağlantılıdır.",
        "pt": "O SteamLevelU é uma plataforma legítima para comprar pacotes de cartas de troca do Steam e aumentar o nível da sua conta Steam.",
        "hi": "SteamLevelU एक विधि स्वरूपित प्लेटफ़ॉर्म है जिससे आप स्टीम खाता स्तरों को बढ़ाने के लिए स्टीम ट्रेडिंग कार्ड पैक खरीद सकते हैं, जो एसएच लेवल अप के साथ जुड़ा हुआ है।"
      },
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": {
        "es": "SteamLevels es un sitio web fácil de usar que te ayuda a aumentar el nivel de tu cuenta de Steam. Compra paquetes de cartas e intercambia skins de CSGO.",
        "tr": "SteamLevels, kart paketleri satın alarak ve CSGO skinlerini kabul ederek Steam hesabınızın seviyesini artırmaya yardımcı olan kullanıcı dostu bir web sitesidir.",
        "pt": "SteamLevels é um site fácil de usar que ajuda a aumentar o nível da sua conta Steam através da compra de pacotes de cartas e da aceitação de skins do CSGO.",
        "hi": "SteamLevels एक उपयोगकर्ता मित्रपूर्ण वेबसाइट है जो आपके स्टीम खाता स्तर को बढ़ाने में मदद करती है। इसे कार्ड पैक खरीदकर और सीएसजीओ स्किन्स स्वीकार करके किया जा सकता है।"
      },
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": {
        "es": "RustStake: Plataforma de apuestas de skins de Rust. Variedad de juegos, incluyendo jackpot y coinflip. Fácil retiro de elementos del juego.",
        "tr": "RustStake, jackpot ve coinflip gibi bir dizi oyun sunan bir Rust skin kumar platformudur. Oyundan kolayca öğeleri yatırabilir ve çekebilirsiniz.",
        "pt": "O RustStake é uma plataforma de apostas de skins de Rust com jogos como jackpot e coinflip. Fácil entrada e retirada de itens.",
        "hi": "RustStake एक Rust स्किन जुआ प्लेटफ़ॉर्म है जो जैकपॉट और कॉइनफ्लिप समेत विभिन्न खेल प्रदान करता है। आसानी से खेलों से आइटम को दाखिल और निकाल सकते हैं।"
      },
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.": {
        "es": "iTrade.gg es una plataforma confiable para el comercio de skins de Rust. Su diseño intuitivo, bono de registro gratuito y recompensas diarias crean una experiencia de comercio fluida.",
        "tr": "iTrade.gg, rostoların ticaretini yapmak için güvenilir bir platformdur. Kullanıcı dostu tasarım, ücretsiz kayıt bonusu ve günlük ödüller sorunsuz bir ticaret deneyimi sağlar.",
        "pt": "Confiável para negociar skins de Rust. Design intuitivo, bônus de inscrição grátis e recompensas diárias para uma experiência de negociação tranquila.",
        "hi": "iTrade.gg एक विश्वसनीय प्लेटफ़ॉर्म है जहां रस्ट स्किन्स की ट्रेडिंग की जा सकती है। उपयोगकर्ता-मित्रपूर्ण डिज़ाइन, मुफ़्त साइन-अप बोनस और दैनिक पुरस्कार एक सुगठित ट्रेडिंग अनुभव बनाते हैं।"
      },
      "Shuffle is a crypto-casino with unique games, a provably fair system, a VIP program, and an engaging gaming experience.": {
        "es": "Shuffle es un cripto-casino con juegos únicos, un sistema de verificación de equidad, un programa VIP y una experiencia de juego emocionante.",
        "tr": "Shuffle, benzersiz oyunlar, doğrulanabilir adil bir sistem, VIP programı ve heyecan verici bir oyun deneyimi sunan bir kripto-kazinosudur.",
        "pt": "Shuffle é um cripto-cassino com jogos únicos, sistema de verificação de justiça, programa VIP e uma experiência de jogo envolvente.",
        "hi": "Shuffle एक क्रिप्टो-कैसीनो है जिसमें अनोखे खेल, निष्पक्षता की जांच करने वाली प्रणाली, VIP कार्यक्रम और एक रोमांचक गेमिंग अनुभव है।"
      },
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.": {
        "es": "Destacado mercado en línea, amplia oferta desde juegos hasta tarjetas de regalo, tarifas reducidas, reputación estelar, interfaz intuitiva.",
        "tr": "Dikkat çekici online pazar, oyunlardan hediye kartlarına geniş ürün yelpazesi, düşük fiyatlar, mükemmel itibar, sezgisel arayüz, %98'e varan indirimler.",
        "pt": "Notável mercado online, vasta oferta de jogos a cartões-presente, taxas reduzidas, reputação excelente, interface intuitiva.",
        "hi": "महत्वपूर्ण ऑनलाइन बाजार, खेल से उपहार कार्ड तक विशाल विविधता, कम कीमतें, उत्कृष्ट प्रतिष्ठा, सूक्ष्म इंटरफेस, तक 98% छूट."
      },
      "Withdraw BTC, ETH, LTC or PayPal!": {
        "es": "¡Retira BTC, ETH, LTC o PayPal!",
        "tr": "BTC, ETH, LTC veya PayPal çekin!",
        "pt": "Retire BTC, ETH, LTC ou PayPal!",
        "hi": "BTC, ETH, LTC या PayPal निकालें!"
      },
      "Withdraw Money, Skins or Devices!": {
        "es": "Retira dinero, skins o dispositivos!",
        "tr": "Para, Skinler veya Cihazlar Çekin!",
        "pt": "Levantar dinheiro, skins ou dispositivos!",
        "hi": "धन, स्किन या उपकरण निकालें!"
      },
      "Withdraw USDT, LTC, ETH and many else!": {
        "es": "Retira USDT, LTC, ETH y muchos más!",
        "tr": "USDT, LTC, ETH ve birçok şey çekin!",
        "pt": "Retire USDT, LTC, ETH e muito mais!",
        "hi": "बीटीसी, एलटीसी, ईटीएच और बहुत सारे अन्य के निकास!"
      },
      "Withdrawal of many types of cryptocurrencies!": {
        "es": "¡Retiro de muchos tipos de criptomonedas!",
        "tr": "Birçok türde kripto paranın çekilmesi!",
        "pt": "Retirada de vários tipos de criptomoedas!",
        "hi": "बहुत सारे प्रकार के क्रिप्टोकरेंसीज़ का निकास!"
      },
      "Withdraw CS2 Skins, Crypto or Real Money!": {
        "es": "Retira Skins de CS2, criptomonedas o dinero!",
        "tr": "CS2 Skinleri, Kripto veya Gerçek Para Çekin!",
        "pt": "Retirar Skins do CS2, Criptomoedas ou Dinheiro!",
        "hi": "वापसी करें CS2 स्किन, क्रिप्टो या वास्तविक धन!"
      },
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": {
        "es": "Retira items de CS2, Dota 2, TF2 o Rust!",
        "tr": "CS2, Dota 2, TF2 veya Rust Eşyalarını Çekin!",
        "pt": "Retirar Itens do CS2, Dota 2, TF2 ou Rust!",
        "hi": "वापसी करें CS2, Dota 2, TF2 या Rust आइटम!"
      },
      "Withdraw CS2 Skins, Crypto or Game Keys!": {
        "es": "Retira skins de CS2, criptomonedas o juegos.",
        "tr": "CS2 Skinleri, Kripto veya Oyun Anahtarları Çekin!",
        "pt": "Retirar Skins do CS2, Criptomoedas ou Jogos!",
        "hi": "वापसी करें CS2 स्किन, क्रिप्टो या गेम कुंजी!"
      },
      "Withdraw CS2 Skins, Crypto or PayPal!": {
        "es": "Retira Skins de CS2, criptomonedas o PayPal!",
        "tr": "CS2 Skinleri, Kripto veya PayPal Çekin!",
        "pt": "Retirar Skins do CS2, Criptomoedas ou PayPal!",
        "hi": "वापसी करें CS2 स्किन, क्रिप्टो या PayPal!"
      },
      "Withdraw Money, CS2, TF2 or Rust Skins!": {
        "es": "Retira dinero, Skins de CS2, TF2 o Rust!",
        "tr": "Para, CS2, TF2 veya Rust Skinleri Çekin!",
        "pt": "Retirar Dinheiro, Skins do CS2, TF2 ou Rust!",
        "hi": "वापसी करें धन, CS2, TF2 या Rust स्किन!"
      },
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": {
        "es": "Retira Skins de CS2, Dota 2 y items de H1Z1!",
        "tr": "CS2 Skinleri, Dota 2 ve H1Z1 Eşyalarını Çekin!",
        "pt": "Retirar Skins do CS2, Dota 2 e Itens do H1Z1!",
        "hi": "वापसी करें CS2 स्किन, Dota 2 और H1Z1 आइटम!"
      },
      "Withdraw CS2, Rust Skins and Dota 2 Items!": {
        "es": "Retira Skins de CS2, Rust y items de Dota 2!",
        "tr": "CS2, Rust Skinleri ve Dota 2 Eşyalarını Çekin!",
        "pt": "Retirar Skins do CS2, Rust e Itens do Dota 2!",
        "hi": "वापसी करें CS2, Rust स्किन और Dota 2 आइटम!"
      },
      "Withdraw Rust Skins, Crypto or PayPal!": {
        "es": "Retira Skins de Rust, criptomonedas o PayPal!",
        "tr": "Rust Skinleri, Kripto veya PayPal Çekin!",
        "pt": "Saque Skins do Rust, Criptomoedas ou PayPal!",
        "hi": "Rust स्किन, क्रिप्टो या PayPal निकालें!"
      },
      "Withdraw Dota 2 Items, Crypto or PayPal!": {
        "es": "Retira objetos de Dota 2, criptomonedas o PayPal!",
        "tr": "Dota 2 Skinleri, Kripto veya PayPal Çekin!",
        "pt": "Saque Skins dota 2, Criptomoedas ou PayPal!",
        "hi": "Dota 2 स्किन, क्रिप्टो या PayPal निकालें!"
      },
      "Withdraw Rust Skins or Crypto!": {
        "es": "Retira Skins de Rust o criptomonedas!",
        "tr": "Rust Skinleri veya Kripto Çekin!",
        "pt": "Retire Skins do Rust ou Criptomoedas!",
        "hi": "Rust स्किन या क्रिप्टो को निकालें!"
      },
      "Withdraw Rust Skins and Items!": {
        "es": "Retira Skins e items de Rust!",
        "tr": "Rust Skinleri ve Eşyaları Çekin!",
        "pt": "Retire Skins e Itens do Rust!",
        "hi": "Rust स्किन और आइटम को निकालें!"
      },
      "Buy Games, Gift Cards and many-many more.": {
        "es": "¡Compra Juegos, Tarjetas y Mucho Más!",
        "tr": "Oyunlar, Hediye Kartları ve daha fazlasını alın.",
        "pt": "Compre Jogos, Cartões e Muito Mais.",
        "hi": "खेलें, उपहार कार्ड और बहुत-सारा और भी खरीदें।"
      },
      "Withdraw with many-many ways.": {
        "es": "Retira de muchas-muchas formas.",
        "tr": "Çok çok farklı şekillerde çekim yapın.",
        "pt": "Retirar de várias-muitas maneiras.",
        "hi": "बहुत-सारे तरीकों से निकालें।"
      },
      "Withdraw Crypto, gift cards or real money!": {
        "es": "Retira criptomonedas, tarjetas de regalo o dinero real!",
        "tr": "Kripto, hediye kartları ve gerçek para çekin!",
        "pt": "Retire Crypto, cartões presente ou dinheiro!",
        "hi": "क्रिप्टो, गिफ्ट कार्ड या वास्तविक धन को निकालें!"
      },
      "Withdraw CS2 Skins, Gift Cards or Crypto!": {
        "es": "Retira Skins de CS2, tarjetas regalo o criptomonedas!",
        "tr": "CS2 Skins, hediye kartları ve gerçek para çekin!",
        "pt": "Retire Skins, Cartões Presente ou Criptomoedas!",
        "hi": "CS2 स्किन, गिफ्ट कार्ड या क्रिप्टो को निकालें!"
      },
      "Withdraw Bitcoin, Ethereum or Litecoin!": {
        "es": "Retira Bitcoin, Ethereum o Litecoin!",
        "tr": "Bitcoin, Ethereum veya Litecoin çekin!",
        "pt": "Retire Bitcoin, Ethereum ou Litecoin!",
        "hi": "बिटकॉइन, एथेरियम या लाइटकॉइन को निकालें!"
      },
      "Withdraw Games, GiftCards and many more!": {
        "es": "Retira juegos, tarjetas de regalo y mucho más!",
        "tr": "Oyunlar, hediye kartları ve çok daha fazlasını çekin!",
        "pt": "Retire Jogos, Cartões Presente e muito mais!",
        "hi": "गेम्स, गिफ्ट कार्ड्स और बहुत कुछ को निकालें!"
      },
      "Withdraw Crypto or Real Money!": {
        "es": "Retira criptomonedas o dinero real!",
        "tr": "Kripto para veya gerçek para çekin!",
        "pt": "Retire Criptomoedas ou Dinheiro Real!",
        "hi": "क्रिप्टो या वास्तविक धन को निकालें!"
      },
      "Withdraw Crypto and Gift Cards!": {
        "es": "Retira criptomonedas y tarjetas de regalo!",
        "tr": "Kripto para ve hediye kartları çekin!",
        "pt": "Levantar Criptomoedas e Cartões de Presente!",
        "hi": "क्रिप्टो और गिफ्ट कार्ड निकालें!"
      },
      "Withdraw CS2 Skins or Items!": {
        "es": "Retira Skins o items de CS2!",
        "tr": "CS2 Skins veya eşyalar çekin!",
        "pt": "Levantar Skins ou Itens de CS2!",
        "hi": "स्किन या आइटम निकालें!"
      },
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": {
        "es": "Retira juegos, tarjetas de regalo o items de Dota2 y TF2!",
        "tr": "Oyunlar, hediye kartları ve Dota 2 & TF2 eşyaları çekin!",
        "pt": "Levantar Jogos ou Itens de Dota2 e TF2!",
        "hi": "गेम्स, गिफ्ट कार्ड्स या Dota2 और TF2 आइटम निकालें!"
      },
      "Withdraw Games, GiftCards or Donate to Charity!": {
        "es": "Retira juegos, tarjetas de regalo o dona a caridad!",
        "tr": "Oyunlar, hediye kartları veya bağış yapın!",
        "pt": "Levantar Jogos, Cartões de Presente!",
        "hi": "गेम्स, गिफ्ट कार्ड्स या चैरिटी को दान करें!"
      },
      "Participate in Giveaways and win Steam Games.": {
        "es": "Participa en sorteos y gana juegos de Steam.",
        "tr": "Çekilişlere katılın ve Steam oyunları kazanın.",
        "pt": "Participar em Sorteios e ganhar Jogos da Steam.",
        "hi": "गिवअवे में भाग लें और स्टीम गेम जीतें।"
      },
      "Withdraw CS2 And Rust Skins or Crypto!": {
        "es": "Retira Skins de CS2 y Rust o criptomonedas!",
        "tr": "CS2 ve Rust Skins veya kripto para çekin!",
        "pt": "Retirar Skins do CS2 e Rust ou Criptomoedas!",
        "hi": "वापसी करें CS2 और Rust स्किन या क्रिप्टो!"
      },
      "Withdraw CS2 Skins or Real Money!": {
        "es": "Retira Skins de CS2 o dinero real!",
        "tr": "CS2 Skins veya gerçek para çekin!",
        "pt": "Retirar Skins do CS2 ou Dinheiro Real!",
        "hi": "वापसी करें CS2 स्किन या वास्तविक धन!"
      },
      "Withdraw Steam Trading cards or Games.": {
        "es": "Retira cartas de intercambio de Steam o juegos!",
        "tr": "Steam Takas kartları veya oyunları çekin.",
        "pt": "Retirar Cartas do Steam ou Jogos.",
        "hi": "वापसी करें Steam ट्रेडिंग कार्ड या गेम्स।"
      },
      "Withdraw USDT, Skins or Real Money!": {
        "es": "Retira USDT, Skins o dinero real!",
        "tr": "USDT, Skins veya gerçek para çekin!",
        "pt": "Retirar USDT, Skins ou Dinheiro Real!",
        "hi": "वापसी करें USDT, स्किन या वास्तविक धन!"
      },
      "Withdraw Money, CS2 or Rust Skins!": {
        "es": "Retira dinero, Skins de CS2 o Rust!",
        "tr": "Para, CS2 veya Rust Skins çekin!",
        "pt": "Retirar Dinheiro, Skins do CS2 ou Rust!",
        "hi": "वापसी करें धन, CS2 या Rust स्किन!"
      },
      "Withdraw Money, Crypto or Skins!": {
        "es": "Retira dinero, criptomonedas o Skins!",
        "tr": "Para, kripto para veya Skins çekin!",
        "pt": "Retirar Dinheiro, Criptomoedas ou Skins!",
        "hi": "वापसी करें धन, क्रिप्टो या स्किन!"
      },
      "Withdraw CS2 Skins or Crypto!": {
        "es": "Retira Skins de CS2 o criptomonedas!",
        "tr": "CS2 Skins veya kripto para çekin!",
        "pt": "Retirar Skins do CS2 ou Criptomoedas!",
        "hi": "वापसी करें CS2 स्किन या क्रिप्टो!"
      },
      "Withdraw Money, Crypto or PayPal!": {
        "es": "Retira dinero, criptomonedas o PayPal!",
        "tr": "Para, kripto para veya PayPal çekin!",
        "pt": "Retirar Dinheiro, Criptomoedas ou PayPal!",
        "hi": "वापसी करें धन, क्रिप्टो या PayPal!"
      },
      "Withdraw with P2P CS2 Skins.": {
        "es": "RETIRA CON SKINS P2P DE CS2.",
        "tr": "P2P CS2 SKINS ile çekin.",
        "pt": "Retirar com Skins do CS2 P2P.",
        "hi": "P2P CS2 स्किन के साथ वापसी करें।"
      },
      "Withdraw Real Money or Crypto!": {
        "es": "Retira dinero real o criptomonedas!",
        "tr": "Gerçek para veya kripto para çekin!",
        "pt": "Retirar Dinheiro Real ou Criptomoedas!",
        "hi": "वापसी करें वास्तविक धन या क्रिप्टो!"
      },
      "Withdraw BTC, ETH, USDT or Tron!": {
        "es": "Retira BTC, ETH, USDT o Tron!",
        "tr": "BTC, ETH, USDT veya Tron çekin!",
        "pt": "Retirar BTC, ETH, USDT ou Tron!",
        "hi": "वापसी करें BTC, ETH, USDT या Tron!"
      },
      "Withdraw CS2 Skins or PayPal!": {
        "es": "Retira Skins de CS2 o PayPal!",
        "tr": "CS2 Skins veya PayPal çekin!",
        "pt": "Retirar Skins do CS2 ou PayPal!",
        "hi": "वापसी करें CS2 स्किन या PayPal!"
      },
      "Withdraw CS2 Skins and Items!": {
        "es": "Retira Skins e items de CS2!",
        "tr": "CS2 Skins ve eşyalar çekin!",
        "pt": "Retirar Skins e Itens do CS2!",
        "hi": "वापसी करें CS2 स्किन और आइटम!"
      },
      "Withdraw Steam Trading cards.": {
        "es": "Retira cartas de intercambio de Steam!",
        "tr": "Steam Takas kartları çekin!",
        "pt": "Retirar Cartas de Negociação do Steam.",
        "hi": "Steam ट्रेडिंग कार्ड वापसी करें।"
      },
      "1h, 24h and 7d Giveaways": {
        "es": "Sorteos de 1h, 24h y 7d",
        "tr": "1s, 24s ve 7g çekilişler",
        "pt": "Sorteios de 1h, 24h e 7d",
        "hi": "1 घंटा, 24 घंटे और 7 दिन के उपहार"
      },
      "24h Giveaway": {
        "es": "Sorteo de 24h",
        "tr": "24s çekiliş",
        "pt": "Sorteio de 24h",
        "hi": "24 घंटे का उपहार"
      },
      "3h and 24h Giveaway": {
        "es": "Sorteos de 3h y 24h",
        "tr": "3s ve 24s çekiliş",
        "pt": "Sorteios de 3h e 24h",
        "hi": "3 घंटे और 24 घंटे का उपहार"
      },
      "Daily and Weekly Giveaways": {
        "es": "Sorteos diarios y semanales",
        "tr": "Günlük ve haftalık çekilişler",
        "pt": "Sorteios Diários e Semanais",
        "hi": "प्रतिदिनिक और साप्ताहिक उपहार"
      },
      "1h Giveaway": {
        "es": "Sorteo de 1h",
        "tr": "1s çekiliş",
        "pt": "Sorteio de 1h",
        "hi": "1 घंटे का उपहार"
      },
      "1h, 24h Giveaways": {
        "es": "Sorteos de 1h y 24h",
        "tr": "1s, 24s çekilişler",
        "pt": "Sorteios de 1h e 24h",
        "hi": "1 घंटा, 24 घंटे के उपहार"
      },
      "Rare Giveaways": {
        "es": "Sorteos raros",
        "tr": "Nadir çekilişler",
        "pt": "Sorteios Raros",
        "hi": "दुर्लभ उपहार"
      },
      "Weekly Giveaways": {
        "es": "Sorteos semanales",
        "tr": "Haftalık çekilişler",
        "pt": "Sorteios Semanais",
        "hi": "साप्ताहिक उपहार"
      },
      "Daily Giveaways": {
        "es": "Sorteos diarios",
        "tr": "Günlük çekilişler",
        "pt": "Sorteios Diários",
        "hi": "रोज़ाना बांटने का इंतेज़ाम"
      },
      "Daily Giveaway": {
        "es": "Sorteos diarios",
        "tr": "Günlük Çekiliş",
        "pt": "Sorteio Diário",
        "hi": "रोज़ाना बांटने का इंतेज़ाम"
      },
      "Deposit Required": {
        "es": "Depósito requerido",
        "tr": "Depozito gerekiyor",
        "pt": "Depósito Necessário",
        "hi": "जमा आवश्यक"
      },
      "+300% Deposit Bonus": {
        "es": "+300% Bono de depósito",
        "tr": "+300% Depozito Bonusu",
        "pt": "300% Bónus de Depósito",
        "hi": "+300% जमा बोनस"
      },
      "+180% Deposit Bonus": {
        "es": "+180% Bono de depósito",
        "tr": "+180% Depozito Bonusu",
        "pt": "180% Bónus de Depósito",
        "hi": "+180% जमा बोनस"
      },
      "+100% Deposit Bonus": {
        "es": "+100% Bono de depósito",
        "tr": "+100% Depozito Bonusu",
        "pt": "100% Bónus de Depósito",
        "hi": "+100% जमा बोनस"
      },
      "+11% Deposit Bonus": {
        "es": "+11% Bono de depósito",
        "tr": "+11% Depozito Bonusu",
        "pt": "11% Bónus de Depósito",
        "hi": "+11% जमा बोनस"
      },
      "+10% Deposit Bonus": {
        "es": "+10% Bono de depósito",
        "tr": "+10% Depozito Bonusu",
        "pt": "10% Bónus de Depósito",
        "hi": "+10% जमा बोनस"
      },
      "+5% Deposit Bonus": {
        "es": "+5% Bono de depósito",
        "tr": "+5% Depozito Bonusu",
        "pt": "5% Bónus de Depósito",
        "hi": "+5% जमा बोनस"
      },
      "+1% Deposit Bonus": {
        "es": "+1% Bono de depósito",
        "tr": "+1% Depozito Bonusu",
        "pt": "1% Bónus de Depósito",
        "hi": "+1% जमा बोनस"
      },
      "Rakeback System": {
        "es": "Sistema de Rake",
        "tr": "Rakeback Sistemi",
        "pt": "Sistema de Rakeback",
        "hi": "रेकबैक प्रणाली"
      },
      "Every 24h Reward": {
        "es": "Recompensa cada 24 horas",
        "tr": "Her 24 saatte bir ödül",
        "pt": "ecompensa a Cada 24 Horas",
        "hi": "प्रतिदिन 24 घंटे के बाद इनाम"
      },
      "Daily Case": {
        "es": "Estuche diario",
        "tr": "Günlük Kaa",
        "pt": "Caixa Diária",
        "hi": "प्रतिदिन केस"
      },
      "Daily Faucet": {
        "es": "Grifo diario",
        "tr": "Günlük Musluk",
        "pt": "Faucet Diário",
        "hi": "प्रतिदिन फॉसेट"
      },
      "Daily Roll": {
        "es": "Tirada diaria",
        "tr": "Günlük Çark",
        "pt": "Rolar Diário",
        "hi": "प्रतिदिन रोल"
      },
      "Daily Coins": {
        "es": "Monedas diarias",
        "tr": "Günlük Paralar",
        "pt": "Moedas Diárias",
        "hi": "प्रतिदिन सिक्के"
      },
      "Daily Rewards": {
        "es": "Recompensas diarias",
        "tr": "Günlük Ödüller",
        "pt": "Recompensas Diárias",
        "hi": "रोज़ाना की पुरस्कार"
      },
      "Faucet and Giveaways": {
        "es": "Grifo y sorteos",
        "tr": "Musluk ve çekilişler",
        "pt": "Faucet e Sorteios",
        "hi": "फॉसेट और उपहार"
      },
      "Daily 0.02$": {
        "es": "0.02$ diarios",
        "tr": "Günlük 0.02$",
        "pt": "0,02$ Diários",
        "hi": "प्रतिदिन 0.02$"
      },
      "Daily 0.02$ + Free Case": {
        "es": "0.02$ diarios + Estuche gratis",
        "tr": "Günlük 0.02$ + Ücretsiz Kasa",
        "pt": "0,02$ Diários + Caixa Grátis",
        "hi": "प्रतिदिन 0.02$ + मुफ्त केस"
      },
      "Deposit Bonus": {
        "es": "Bono de depósito",
        "tr": "Depozito Bonusu",
        "pt": "Bónus de Depósito",
        "hi": "जमा बोनस"
      },
      "Visit WebSite": {
        "es": "Visitar sitio web",
        "tr": "Web Sitesini Ziyaret Et",
        "pt": "Visite o Site",
        "hi": "वेबसाइट पर जाएं"
      },
      "Visit WebSite or Copy": {
        "es": "Visitar sitio web o copiar",
        "tr": "Web Sitesini Ziyaret Et",
        "pt": "Visite o Site ou Copie",
        "hi": "वेबसाइट पर जाएं"
      },
      "+1% Sell Bonus": {
        "es": "Bono de venta del +1%",
        "tr": "+1% Satış Bonusu",
        "pt": "Bônus de venda de +1%",
        "hi": "+1% बेचने का बोनस"
      },
      "+3% Sell Bonus": {
        "es": "Bono de venta del +3%",
        "tr": "+3% Satış Bonusu",
        "pt": "Bônus de venda de +3%",
        "hi": "+3% बेचने का बोनस"
      },
      "5 Free Cases": {
        "es": "5 Estuches gratis",
        "tr": "Ücretsiz Kasa",
        "pt": "5 Caixas Grátis",
        "hi": "5 मुफ्त केस"
      },
      "Free 100 Gems": {
        "es": "100 Gemas gratis",
        "tr": "100 Ücretsiz Taş",
        "pt": "100 Gemas Grátis",
        "hi": "मुफ्त 100 गेम्स"
      },
      "3 Free Cases": {
        "es": "3 Estuches gratis",
        "tr": "3 Ücretsiz Kasa",
        "pt": "3 Caixas Grátis",
        "hi": "3 मुफ्त केस"
      },
      "+25% to Rakeback": {
        "es": "+25% de Rakeback",
        "tr": "+%25 Rakeback",
        "pt": "+25% de Rakeback",
        "hi": "+25% रेकबैक"
      },
      "+20% to Rakeback": {
        "es": "+20% de Rakeback",
        "tr": "+%20 Rakeback",
        "pt": "+20% de Rakeback",
        "hi": "+20% रेकबैक"
      },
      "Free 5€": {
        "es": "5€ gratis",
        "tr": "5€ Bedava",
        "pt": "5€ Grátis",
        "hi": "मुफ्त 5€"
      },
      "1.50$ For Free": {
        "es": "1.50$ gratis",
        "tr": "Ücretsiz 1.50$",
        "pt": "1,50$ grátis",
        "hi": "मुफ्त 1.50 डॉलर"
      },
      "5.00$ For Free": {
        "es": "5.00$ gratis",
        "tr": "Ücretsiz 5.00$",
        "pt": "5.00$ grátis",
        "hi": "मुफ्त 5.00 डॉलर"
      },
      "Free 1.00$": {
        "es": "1.00$ gratis",
        "tr": "Ücretsiz 1.00$",
        "pt": "1,00$ grátis",
        "hi": "मुफ्त 1.00 डॉलर"
      },
      "Free 0.90$": {
        "es": "0.90$ gratis",
        "tr": "Ücretsiz 0.90$",
        "pt": "0,90$ grátis",
        "hi": "मुफ्त 0.90 डॉलर"
      },
      "Free 0.50$": {
        "es": "0.50$ gratis",
        "tr": "Ücretsiz 0.50$",
        "pt": "0,50$ grátis",
        "hi": "मुफ्त 0.50 डॉलर"
      },
      "Free 0.40$": {
        "es": "0.40$ gratis",
        "tr": "Ücretsiz 0.40$",
        "pt": "0,40$ grátis",
        "hi": "मुफ्त 0.40 डॉलर"
      },
      "Free 0.30$": {
        "es": "0.30$ gratis",
        "tr": "Ücretsiz 0.30$",
        "pt": "0,30$ grátis",
        "hi": "मुफ्त 0.30 डॉलर"
      },
      "Free 0.25$": {
        "es": "0.25$ gratis",
        "tr": "Ücretsiz 0.25$",
        "pt": "0,25$ grátis",
        "hi": "मुफ्त 0.25 डॉलर"
      },
      "Free 0.20$": {
        "es": "0.20$ gratis",
        "tr": "Ücretsiz 0.20$",
        "pt": "0,20$ grátis",
        "hi": "मुफ्त 0.20 डॉलर"
      },
      "Free 0.15$": {
        "es": "0.15$ gratis",
        "tr": "Ücretsiz 0.15$",
        "pt": "0,15$ grátis",
        "hi": "मुफ्त 0.15 डॉलर"
      },
      "Free 0.10$": {
        "es": "0.10$ gratis",
        "tr": "Ücretsiz 0.10$",
        "pt": "0,10$ grátis",
        "hi": "मुफ्त 0.10 डॉलर"
      },
      "Free 0.05$": {
        "es": "0.05$ gratis",
        "tr": "Ücretsiz 0.05$",
        "pt": "0,05$ grátis",
        "hi": "मुफ्त 0.05 डॉलर"
      },
      "Receive up to 5.00$": {
        "es": "Recibe hasta 5,00$",
        "tr": "5,00$'a kadar alın",
        "pt": "Receba até 5,00$",
        "hi": "5.00$ तक प्राप्त करें।"
      },
      "Free Case": {
        "es": "Estuche gratis",
        "tr": "Ücretsiz Kasa",
        "pt": "Caixa Grátis",
        "hi": "मुफ्त केस"
      },
      "Free 1.00$": {
        "es": "1.00$ gratis",
        "tr": "Ücretsiz 1.00$",
        "pt": "1.00$ Grátis",
        "hi": "मुफ्त 1 डॉलर"
      },
      "Free 2.00$": {
        "es": "2$ gratis",
        "tr": "Ücretsiz 2$",
        "pt": "2$ Grátis",
        "hi": "मुफ्त 2 डॉलर"
      },
      "Big Daily Giveaways": {
        "es": "Sorteos diarios grandes",
        "tr": "Büyük Günlük Çekilişler",
        "pt": "Grandes Sorteios Diários",
        "hi": "रोज़ाना बड़े हद तक दिए जाने वाले उपहार"
      },
      "Free Case up to 250$": {
        "es": "Estuche gratis de hasta 250$",
        "tr": "Ücretsiz Kasa, 250$'a kadar",
        "pt": "Caixa Grátis até 250$",
        "hi": "250$ तक मुफ्त केस"
      },
      "Free 100 Diamonds": {
        "es": "100 Diamantes gratis",
        "tr": "Ücretsiz 100 Elmas",
        "pt": "100 Diamantes Grátis",
        "hi": "100 मुफ्त हीरे"
      },
      "Free 500 Coins": {
        "es": "500 monedas",
        "tr": "500 jeton",
        "pt": "500 moedas",
        "hi": "500 सिक्के मुफ्त"
      },
      "Daily Cases": {
        "es": "Estuches diarios",
        "tr": "Günlük Kasa",
        "pt": "Caixas Diárias",
        "hi": "रोज़ाना केस"
      },
      "3 Energy Points": {
        "es": "3 Puntos de energía",
        "tr": "3 Enerji Puanı",
        "pt": "3 Pontos de Energia",
        "hi": "3 ऊर्जा अंक"
      },
      "Free 200 Coins": {
        "es": "200 Monedas gratis",
        "tr": "Ücretsiz 200 Jeton",
        "pt": "200 Moedas Grátis",
        "hi": "200 सिक्के मुफ्त"
      },
      "Some Free Coins": {
        "es": "algunas monedas gratis",
        "tr": "biraz ücretsiz jeton",
        "pt": "algumas moedas grátis",
        "hi": "कुछ मुफ्त सिक्के"
      },
      "Free Spins": {
        "es": "Giros gratis",
        "tr": "Ücretsiz dönüşler",
        "pt": "Rodadas Grátis",
        "hi": "मुफ्त स्पिन"
      },
      "Offerwall": {
        "es": "Pared de ofertas",
        "tr": "Teklif Duvarı",
        "pt": "Parede de Ofertas",
        "hi": "ऑफरवॉल"
      },
      "x2 Mining Rate": {
        "es": "Tasa de minería x2",
        "tr": "x2 Madencilik Oranı",
        "pt": "Taxa de Mineração x2",
        "hi": "x2 खनन दर"
      },
      "Free Wheel": {
        "es": "Tirada libre",
        "tr": "Ücretsiz dönüş",
        "pt": "Rolagem grátis",
        "hi": "मुफ़्त रोल"
      },
      "Games Giveaways": {
        "es": "Sorteos de juegos",
        "tr": "Oyun Çekilişleri",
        "pt": "Distribuição de Jogos",
        "hi": "गेम्स गिवअवे"
      }
    };
  
    var elements = document.querySelectorAll(".box .content p, .box .logobg .best, .box .content button");
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations[text] && translations[text][languageTag]) {
        elements[j].innerHTML = translations[text][languageTag];
      }
    }
  }
}


translateURLsIfNeeded();
});
