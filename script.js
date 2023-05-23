if (!window.location.pathname.includes("/reviews/")) {
  // Получаем элементы
const boxContainer = document.querySelector('.category-selector');
const buttonsContainer = document.createElement('div');
const prevButtonContainer = document.createElement('button');
const nextButtonContainer = document.createElement('button');
const boxes = boxContainer.querySelectorAll('.category-box');
const boxWidth = boxes[0].offsetWidth + (2 * 9); // Ширина каждого div.category-box с учетом отступов
const containerWidth = boxWidth * 4; // Ширина контейнера для показа 4 боксов одновременно
let scrollPosition = 0; // Текущая позиция прокрутки

// Добавляем классы и текст кнопкам
buttonsContainer.classList.add('buttons-container');
prevButtonContainer.classList.add('controls-button');
prevButtonContainer.innerHTML = '<i class="bi bi-chevron-left"></i>';
nextButtonContainer.classList.add('controls-button');
nextButtonContainer.innerHTML = '<i class="bi bi-chevron-right"></i>';

// Добавляем кнопки в контейнер
buttonsContainer.appendChild(prevButtonContainer);
buttonsContainer.appendChild(nextButtonContainer);

// Добавляем контейнер с кнопками перед контейнером с боксами
boxContainer.parentNode.insertBefore(buttonsContainer, boxContainer);

// Устанавливаем ширину контейнера с боксами
boxContainer.style.width = `${containerWidth}px`;

// Обработчик события для кнопки "Влево"
prevButtonContainer.addEventListener('click', () => {
  scrollPosition -= boxWidth;
  scrollPosition = Math.max(scrollPosition, 0);
  boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
});

// Обработчик события для кнопки "Вправо"
nextButtonContainer.addEventListener('click', () => {
  scrollPosition += boxWidth;
  scrollPosition = Math.min(scrollPosition, boxContainer.scrollWidth - containerWidth);
  boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
});


var categorySelector = document.querySelector('div.category-selector');
var ulElements = categorySelector.querySelectorAll('div.category-selector > ul');
var ulArray = Array.from(ulElements);

ulArray.sort(function(a, b) {
  var aIsActive = a.querySelector('li a.category-box').id === 'active';
  var bIsActive = b.querySelector('li a.category-box').id === 'active';

  if (aIsActive && !bIsActive) {
    return -1; // Первый элемент (a) активный, поэтому он идет первым
  } else if (!aIsActive && bIsActive) {
    return 1; // Второй элемент (b) активный, поэтому он идет вторым
  } else {
    return Math.random() - 0.5; // Оба элемента либо активны, либо неактивны - сортировка рандомна
  }
});

while (categorySelector.firstChild) {
  categorySelector.removeChild(categorySelector.firstChild);
}

ulArray.forEach(function(ul) {
  categorySelector.appendChild(ul);
});
}
if (window.location.pathname.startsWith("/ru")) {
  function translateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href*="https://csgobroker.cc/"]');
    var regex = /^https:\/\/csgobroker\.cc\/(?!ru\/)/;

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (regex.test(href)) {
        var translatedHref = href.replace("https://csgobroker.cc/", "https://csgobroker.cc/ru/");
        links[i].setAttribute('href', translatedHref);
      }
  
      var translations = {
        "CS:GO Sites List": "Халява CS:GO",
        "Rust Sites List": "Халява Rust",
        "Dota 2 Sites List": "Халява Dota 2",
        "Crypto Sites List": "Крипто Халява",
        "Freebies Only": "Вся Халява",
        "Earning Sites": "Заработок",
        "Gambling Sites": "Игральные Сайты",
        "Earn by Play CS:GO": "Заработок на Игре в CS:GO",
        "All Sites": "Все Сайты",
        "Match Betting": "Ставки на Матчи",
        "Case Opening": "Кейсы",
        "Roulette": "Рулетка",
        "Coinflip": "Коинфлип",
        "Crash": "Краш",
        "Casino": "Казино",
        "Jackpot": "Джекпот",
        "Upgrader": "Апгрейдер",
        "Dice": "Кости",
        "Bonus Types": "Типы Халявы",
        "Sign Up Bonuses": "Бонус за Регистрацию",
        "Deposit Bonuses": "Бонус к Депозиту",
        "Daily Rewards": "Ежедневный Бонус",
        "Giveaways": "Розыгрыши",
        "Offerwall Sites": "Задания",
        "Earn by Play Sites": "Заработок на Игре",
        "Buy or Sell Skins": "Купить/Продать Скины",
        "Buy or Sell Items": "Купить/Продать Предметы",
        "Marketplaces": "Торговые Площадки",
        "Buy Items": "Купить Предметы",
        "Sell Items": "Продать Предметы",
        "Trade Items": "Обменять Предметы",
        "Buy Skins": "Купить Скины",
        "Sell Skins": "Продать Скины",
        "Trade Skins": "Обменять Скины"
      };
  
      var elements = document.querySelectorAll('.category-box-content span, ul .submenu li a');
      for (var j = 0; j < elements.length; j++) {
        var text = elements[j].textContent.trim();
        if (translations.hasOwnProperty(text)) {
          if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
            elements[j].innerHTML = translations[text] + ' <i class="bi bi-caret-right-fill"></i>';
          } else {
            elements[j].innerHTML = translations[text];
          }
        }
      }
    }
  }
  
  var categorySelector = document.querySelector('.category-selector');
  translateURLs(categorySelector);
}

if (window.location.pathname.startsWith("/ru")) {
  function translateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href*="https://csgobroker.cc/"]');
    var regex = /^https:\/\/csgobroker\.cc\/(?!ru\/)/;

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (regex.test(href)) {
        var translatedHref = href.replace("https://csgobroker.cc/", "https://csgobroker.cc/ru/");
        links[i].setAttribute('href', translatedHref);
      }
    }

    var translations = {
      "CSGO500 probably the best CS:GO Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, вероятно, является лучшим сайтом для азартных игр в CS:GO. Здесь регулярно проводятся раздачи и розыгрыши.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll - один из самых популярных сайтов, который включает в себя рулетку, крэш и многие другие игры включая ставки на киберспорт.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire - один из самых популярных сайтов, предлагающий игру в Рулетку и Монетку. Кроме того, на сайте доступны ставки на матчи.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon - это легендарный сайт, похожий на CSGODouble, с классической рулеткой, но имеющий еще множество режимов и ставки.",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Сайт Gamdom является одним из лучших сайтов для гемблинга в CS:GO. Здесь вы можете сыграть в рулетку, краш, слоты и многие другие игры!",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE - это известный сайт для ставок на киберспорт. Здесь вы можете делать ставки как скинами, так и настоящими деньгами!",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit - новый сайт казино, который включает в себя ставки на спорт и множество классических игр, таких как рулетка и коинфлип.",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "СSGOLuck - относительно новый сайт, где доступны игры в рулетку, Crash, мини-игры Mines и Towers, открытие кейсов и слоты.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits - это огромное крипто-казино с классическими азартными играми для сообщества CS:GO, такими как рулетка, монетка и другие.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG - это онлайн-платформа, которая предлагает широкий спектр игр на CS:GO скины с красивыми и плавными анимациями.",
      "Rustix - gambling platform for CS:GO and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - игровая платформа для CS:GO и Rust с оригинальными играми, честным геймплеем, бонусами и впечатляющей анимацией.",
      "CSGO-Skins is a reputable online platform where users can open custom CS:GO cases and participate in daily Giveaways.": "CSGO-Skins - это надежная онлайн-платформа, где пользователи могут открывать индивидуальные кейсы CS:GO и участвовать в раздачах.",
      "FlameCases is an online platform that permits users to open cases for CS:GO and Dota 2. Since its launch in 2017, the website provides various features.": "FlameCases - это онлайн-платформа, которая позволяет пользователям открывать кейсы для CS:GO и Dota 2. Работает еще с 2017.",
      "KNIFEX is a CS:GO gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX - это сайт CS:GO азартных игр, который предлагает различные режимы игры, включая открытие кейсов, битвы кейсов и многое другое!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS:GO. Its most prominent feature is the case-opening battles.": "DatDrop - это сайт, специализирующийся на открытии кейсов со скинами из CS:GO. Основной режим кейс батл.",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins - это легальный сайт открытия кейсов в CS:GO, который работает с 2017 года. На нем так же есть кейс батл и апгрейдер.",
      "Clash.gg is a new CS:GO Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg - это новый сайт для азартных игр CS:GO, который включает в себя множество игр, таких как Рулетка, Апгрейдер, Кейсы и многие другие!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore - это платформа, которая позволяет пользователям участвовать в ставках на скины CSGO через большое количество игровых режимов",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS:GO, Dota 2, and Rust.": "Платформа Hellcase предоставляет возможность пользователям приобретать виртуальные кейсы CS:GO, Dota 2 и Rust.",
      "CSGOBIG - a gambling site for CS:GO skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "Сайт азартных игр с использованием скинов из игры CS:GO, включающий такие режимы, как Jackpot, Coinflip, Roulette, Cases и Case Battles.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast - это сайт для азартных игр на скины CSGO, который предлагает широкий выбор эксклюзивных игровых режимов.",
      "CSGOLive is a safe and legitimate CS:GO case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive - это старый классический сайт открытия кейсов CS:GO, где вы можете создавать свои собственные кейсы. Включает ежедневные бонусы!",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins предоставляет классические игры азартного характера для CS:GO, такие как Джекпот, Рулетка и Крэш.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop - это надежная платформа для онлайн-гемблинга, которая предлагает различные игры, такие как битвы кейсов и апгрейдер.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins - это известный сайт для открытия кейсов в CS:GO, который работает с 2016 года и предлагает широкий выбор скинов для игроков.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS:GO , Dota 2, Valorant and many more.": "Bets4.pro - это онлайн-платформа, которая позволяет пользователям делать ставки на матчи в киберспорте, в особенности на CS:GO и Dota 2.",
      "Withdraw CS:GO Skins, Crypto or Real Money!": "Выводите скины CS:GO, криптовалюту или деньги!",
      "Withdraw CS:GO Skins , Crypto or real money!": "Выводите скины CS:GO, криптовалюту или деньги!",
      "Withdraw CS:GO Skins, Crypto or real money!": "Выводите скины CS:GO, криптовалюту или деньги!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "Выводите скины CS:GO, криптовалюту или Игры!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "Выводите скины CS:GO, Криптовалюту или PayPal!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "Выводите предметы CS:GO, Dota 2 и H1Z1!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "Выводите предметы CS:GO, Dota 2 и Rust!",
      "Withdraw CS:GO And Rust Skins or Crypto!": "Выводите скины CS:GO, Rust или Крипту!",
      "Withdraw CS:GO Skins or Crypto!": "Выводите скины CS:GO или криптовалюту!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "Вывод только скинами CS:GO через P2P!",
      "Withdraw CS:GO Skins and Items!": "Вывод только скинами CS:GO!",
      "Visit WebSite": "Посетить Сайт",
      "100% deposit bonus": "+100% к Пополнению",
      "5 Free Cases": "5 Бесплатных Кейсов",
      "5% deposit bonus": "+5% к Пополнению",
      "3 Free Cases": "3 Бесплатных Кейса",
      "1.5$ for free": "1.5$ Бесплатно",
      "Free 0.30$": "0.30$ Бесплатно",
      "Free 0.40$": "0.40$ Бесплатно",
      "Free 0.25$": "0.25$ Бесплатно",
      "Free 0.50$": "0.50$ Бесплатно",
      "Free 0.90$": "0.90$ Бесплатно",
      "Free 0.50$": "0.50$ Бесплатно",
      "free case": "Бесплатный Кейс",
      "Free 1$": "1$ Бесплатно",
      "Free 2$": "2$ Бесплатно",
      "Free 1$": "1$ Бесплатно",
      "Free spins": "ФриСпины"
    };

    var elements = parentElement.querySelectorAll('.box .content p, .box .logobg .best, .box .content button');
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        elements[j].innerHTML = translations[text];
      } else if (text.indexOf('code:') === 0) {
        elements[j].innerHTML = 'Код:' + text.substring(5);
      }
    }
  }

  var SitesList = document.querySelector('.boxes-holder');
  translateURLs(SitesList);
}



function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

const backToTopButton = document.querySelector("#back-to-top-btn");

window.addEventListener("scroll", scrollFunction);

function scrollFunction() {
  if (window.pageYOffset > 300) { // Show backToTopButton
    if(!backToTopButton.classList.contains("btnEntrance")) {
      backToTopButton.classList.remove("btnExit");
      backToTopButton.classList.add("btnEntrance");
      backToTopButton.style.display = "block";
    }
  }
  else { // Hide backToTopButton
    if(backToTopButton.classList.contains("btnEntrance")) {
      backToTopButton.classList.remove("btnEntrance");
      backToTopButton.classList.add("btnExit");
      setTimeout(function() {
        backToTopButton.style.display = "none";
      }, 250);
    }
  }
}


backToTopButton.addEventListener("click", smoothScrollBackToTop);

function smoothScrollBackToTop() {
  const targetPosition = 0;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  const duration = 750;
  let start = null;

  window.requestAnimationFrame(step);

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    window.scrollTo(0, easeInOutCubic(progress, startPosition, distance, duration));
    if (progress < duration) window.requestAnimationFrame(step);
  }
}

function easeInOutCubic(t, b, c, d) {
  t /= d/2;
  if (t < 1) return c/2*t*t*t + b;
  t -= 2;
  return c/2*(t*t*t + 2) + b;
}

var siteList = document.getElementById('site-list');
var searchInput = document.getElementById('search-input'); // Переместите это объявление вверх
var isRussianPage = window.location.pathname.includes('/ru'); // Проверяем, содержится ли в пути "/ru/"
var sites = [
'<li><a href="https://csgobroker.cc/reviews/idle-empire">Idle-empire</a></li>',
'<li><a href="https://csgobroker.cc/reviews/insanegg">Insanegg</a></li>',
'<li><a href="https://csgobroker.cc/reviews/key-drop">Key-drop</a></li>',
'<li><a href="https://csgobroker.cc/reviews/knifex">Knifex</a></li>',
'<li><a href="https://csgobroker.cc/reviews/lis-skins">Lis-skins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/lootbear">Lootbear</a></li>',
'<li><a href="https://csgobroker.cc/reviews/lootfarm">Lootfarm</a></li>',
'<li><a href="https://csgobroker.cc/reviews/primedice">Primedice</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rollbit">Rollbit</a></li>',
'<li><a href="https://csgobroker.cc/reviews/roobet">Roobet</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustbet">Rustbet</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustcases">Rustcases</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustchance">Rustchance</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustclash">Rustclash</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustix">Rustix</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustmoment">Rustmoment</a></li>',
'<li><a href="https://csgobroker.cc/reviews/ruststake">Ruststake</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustyloot">Rustyloot</a></li>',
'<li><a href="https://csgobroker.cc/reviews/rustypot">Rustypot</a></li>',
'<li><a href="https://csgobroker.cc/reviews/salad">Salad</a></li>',
'<li><a href="https://csgobroker.cc/reviews/shadowpay">Shadowpay</a></li>',
'<li><a href="https://csgobroker.cc/reviews/skinbaron">Skinbaron</a></li>',
'<li><a href="https://csgobroker.cc/reviews/skinbet">Skinbet</a></li>',
'<li><a href="https://csgobroker.cc/reviews/skincashier">Skincashier</a></li>',
'<li><a href="https://csgobroker.cc/reviews/skinscash">Skinscash</a></li>',
'<li><a href="https://csgobroker.cc/reviews/skinswap">Skinswap</a></li>',
'<li><a href="https://csgobroker.cc/reviews/steamgifts">Steamgifts</a></li>',
'<li><a href="https://csgobroker.cc/reviews/steamlvlup">Steamlvlup</a></li>',
'<li><a href="https://csgobroker.cc/reviews/swapgg">Swapgg</a></li>',
'<li><a href="https://csgobroker.cc/reviews/tradeit">Tradeit</a></li>',
'<li><a href="https://csgobroker.cc/reviews/vvvgamers">Vvvgamers</a></li>',
'<li><a href="https://csgobroker.cc/reviews/wtfskins">Wtfskins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/xplay">Xplay</a></li>',
'<li><a href="https://csgobroker.cc/reviews/avanmarket">Avanmarket</a></li>',
'<li><a href="https://csgobroker.cc/reviews/banditcamp">Banditcamp</a></li>',
'<li><a href="https://csgobroker.cc/reviews/bcgame">Bcgame</a></li>',
'<li><a href="https://csgobroker.cc/reviews/bets4pro">Bets4pro</a></li>',
'<li><a href="https://csgobroker.cc/reviews/bitskins">Bitskins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/bitskins-p2p">Bitskins p2p</a></li>',
'<li><a href="https://csgobroker.cc/reviews/clashgg">Clashgg</a></li>',
'<li><a href="https://csgobroker.cc/reviews/crashgg">Crashgg</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csdeals">CsDeals</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgo500">CSGO500</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgobig">CSGOBig</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgoempire">CSGOEmpire</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgofast">CSGOFast</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgolive">CSGOLive</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgoluck">CSGOLuck</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgo-market">CSGO-Market</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgopolygon">CSGOPolygon</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgopositive">CSGOPositive</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgoroll">CSGORoll</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgoselly">CSGOSelly</a></li>',
'<li><a href="https://csgobroker.cc/reviews/csgo-skins">CSGO-Skins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/cybershoke">Cybershoke</a></li>',
'<li><a href="https://csgobroker.cc/reviews/daddyskins">Daddyskins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/datdrop">Datdrop</a></li>',
'<li><a href="https://csgobroker.cc/reviews/dmarket">Dmarket</a></li>',
'<li><a href="https://csgobroker.cc/reviews/duelbits">Duelbits</a></li>',
'<li><a href="https://csgobroker.cc/reviews/earnweb">Earnweb</a></li>',
'<li><a href="https://csgobroker.cc/reviews/farmskins">Farmskins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/flamecases">Flamecases</a></li>',
'<li><a href="https://csgobroker.cc/reviews/freecash">Freecash</a></li>',
'<li><a href="https://csgobroker.cc/reviews/freeward">Freeward</a></li>',
'<li><a href="https://csgobroker.cc/reviews/gamdom">Gamdom</a></li>',
'<li><a href="https://csgobroker.cc/reviews/gamehag">Gamehag</a></li>',
'<li><a href="https://csgobroker.cc/reviews/gamerpay">Gamerpay</a></li>',
'<li><a href="https://csgobroker.cc/reviews/gametame">Gametame</a></li>',
'<li><a href="https://csgobroker.cc/reviews/gcskins">Gcskins</a></li>',
'<li><a href="https://csgobroker.cc/reviews/grindbux">Grindbux</a></li>',
'<li><a href="https://csgobroker.cc/reviews/hellcase">Hellcase</a></li>',
'<li><a href="https://csgobroker.cc/reviews/hellstore">Hellstore</a></li>',
'<li><a href="https://csgobroker.cc/reviews/howlgg">Howlgg</a></li>',
'<li><a href="https://csgobroker.cc/reviews/hypeup">Hypeup</a></li>'
];

function compareSites(a, b) {
  var siteNameA = a.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var siteNameB = b.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var searchTerm = searchInput.value.toLowerCase();

  if (siteNameA.charAt(0) === searchTerm.charAt(0) && siteNameB.charAt(0) !== searchTerm.charAt(0)) {
      return -1;
  } else if (siteNameA.charAt(0) !== searchTerm.charAt(0) && siteNameB.charAt(0) === searchTerm.charAt(0)) {
      return 1;
  } else {
      return siteNameA.localeCompare(siteNameB);
  }
}

function updateSiteList() {
  siteList.innerHTML = '';
  sites.sort(compareSites);

  sites.forEach(function(site) {
    var li = document.createElement('li');
    li.className = 'site-item';
    li.style.display = 'none';
    li.innerHTML = site;
    
    var link = li.querySelector('a');
    
    // Добавляем "/ru/" после "csgobroker.cc/" к ссылке, если находимся на русской странице
    if (isRussianPage) {
      var href = link.getAttribute('href');
      var newHref = href.replace('csgobroker.cc/', 'csgobroker.cc/ru/');
      link.setAttribute('href', newHref);
    }
    
    li.innerHTML = '';
    li.appendChild(link);
    
    siteList.appendChild(li);
  });
}

function hideAllSites(siteItems) {
  for (var i = 0; i < siteItems.length; i++) {
      var siteItem = siteItems[i];
      hideSite(siteItem);
  }
}

function hideSite(siteItem) {
  siteItem.style.display = 'none';
}

function showSite(siteItem) {
  siteItem.style.display = 'flex';
}

function handleSearchInput() {
  var searchTerm = searchInput.value.toLowerCase();
  var siteItems = siteList.getElementsByClassName('site-item');

  if (searchTerm === '') {
      hideAllSites(siteItems);
      siteList.style.display = 'none';
      return;
  }

  for (var i = 0; i < siteItems.length; i++) {
      var siteItem = siteItems[i];
      var siteName = siteItem.textContent.toLowerCase();

      if (siteName.startsWith(searchTerm)) {
          showSite(siteItem);
      } else {
          hideSite(siteItem);
      }
  }

  siteList.style.display = 'block';
}

searchInput.addEventListener('input', handleSearchInput);

searchInput.addEventListener('focus', function() {
  if (searchInput.value === '') {
      siteList.style.display = 'none';
  } else {
      siteList.style.display = 'block';
  }
});

searchInput.addEventListener('blur', function() {
  setTimeout(function() {
      siteList.style.display = 'none';
  }, 150);
});

updateSiteList();

var slides = document.getElementsByClassName("slide");
var triggersContainer = document.querySelector(".screens");

var currentIndex = 0;
var slideInterval;
var startX = 0;
var threshold = 100; // Минимальное расстояние для определения свайпа

var prevButton = document.querySelector(".prev-button");
var nextButton = document.querySelector(".next-button");

if (window.location.pathname.includes("/reviews/")) {
  function removeAllTriggers() {
    var existingTriggers = triggersContainer.querySelectorAll(
      "input[type='radio'], label"
    );
    existingTriggers.forEach(function (trigger) {
      triggersContainer.removeChild(trigger);
    });
  }
  
  function createTrigger(index) {
    var trigger = document.createElement("input");
    trigger.type = "radio";
    trigger.id = "trigger" + (index + 1);
    trigger.name = "slider";
    if (index === currentIndex) {
      trigger.checked = true;
    }
  
    // Добавляем обработчик события change
    trigger.addEventListener("change", function () {
      var previousSlide = slides[currentIndex];
      previousSlide.classList.remove("active");
      currentIndex = index;
      showSlide(currentIndex, null);
      startSlideShow();
    });
  
    var label = document.createElement("label");
    label.setAttribute("for", trigger.id);
  
    triggersContainer.appendChild(trigger);
    triggersContainer.appendChild(label);
  }
  
  function createTriggers() {
    removeAllTriggers();
    for (var i = 0; i < slides.length; i++) {
      createTrigger(i);
    }
  }
  
  function showSlide(index, direction) {
    var currentSlide = slides[currentIndex];
    var nextSlide = slides[index];
  
    currentSlide.classList.remove("active", "next", "previous");
    nextSlide.classList.add("active");
  
    // Добавляем класс для направления анимации
    if (direction === "next") {
      nextSlide.classList.add("next");
    } else if (direction === "previous") {
      nextSlide.classList.add("previous");
    }
  
    currentIndex = index;
  
    // Добавляем класс "active" к соответствующему label
    var triggerLabels = triggersContainer.querySelectorAll("label");
    triggerLabels.forEach(function (label, labelIndex) {
      if (labelIndex === index) {
        label.classList.add("active");
      } else {
        label.classList.remove("active");
      }
    });
  
    // Проверяем границы слайдов и скрываем/отображаем кнопки "Prev" и "Next"
    if (currentIndex === 0) {
      prevButton.disabled = true;
      nextButton.disabled = false;
    } else if (currentIndex === slides.length - 1) {
      prevButton.disabled = false;
      nextButton.disabled = true;
    } else {
      prevButton.disabled = false;
      nextButton.disabled = false;
    }
  }
  
  createTriggers();
  
  // Добавляем обработчик для события touchstart
  triggersContainer.addEventListener("touchstart", function (event) {
    startX = event.touches[0].clientX;
  });
  
  // Добавляем обработчик для события touchend
  triggersContainer.addEventListener("touchend", function (event) {
    var endX = event.changedTouches[0].clientX;
    var deltaX = endX - startX;
  
    if (deltaX > threshold) {
      // Переключаемся на предыдущий слайд
      previousSlide();
      startSlideShow();
    } else if (deltaX < -threshold) {
      // Переключаемся на следующий слайд
      nextSlide();
      startSlideShow();
    }
  });
  
  triggersContainer.addEventListener("mouseenter", function () {
    stopSlideShow();
  });
  
  triggersContainer.addEventListener("mouseleave", function () {
    startSlideShow();
  });
  
  // Остальная часть JavaScript кода остается неизменной
  
  function startSlideShow() {
    stopSlideShow();
    slideInterval = setInterval(nextSlide, 5000); // Интервал автоматического переключения слайдов (5 секунды)
  }
  
  function stopSlideShow() {
    clearInterval(slideInterval);
  }
  
  function nextSlide() {
    var nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex, "next");
  }
  
  function previousSlide() {
    var previousIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(previousIndex, "previous");
  }
  
  document.addEventListener("DOMContentLoaded", function () {
    showSlide(currentIndex);
    startSlideShow();
  });
  
  // Добавляем обработчик для кнопки "Prev"
  prevButton.addEventListener("click", function () {
    if (currentIndex !== 0) {
      previousSlide();
      startSlideShow();
    }
  });
  
  // Добавляем обработчик для кнопки "Next"
  nextButton.addEventListener("click", function () {
    if (currentIndex !== slides.length - 1) {
      nextSlide();
      startSlideShow();
    }
  });
}