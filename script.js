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
  let buttonScrollPosition = 0; // Текущая позиция скролла кнопок

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
    buttonScrollPosition = scrollPosition; // Обновляем позицию скролла кнопок
  });

  // Обработчик события для кнопки "Вправо"
  nextButtonContainer.addEventListener('click', () => {
    scrollPosition += boxWidth;
    scrollPosition = Math.min(scrollPosition, boxContainer.scrollWidth - containerWidth);
    boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
    buttonScrollPosition = scrollPosition; // Обновляем позицию скролла кнопок
  });

  let isMouseDown = false;
  let startX = 0;
  let scrollLeft = 0;

  // Обработчик события mousedown для контейнера boxContainer
  boxContainer.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Предотвращаем действия по умолчанию
    isMouseDown = true;
    startX = e.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  // Обработчик события mousemove для контейнера boxContainer
  boxContainer.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return; // Если кнопка мыши не зажата, прекращаем выполнение функции
    e.preventDefault(); // Предотвращаем действия по умолчанию
    const x = e.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 0.6; // Чувствительность перемещения
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft; // Обновляем позицию скролла кнопок
  });

  // Обработчик события mouseup для контейнера boxContainer
  boxContainer.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  // Обработчик события mouseleave для контейнера boxContainer
  boxContainer.addEventListener('mouseleave', () => {
    isMouseDown = false;
  });

  // Обработчик события touchstart для контейнера boxContainer
  boxContainer.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Предотвращаем действия по умолчанию
    const touch = e.touches[0];
    isMouseDown = true;
    startX = touch.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  // Обработчик события touchmove для контейнера boxContainer
  boxContainer.addEventListener('touchmove', (e) => {
    if (!isMouseDown) return; // Если сенсорное устройство не касается экрана, прекращаем выполнение функции
    e.preventDefault(); // Предотвращаем действия по умолчанию
    const touch = e.touches[0];
    const x = touch.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 0.6; // Чувствительность перемещения
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft; // Обновляем позицию скролла кнопок
  });

  // Обработчик события touchend для контейнера boxContainer
  boxContainer.addEventListener('touchend', () => {
    isMouseDown = false;
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
    } else if (a.querySelector('li a.category-box').id === 'last') {
      return 1; // a имеет id="last", поэтому он должен быть последним
    } else if (b.querySelector('li a.category-box').id === 'last') {
      return -1; // b имеет id="last", поэтому он должен быть последним
    } else {
      return Math.random() - 0.5; // Оба элемента либо активны, либо неактивны - сортировка рандомна
    }
  });

  while (categorySelector.firstChild) {
    categorySelector.removeChild(categorySelector.firstChild);
  }

  ulArray.forEach(function (ul) {
    categorySelector.appendChild(ul);
  });

  // Устанавливаем начальную позицию скролла кнопок
  buttonsContainer.scrollLeft = buttonScrollPosition;
}

if ((window.location.pathname.startsWith("/ru/") || window.location.pathname === "/ru") && !window.location.pathname.includes("/reviews/")) {
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
        "Steam Sites": "Сайты Steam",
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
        "Instant Sell": "Моментальная Продажа",
        "Buy Items": "Купить Предметы",
        "Sell Items": "Продать Предметы",
        "Trade Items": "Обменять Предметы",
        "Buy Skins": "Купить Скины",
        "Sell Skins": "Продать Скины",
        "Trade Skins": "Обменять Скины",
        "Steam Level Up": "Увеличить Уровень Steam",
        "Buy Steam Games": "Купить Игры Steam"
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

if (window.location.pathname.includes('/ru/reviews/')) {
  var links = document.getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    var link = links[i];

    if (link.href.includes('csgobroker.cc') && !link.pathname.startsWith('/ru') && !link.classList.contains('lang-switch')) {
      if (link.pathname !== '/') {
        link.pathname = '/ru' + link.pathname;
      } else {
        link.href = link.href.replace('https://csgobroker.cc/', 'https://csgobroker.cc/ru/');
      }
    }
  }
  function translateTextElements(parentElement) {
    var translations = {
      "Deposit Methods": "Способы Пополнения",
      "Withdraw Methods": "Способы Вывода",
      "Sign Up Bonus": "Бонус за Регистрацию",
      "No Bonus": "Нет Бонуса",
      "Pros": "Плюсы",
      "Price": "Цены",
      "Cons": "Минусы",
      "Trust": "Доверие",
      "Support": "Поддержка",
      "Payments": "Деп/Вывод",
      "Functional": "Функционал",
      "Sign up via Steam": "Залогиньтесь через Steam ",
      "Enjoy !": "Наслаждайтесь !",
      "Visit WebSite": "Посетить Сайт"
    };
  
    var siteprosElements = parentElement.querySelectorAll('.sitedetails .sitepros span');
    for (var i = 0; i < siteprosElements.length; i++) {
      var text = siteprosElements[i].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        siteprosElements[i].innerHTML = translations[text] + ' <i class="bi bi-caret-down-fill"></i>';
      }
    }
  
    var ratingwayElements = parentElement.querySelectorAll('.ratingthings .ratingway span, .content button, .boxreview .plusminus .criteria .par h2, .features .featuresbox .typesinside a, .instruction li');
    for (var j = 0; j < ratingwayElements.length; j++) {
      var text = ratingwayElements[j].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        ratingwayElements[j].innerHTML = translations[text];
      }
    }
  }
  
  translateTextElements(document.body);
  
}

if ((window.location.pathname.startsWith("/ru/") || window.location.pathname === "/ru") && !window.location.pathname.includes("/reviews/")) {
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
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.": "DMarket - это надежный и популярный онлайн-маркетплейс для предметов Steam, с большим количеством товаров и положительными отзывами.",
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike: Global Offensive, Dota 2, and Team Fortress 2. Launched in 2015.": "BitSkins - это онлайн-маркетплейс для игровых скинов, особенно для игр Counter-Strike: Global Offensive, Dota 2 и TF 2. Он был запущен в 2015 году.",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": "Безопасная пиринговая площадка, принадлежащая Hellcase. Защита SSL, KYC-проверка, удобный дизайн, достойные цены, доверенный сайт.",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS:GO skins. Established in 2015.": "CSGO Market - это онлайн-рынок P2P, который обеспечивает безопасную и защищенную платформу для покупки и продажи скинов в CS:GO.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS:GO, Rust and Dota 2 skins and items. The platform was founded in 2020.": "Lis-Skins - это популярная торговая площадка для предметов Steam, особенно для скинов и предметов в играх CS:GO, Rust и Dota 2.",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS:GO, Dota 2, Rust, and Team Fortress 2. Working since 2016.": "CS.Deals - это платформа, которая позволяет пользователям покупать, продавать и обменивать скины из CS:GO, Dota 2, Rust и Team Fortress 2.",
      "LOOT.Farm is an online platform that offers users the ability to Trade virtual items from popular games like CS:GO, Dota 2, Team Fortress 2, and Rust.": "LOOT.Farm - это онлайн-платформа, которая предоставляет услуги Обмена и Покупки предметов из CS:GO, Dota 2, Team Fortress 2 и Rust.",
      "SkinCashier is an online platform that allows players to Instant Sell their CS:GO, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier - это сайт, который позволяет игрокам моментально продавать свои скины из CS:GO, Rust, Dota 2 и TF2 за настоящие деньги.",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS:GO, Dota 2, RUST, and TF2.": "Avan.Market - это онлайн-платформа, которая предоставляет возможность моментально продавать игровые скины из CS:GO, Dota 2, RUST и TF2.",
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash - надежная платформа с положительными отзывами, надежной поддержкой клиентов и более чем шестилетним опытом работы.",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "Этот сайт был создан для упрощения процесса повышения уровня в Steam. Вы можете продавать предметы Steam за карточки, чтобы повысить уровень.",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "SteamLevelU - это честный сайт, где можно купить наборы карточек Steam для повышения уровней аккаунта в Steam. Она связана с SH Level Up.",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "Удобный сайт, который помогает повысить уровень вашей учетной записи Steam путем покупки наборов карточек, принимаются скины CS:GO.",
      "SkinBid is an online marketplace for CS:GO skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": "Торговая Площадка для скинов и предметов CS:GO, предлагающая возможность покупки, продажи и аукциона с удобным интерфейсом.",
      "WhiteMarket is a P2P platform for CS:GO skin trading. It offers secure trades, various deposit options, and community engagement.": "WhiteMarket - это P2P платформа для торговли скинами CS:GO. Безопасные сделки, различные варианты депозита и взаимодействие с сообществом.",
      "Trusted CS:GO skin platform with rentals, endorsed by YouTubers. Secure, limited to CS:GO skins, fees apply, and user reviews indicate room for improve.": "Надежная платформа для скинов CS:GO с возможностью аренды, рекомендованная Ютуберами. Безопасная, с доступной комиссией.",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS:GO and Rust. Owned and operated by RustySell.": "SkinSwap - онлайн-платформа, которая позволяет игрокам обменивать и продавать скины из популярных игр CS:GO и Rust.",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS:GO. Working since 2017.": "Tradeit - это онлайн-маркетплейс, который предлагает игрокам возможность торговать, покупать и продавать скины для различных игр.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.": "CSGOSelly - это сайт, который позволяет быстро продать свои скины CS:GO за деньги через различные способы вывода. Основан в 2021 году.",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.": "BC.Game - это онлайн-казино и букмекерская контора, запущенные в 2017 году. Они предлагают более 8000 игр с прозрачной системой.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet - это онлайн-казино, которое позволяет пользователям играть в игры с использованием криптовалюты. Платформа с чистой репутацией.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.": "HypeUp принадлежит тем же операторам, что и два популярных сайта для ставок - CSGORoll и HypeDrop. Сайт предлагает Слоты.",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games.": "HowlGG - это платформа для азартных игр с использованием скинов из игры Rust. Можно найти джекпот, Монетку, Слоты и Игры с живыми дилерами.",
      "Withdraw CS:GO Skins, Crypto or Real Money!": "Выводите скины CS:GO, криптовалюту или деньги!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "Выводите предметы CS:GO, Dota 2, TF2 или Rust!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "Выводите скины CS:GO, криптовалюту или Игры!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "Выводите скины CS:GO, Криптовалюту или PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "Выводите Деньги, Скины CS:GO, TF2 или Rust!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "Выводите предметы CS:GO, Dota 2 и H1Z1!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "Выводите предметы CS:GO, Dota 2 и Rust!",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "Выводите Bitcoin, Ethereum или Litecoin!",
      "Withdraw CS:GO And Rust Skins or Crypto!": "Выводите скины CS:GO, Rust или Крипту!",
      "Withdraw CS:GO Skins or real Money!": "Выводите скины CS:GO или деньги на Карту!",
      "Withdraw Steam Trading cards or Games.": "Выводите Steam Trading cards или Игры.",
      "Withdraw USDT, Skins or Real Money!": "Выводите USDT, Скины или Реальные Деньги",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "Выводите BTC, LTC, USDT, USDC или ETH!",
      "Withdraw Money, CS:GO or Rust Skins!": "Выводите Деньги, скины CS:GO или Rust!",
      "Withdraw Money, Crypto or Skins!": "Выводите Деньги, Криптовалюту или Скины!",
      "Withdraw CS:GO Skins or Crypto!": "Выводите скины CS:GO или криптовалюту!",
      "Withdraw Money, Crypto or PayPal!": "Выводите Деньги, Крипту или PayPal!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "Вывод только скинами CS:GO через P2P!",
      "Withdraw Rust Skins or Crypto!": "Выводите скины Rust или криптовалюту!",
      "Withdraw Real Money or Crypto!": "Выводите Реальные Деньги или Крипту!",
      "Withdraw BTC, ETH, USDT or Tron!": "Выводите BTC, ETH, USDT или Tron!",
      "Withdraw CS:GO Skins or PayPal!": "Выводите скины CS:GO или PayPal!",
      "Withdraw CS:GO Skins and Items!": "Вывод только скинами CS:GO!",
      "Withdraw Steam Trading cards.": "Выводите Steam Trading cards.",
      "Visit WebSite": "Посетить Сайт",
      "Visit WebSite or Copy": "Посетить Сайт",
      "100% deposit bonus": "+100% к Пополнению",
      "+3% Sell Bonus": "+3% Бонус к Продаже",
      "5% deposit bonus": "+5% к Пополнению",
      "5 Free Cases": "5 Бесплатных Кейсов",
      "Free 50 Gems": "50 Камней Бесплатно",
      "3 Free Cases": "3 Бесплатных Кейса",
      "1.5$ for free": "1.5$ Бесплатно",
      "Free 0.90$": "0.90$ Бесплатно",
      "Free 0.50$": "0.50$ Бесплатно",
      "Free 0.40$": "0.40$ Бесплатно",
      "Free 0.30$": "0.30$ Бесплатно",
      "Free 0.25$": "0.25$ Бесплатно",
      "Free 0.05$": "0.05$ Бесплатно",
      "Free Case": "Бесплатный Кейс",
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
      } else if (text.indexOf('Code:') === 0) {
        elements[j].innerHTML = 'Код:' + text.substring(5);
      }
    }
  }

  var SitesList = document.querySelector('.boxes-holder');
  translateURLs(SitesList);
}

if ((window.location.pathname.startsWith("/pt/") || window.location.pathname === "/pt" || window.location.pathname === "/pt.html") && !window.location.pathname.includes("/reviews/")) {
  function translateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href*="https://csgobroker.cc/"]');

    for (var i = 0; i < links.length; i++) {
  
      var translations = {
        "CS:GO Sites List": "Sites de CS:GO",
        "Rust Sites List": "Sites de Rust",
        "Dota 2 Sites List": "Sites de Dota 2",
        "Crypto Sites List": "Sites de Crypto",
        "Freebies Only": "Apenas Brindes",
        "Earning Sites": "Sites para Ganhar",
        "Steam Sites": "Sites do Steam",
        "Gambling Sites": "Sites de Jogos de Azar",
        "Earn by Play CS:GO": "Ganhe Jogando CS:GO",
        "All Sites": "Todos os Sites",
        "Match Betting": "Apostas em Jogos",
        "Case Opening": "Abertura de Caixas",
        "Roulette": "Roleta",
        "Coinflip": "Cara ou Coroa",
        "Crash": "Crash",
        "Casino": "Cassino",
        "Jackpot": "Jackpot",
        "Upgrader": "Upgrader",
        "Dice": "Dados",
        "Bonus Types": "Tipos de Bônus",
        "Sign Up Bonuses": "Bônus de Cadastro",
        "Deposit Bonuses": "Bônus de Depósito",
        "Daily Rewards": "Recompensas Diárias",
        "Giveaways": "Doações",
        "Offerwall Sites": "Sites de Ofertas",
        "Earn by Play Sites": "Sites para Ganhar Jogando",
        "Buy or Sell Skins": "Comprar ou Vender Skins",
        "Buy or Sell Items": "Comprar ou Vender Itens",
        "Marketplaces": "Mercados",
        "Instant Sell": "Venda Imediata",
        "Buy Items": "Comprar Itens",
        "Sell Items": "Vender Itens",
        "Trade Items": "Trocar Itens",
        "Buy Skins": "Comprar Skins",
        "Sell Skins": "Vender Skins",
        "Trade Skins": "Trocar Skins",
        "Steam Level Up": "Subir de Nível no Steam",
        "Buy Steam Games": "Comprar Jogos do Steam"
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


if ((window.location.pathname.startsWith("/pt/") || window.location.pathname === "/pt" || window.location.pathname === "/pt.html") && !window.location.pathname.includes("/reviews/")) {

  function translateURLs(parentElement) {
    var translations = {
      "CSGO500 probably the best CS:GO Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, provavelmente o melhor site de apostas de CS:GO. Chuvas regulares, brindes e códigos promocionais. Você pode jogar muitos jogos e caça-níqueis.",
      "CSGO500 probably the best CS:GO and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, provavelmente o melhor site de apostas de CS:GO. Chuvas regulares, brindes e códigos promocionais. Você pode jogar muitos jogos e caça-níqueis.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll é um dos sites mais populares. Inclui roleta, crash e muitos outros. Agora testando apostas em e-sports.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire é um dos sites mais populares. Inclui roleta e coinflip. Trabalhando desde 2016. Aposta em partidas com prioridade.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon é um site lendário como o CSGODouble, com roleta clássica, mas tem dados, crash, caça-níqueis e até apostas em e-sports!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino oferece uma variedade de jogos internos, envolvimento social inovador, sistema comprovadamente justo e boa reputação nos jogos online.",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "Famoso site de apostas em e-sports com um sistema interessante de cashback, você pode apostar skins ou dinheiro. Possui várias opções de pagamento.",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit é um novo site de cassino que inclui apostas esportivas e muitos jogos clássicos como roleta. Inclui bônus diários!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "É um site de apostas de skins de CSGO licenciado que aceita vários métodos de depósito, oferecendo diversos jogos e um design amigável para o usuário.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Um cassino online seguro e licenciado com jogos, apostas esportivas, apostas em e-sports e transações de criptomoedas instantâneas.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "Uma plataforma online que oferece jogos de apostas de skins de CSGO com animações profissionalmente projetadas e suaves.",
      "Rustix - gambling platform for CS:GO and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - plataforma de apostas para CS:GO e Rust com jogos originais, jogabilidade justa, bônus e animações impressionantes. Aberto em 2023.",
      "CSGO-Skins is a reputable online platform where users can open custom CS:GO cases and participate in daily Giveaways.": "CSGO-Skins é uma plataforma online confiável onde os usuários podem abrir caixas personalizadas de CS:GO e participar de brindes diários.",
      "FlameCases is an online platform that permits users to open cases for CS:GO and Dota 2. Since its launch in 2017, the website provides various features.": "Uma plataforma online que permite aos usuários abrir caixas para CS:GO e Dota 2 desde 2017, oferecendo várias funcionalidades..",
      "KNIFEX is a CS:GO gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "Um site de apostas de CS:GO com uma variedade de modos de jogo, incluindo abertura de caixas, batalhas de caixas, coinflip, crash, clash e muito mais!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS:GO. Its most prominent feature is the case-opening battles.": "DatDrop é um site que se especializa em abrir caixas que contêm skins do CS:GO. Sua característica mais proeminente são as batalhas de abertura de caixas.",      
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins é um site de abertura de caixas do CSGO que está em operação desde 2017 e oferece Aberturas de Caixas, Batalhas de Caixas e Upgrader.",  
      "Clash.gg is a new CS:GO Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg é um novo site de apostas de CS:GO que oferece uma ampla variedade de jogos emocionantes, como Roleta, Upgrader, Caixas e muito mais!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore é uma plataforma que permite aos usuários participarem de apostas de skins do CSGO através de modos de jogo como Coinflip, Jackpot e Roleta.",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS:GO, Dota 2, and Rust.": "Hellcase é uma plataforma que permite aos usuários comprar caixas virtuais preenchidas com skins e itens para vários jogos como CS:GO, Dota 2 e Rust.",
      "CSGOBIG - a gambling site for CS:GO skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG - um site de apostas de skins do CS:GO com modos de jogo como Jackpot, Coinflip, Roleta, Caixas e Batalhas de Caixas. Aberto em 2015.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast é um site de apostas de skins do CSGO que oferece uma ampla variedade de modos de jogo exclusivos. Um dos primeiros sites do CSGO.",
      "CSGOLive is a safe and legitimate CS:GO case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive é um site seguro e legítimo de abertura de caixas do CS:GO com caixas personalizadas, bônus diários e um sistema Provably Fair.",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins é uma plataforma online confiável e popular que oferece jogos únicos, recompensas diárias e um processo de registro simples.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop é uma plataforma de apostas online renomada que oferece Batalhas de Caixas, Upgrader e caixas de skins personalizadas do CSGO.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins é um conhecido site de abertura de caixas do CSGO, operando desde 2016, com ampla seleção de skins para os jogadores.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS:GO , Dota 2, Valorant and many more.": "Bets4.pro é uma plataforma online para apostas em esportes eletrônicos, incluindo CS:GO, Dota 2, Valorant e mais.",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!" : "Este site pode ser considerado quase lendário entre os colegas devido aos seus pagamentos elevados e promoções constantes. Inclui bônus diário!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games." : "HowlGG é uma plataforma de jogos de apostas de skins do Rust que oferece uma variedade de jogos, incluindo jackpot, coinflip, slots e jogos de cassino.",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip." : "BanditCamp é um site de apostas de skins do Rust que oferece vários modos de jogo temáticos do Rust, como roda da fortuna, abertura de caixas e coinflip.",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016." : "GCSkins é um aplicativo móvel e um site bem conhecidos que oferecem skins e itens de CSGO como recompensa por completar tarefas online.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or play mobile and desktop games." : "GrindBux é uma plataforma confiável onde você pode ganhar dinheiro completando pesquisas ou jogando jogos para dispositivos móveis e desktop.",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games." : "Site de apostas de skins do Rust em operação desde 2017. Oferece variedade de jogos populares, incluindo jackpot e coinflip.",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly." : "RustBet - Site confiável de apostas com skins do Rust. Jogos de jackpot, coinflip e aprimoramento. Reputação sólida, criptografia SSL, interface amigável.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot and coinflip. Easily enter and withdraw items from games." : "RustStake é uma plataforma de jogos de apostas de skins do Rust que oferece uma variedade de jogos, incluindo jackpot e coinflip. Entre e retire itens dos jogos com facilidade.",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods." : "Na verdade, o precursor de sites para ganhar dinheiro através do Steam, destaca-se pela enorme seleção de métodos de saque.",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable." : "RustyLoot oferece vários jogos, incluindo Roleta, Plinko e mais. Seguro e divertido, com sistema transparente e justo.",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.":"O RustChance está em operação desde 2017 e oferece vários jogos populares, incluindo Jackpot, Roleta, Cara ou Coroa, Queda e Campo Minado.",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.":"O CrashGG é especializado em apostas de skins do Rust, com vários jogos, incluindo o modo crash. Também tem Duelos, Blackjack e Loteria.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.":"O HypeUp é de propriedade dos operadores de CSGORoll e HypeDrop, oferece dois jogos originais e Slots com Jogos Ao Vivo.",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.":"O site possui um número razoável de provedores de pesquisas e parceiros de oferta para escolher, e há muitas opções para sacar os ganhos.",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS:GO and Rust. Owned and operated by RustySell.":"O SkinSwap é uma plataforma online para negociar e vender skins de jogos populares como CS:GO e Rust, pertencente à RustySell.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.":"CSGOSelly é um site que permite aos usuários converter suas skins de CSGO em dinheiro através de vários métodos de pagamento. Foi fundado em 2021.",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Um site único onde você pode ganhar dinheiro ganhando jogos em várias disciplinas cibernéticas de jogos móveis. Também possui muitos offerwalls.",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.":"RustMoment é um site de apostas para entusiastas de skins do Rust com seis jogos, bônus e pagamentos em moeda padrão e criptomoeda.",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos.": "Freeward é um site que oferece oportunidades para os usuários ganharem recompensas por meio de tarefas como pesquisas e vídeos.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet é um cassino online que permite aos usuários jogar jogos usando criptomoeda. A plataforma tem uma reputação de ser legítima e segura.",
      "xplay is a platform that allows CS:GO players to earn skins just by playing on their servers. The platform offers various servers and daily challenges.": "xplay é uma plataforma que permite aos jogadores de CS:GO ganhar skins jogando em seus servidores. Oferece vários servidores e desafios diários.",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations.": "Estabelecido em 2018, oferece jogos de jackpot, coinflip e roleta com recursos aprimorados, justiça comprovável e animações atrativas.",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers.": "GameTame é um site que oferece recompensas por completar atividades e ofertas. É projetado especialmente para jogadores.",
      "Salad is a website that offers users the opportunity to mine wallet and buy giftcards and many more using their computer's processing power.": "Salad é um site que permite aos usuários minerar carteiras, comprar cartões-presente e muito mais usando o poder de processamento do computador.",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings.": "Site dos proprietários do Gamehag. Oferece provedores de pesquisas, parceiros de oferta e opções de saque dos ganhos.",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources.": "SteamGifts é um site legítimo para sorteios de jogos do Steam, com uma comunidade solidária e recursos úteis.",
      "GrindBux is a trusted platform when you can earn some money by completing surveys or play mobile and desktop games.": "GrindBux é uma plataforma confiável onde você pode ganhar dinheiro ao completar pesquisas ou jogar jogos móveis e de desktop.",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. By RustChance owners.": "RustCases é um site confiável de apostas em Rust com diversos modos de jogo, uma ampla seleção de cases e opções de retirada de skins.",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more !":"RustClash é um novo site de apostas de Rust que inclui muitos jogos como Roleta, Upgrader, Cases e muitos outros!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.":"BC.Game é um cassino online e casa de apostas lançado em 2017, com mais de 8.000 jogos, incluindo jogos proprietários e provavelmente justos.",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.":"Primedice é um cassino de dados criptografados online em operação desde 2013, pioneiro no uso de criptomoedas em jogos de azar.",
      "Withdraw BTC, LTC, ETH and many else!":"Retire BTC, LTC, ETH e muito mais!",
      "Withdrawal of many types of cryptocurrencies !":"Retirada de vários tipos de criptomoedas!",
      "Withdraw CS:GO Skins, Crypto or Real Money!": "Retirar Skins do CS:GO, Criptomoedas ou Dinheiro!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "Retirar Itens do CS:GO, Dota 2, TF2 ou Rust!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "Retirar Skins do CS:GO, Criptomoedas ou Jogos!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "Retirar Skins do CS:GO, Criptomoedas ou PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "Retirar Dinheiro, Skins do CS:GO, TF2 ou Rust!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "Retirar Skins do CS:GO, Dota 2 e Itens do H1Z1!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "Retirar Skins do CS:GO, Rust e Itens do Dota 2!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Saque Skins do Rust, Criptomoedas ou PayPal!",
      "Withdraw Rust Skins or Crypto!": "Retire Skins do Rust ou Criptomoedas!",
      "Withdraw Rust Skins and Items!": "Retire Skins e Itens do Rust!",
      "Withdraw with many-many ways.": "Retirar de várias-muitas maneiras.",
      "Withdraw Crypto, gift cards or real money!": "Retire Crypto, cartões presente ou dinheiro!",
      "Withdraw CS:GO Skins, Gift Cards or Crypto!": "Retire Skins, Cartões Presente ou Criptomoedas!",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "Retire Bitcoin, Ethereum ou Litecoin!",
      "Withdraw Games, GiftCards and many more!": "Retire Jogos, Cartões Presente e muito mais!",
      "Withdraw Crypto or Real Money!": "Retire Criptomoedas ou Dinheiro Real!",
      "Withdraw Crypto and Gift Cards!": "Levantar Criptomoedas e Cartões de Presente!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "Levantar BTC, LTC, USDT, USDC ou ETH!",
      "Withdraw CS:GO Skins or Items!": "Levantar Skins ou Itens de CS:GO!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": "Levantar Jogos ou Itens de Dota2 e TF2!",
      "Withdraw Games, GiftCards or Donate to Charity!": "Levantar Jogos, Cartões de Presente!",
      "Participate in Giveaways and win Steam Games.": "Participar em Sorteios e ganhar Jogos da Steam.",
      "Withdraw CS:GO And Rust Skins or Crypto!": "Retirar Skins do CS:GO e Rust ou Criptomoedas!",
      "Withdraw CS:GO Skins or real Money!": "Retirar Skins do CS:GO ou Dinheiro Real!",
      "Withdraw Steam Trading cards or Games.": "Retirar Cartas de Negociação do Steam ou Jogos.",
      "Withdraw USDT, Skins or Real Money!": "Retirar USDT, Skins ou Dinheiro Real!",
      "Withdraw Money, CS:GO or Rust Skins!": "Retirar Dinheiro, Skins do CS:GO ou Rust!",
      "Withdraw Money, Crypto or Skins!": "Retirar Dinheiro, Criptomoedas ou Skins!",
      "Withdraw CS:GO Skins or Crypto!": "Retirar Skins do CS:GO ou Criptomoedas!",
      "Withdraw Money, Crypto or PayPal!": "Retirar Dinheiro, Criptomoedas ou PayPal!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "Retirar com Skins do CS:GO P2P.",
      "Withdraw Real Money or Crypto!": "Retirar Dinheiro Real ou Criptomoedas!",
      "Withdraw BTC, ETH, USDT or Tron!": "Retirar BTC, ETH, USDT ou Tron!",
      "Withdraw CS:GO Skins or PayPal!": "Retirar Skins do CS:GO ou PayPal!",
      "Withdraw CS:GO Skins and Items!": "Retirar Skins e Itens do CS:GO!",
      "Withdraw Steam Trading cards.": "Retirar Cartas de Negociação do Steam.",
      "360% Deposit Bonus":"360% Bónus de Depósito",
      "Deposit Bonus":"Bónus de Depósito",
      "Visit WebSite": "Visite o Site",
      "Visit WebSite or Copy": "Visite o Site ou Copie",
      "100% deposit bonus": "Bônus de depósito de 100%",
      "+3% Sell Bonus": "Bônus de venda de +3%",
      "5% deposit bonus": "Bônus de depósito de 5%",
      "5 Free Cases": "5 Caixas Grátis",
      "Free 50 Gems": "50 Gemas Grátis",
      "3 Free Cases": "3 Caixas Grátis",
      "1.5$ for free": "1,5$ grátis",
      "Free 1.00$": "1,00$ grátis",
      "Free 0.90$": "0,90$ grátis",
      "Free 0.50$": "0,50$ grátis",
      "Free 0.40$": "0,40$ grátis",
      "Free 0.30$": "0,30$ grátis",
      "Free 0.25$": "0,25$ grátis",
      "Free 0.20$": "0,20$ grátis",
      "Free 0.15$": "0,15$ grátis",
      "Free 0.10$": "0,10$ grátis",
      "Free 0.05$": "0,05$ grátis",
      "Free Case": "Caixa Grátis",
      "Free 1$": "1$ grátis",
      "Free 2$": "2$ grátis",
      "Free 1$": "1$ grátis",
      "Big Daily Giveaways": "Grandes Sorteios Diários",
      "Free Case up to 250$": "Caixa Grátis até 250$",
      "Daily Giveaway": "Sorteio Diário",
      "Free 100 Diamonds": "100 Diamantes Grátis",
      "500 coins": "500 moedas",
      "Daily Cases": "Caixas Diárias",
      "3 Energy Points": "3 Pontos de Energia",
      "Free 200 Coins": "200 Moedas Grátis",
      "some free coins": "algumas moedas grátis",      
      "Free 2$": "2$ Grátis",
      "Free spins": "Rodadas Grátis",
      "Offerwall": "Parede de Ofertas",
      "x2 Mining Rate": "Taxa de Mineração x2",
      "Games Giveaways": "Distribuição de Jogos"
    };

    var elements = parentElement.querySelectorAll(".box .content p, .box .logobg .best, .box .content button");
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        elements[j].innerHTML = translations[text];
      }
    }
  }

  // Загружаем содержимое из файла при загрузке страницы
  window.onload = importDivContent;
}

if ((window.location.pathname.startsWith("/hi/") || window.location.pathname === "/hi" || window.location.pathname === "/hi.html") && !window.location.pathname.includes("/reviews/")) {
  function translateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href*="https://csgobroker.cc/"]');

    for (var i = 0; i < links.length; i++) {
  
      var translations = {
        "CS:GO Sites List": "CS:GO साइटों की सूची",
        "Rust Sites List": "Rust साइटों की सूची",
        "Dota 2 Sites List": "डोटा 2 साइटों की सूची",
        "Crypto Sites List": "क्रिप्टो साइटों की सूची",
        "Freebies Only": "केवल मुफ्त आइटम",
        "Earning Sites": "आमदनी वाली साइटें",
        "Steam Sites": "स्टीम से संबंधित साइटें",
        "Gambling Sites": "जुआ खेलने के लिए साइटें",
        "Earn by Play CS:GO": "CS:GO खेलकर कमाएं",
        "All Sites": "सभी साइटें",
        "Match Betting": "मैच पर शर्त लगाएं",
        "Case Opening": "केस खोलें",
        "Roulette": "रूलेट",
        "Coinflip": "कॉइनफ्लिप",
        "Crash": "क्रैश",
        "Casino": "कैसीनो",
        "Jackpot": "जैकपॉट",
        "Upgrader": "अपग्रेडर",
        "Dice": "पासा",
        "Bonus Types": "बोनस के प्रकार",
        "Sign Up Bonuses": "साइन अप के बोनस",
        "Deposit Bonuses": "जमा करने के बोनस",
        "Daily Rewards": "रोज़ाना की पुरस्कार",
        "Giveaways": "उपहार",
        "Offerwall Sites": "ऑफ़रवॉल से संबंधित साइटें",
        "Earn by Play Sites": "खेलकर कमाने वाली साइटें",
        "Buy or Sell Skins": "स्किन खरीदें या बेचें",
        "Buy or Sell Items": "आइटम खरीदें या बेचें",
        "Marketplaces": "मार्केटप्लेस",
        "Instant Sell": "तत्काल बेचें",
        "Buy Items": "आइटम खरीदें",
        "Sell Items": "आइटम बेचें",
        "Trade Items": "आइटम विनिमय करें",
        "Buy Skins": "स्किन खरीदें",
        "Sell Skins": "स्किन बेचें",
        "Trade Skins": "स्किन विनिमय करें",
        "Steam Level Up": "स्टीम स्तर बढ़ाएं",
        "Buy Steam Games": "स्टीम गेम्स खरीदें"
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


if ((window.location.pathname.startsWith("/hi/") || window.location.pathname === "/hi" || window.location.pathname === "/hi.html") && !window.location.pathname.includes("/reviews/")) {

  function translateURLs(parentElement) {
    var translations = {
      "CSGO500 probably the best CS:GO Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, संभवतः सर्वश्रेष्ठ CS:GO जुआ साइट है। नियमित वर्षवृष्टि, गिफ्टवे और प्रोमोकोड्स। आप कई खेल और स्लॉट्स खेल सकते हैं।",
      "CSGO500 probably the best CS:GO and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, संभवतः सर्वश्रेष्ठ CS:GO जुआ साइट है। नियमित वर्षवृष्टि, गिफ्टवे और प्रोमोकोड्स। आप कई खेल और स्लॉट्स खेल सकते हैं।",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll एक लोकप्रिय साइटों में से एक है। जिसमें रूलेट, क्रैश और और भी कई खेल शामिल हैं। अब ई-स्पोर्ट्स बेटिंग का परीक्षण हो रहा है।",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire एक प्रसिद्ध साइटों में से एक है। जिसमें रूलेट और कॉइनफ्लिप शामिल हैं। 2016 से कार्यरत है। प्राथमिकता में मैच बेटिंग है।",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon CSGODouble की तरह एक पुरानी साइट है जिसमें क्लासिक रूलेट है, लेकिन डाइस, क्रैश, स्लॉट्स और इसी साथ ई-स्पोर्ट्स बेटिंग भी है!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino अपने भीतरी खेलों, अभिनव सामाजिक एंगेजमेंट, प्रमाणित निष्पक्ष तंत्र और ऑनलाइन गेमिंग में अच्छी प्रतिष्ठा के साथ विविधता प्रदान करने वाली एक प्लेटफॉर्म है।",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE एक प्रसिद्ध ई-स्पोर्ट्स बेटिंग साइट है जिसमें दिलचस्प कैशबैक सिस्टम है, आप स्किन या पैसे पर बेट कर सकते ह",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit एक नया कैसीनो साइट है जिसमें स्पोर्ट्स बेटिंग और रूलेट जैसे क्लासिक खेल शामिल हैं। रोजाना बोनस भी मिलते हैं!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "CSGOLuck एक लाइसेंसधारक CSGO स्किन जुआ साइट है जो कई जमा विधियों को स्वीकार करती है, विभिन्न खेल और एक उपयोगकर्ता-मित्रीपूर्ण डिज़ाइन प्रदान करती है।",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits एक सुरक्षित और लाइसेंस प्राप्त ऑनलाइन कैसीनो है जिसमें विभिन्न खेल, स्पोर्ट्स बेटिंग, ई-स्पोर्ट्स बेटिंग और तत्काल क्रिप्टोकरेंसी सौदों की सुविधा है।",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG एक ऑनलाइन प्लेटफॉर्म है जो पेशेवर डिज़ाइन की गई और सुविधाजनक एनिमेशन के साथ CSGO स्किन जुआ खेलने की विभिन्न गेम्स प्रदान करती है।",
      "Rustix - gambling platform for CS:GO and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - CS:GO और Rust के लिए एक जुआ प्लेटफॉर्म है जिसमें मूलभूत खेल, निष्पक्ष गेमप्ले, बोनस और अद्भुत एनिमेशन शामिल हैं। 2023 में खुला है।",
      "CSGO-Skins is a reputable online platform where users can open custom CS:GO cases and participate in daily Giveaways.": "CSGO-Skins एक प्रमाणित ऑनलाइन प्लेटफॉर्म है जहां उपयोगकर्ता विशेष रूप से तैयार किए गए CS:GO केस खोल सकते हैं और दैनिक गिवअवे में भाग ले सकते हैं।",
      "FlameCases is an online platform that permits users to open cases for CS:GO and Dota 2. Since its launch in 2017, the website provides various features.": "एक ऑनलाइन प्लेटफॉर्म है जो उपयोगकर्ताओं को CS:GO और Dota 2 के लिए केस खोलने की अनुमति देता है। 2017 में शुरू किए जाने के बाद, वेबसाइट विभिन्न सुविधाएं प्रदान करता है।",
      "KNIFEX is a CS:GO gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX एक CS:GO जुआ साइट है जो केस खोलने, केस युद्ध, कॉइनफ्लिप, क्रैश, क्लैश और बहुत कुछ जैसे खेल मोड्स की विभिन्नता प्रदान करता है!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS:GO. Its most prominent feature is the case-opening battles.": "DatDrop एक वेबसाइट है जो CS:GO से स्किन्स शामिल करने वाले केस खोलने पर विशेषाधिकार रखती है। इसकी सबसे प्रमुख विशेषता केस खोलने की युद्ध है।",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins एक मान्य CSGO केस खोलने वेबसाइट है जो 2017 से संचालित हो रही है और इसमें केस खोलने, केस युद्ध और अपग्रेडर शामिल हैं।",
      "Clash.gg is a new CS:GO Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg एक नया CS:GO जुआ साइट है जिसमें रूलेट, अपग्रेडर, केस और बहुत कुछ जैसे बहुत सारे खेल शामिल हैं!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore एक प्लेटफॉर्म है जो मुद्रा और व्हील जैसे खेल मोड्स के माध्यम से CSGO स्किन बेटिंग में भाग लेने की सुविधा प्रदान करती है।",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS:GO, Dota 2, and Rust.": "Hellcase एक ऑनलाइन प्लेटफॉर्म है जो CS:GO, Dota 2 और Rust जैसे विभिन्न खेलों के लिए स्किन्स और आइटम्स से भरे हुए वर्चुअल केस खरीदने की अनुमति देती है।",
      "CSGOBIG - a gambling site for CS:GO skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG - CS:GO स्किन्स के साथ जैकपॉट, कॉइनफ्लिप, रूलेट, केस और केस युद्ध जैसे खेल मोड्स के साथ एक जुआ साइट। 2015 में शुरू हुआ है।",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast एक CSGO स्किन्स जुआ साइट है जो विभिन्न अनन्य खेल मोड्स प्रदान करती है। सबसे पहले CSGO जुआ साइटों में से एक।",
      "CSGOLive is a safe and legitimate CS:GO case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive एक सुरक्षित और वैध CS:GO केस खोलने वेबसाइट है जिसमें कस्टम केस, दैनिक बोनस और एक Provably Fair सिस्टम है।",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins एक विश्वसनीय और लोकप्रिय ऑनलाइन प्लेटफॉर्म है जो अद्वितीय खेल, दैनिक रिवॉर्ड और एक सरल पंजीकरण प्रक्रिया प्रदान करता है।",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop एक प्रमुख ऑनलाइन जुआ प्लेटफॉर्म है जो केस युद्ध और अपग्रेडर के अलावा कस्टम CSGO स्किन केस भी प्रदान करता है।",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins एक प्रसिद्ध CSGO केस खोलने वेबसाइट है जो दैनिक रिवॉर्ड, प्रोमो कोड और केस युद्ध जैसी विशेषताएं प्रदान करती है।",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS:GO , Dota 2, Valorant and many more.": "एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को इस्पोर्ट्स मैचों पर सट्टे लगाने की क्षमता प्रदान करती है, विशेष रूप से CS:GO, Dota 2, Valorant और बहुत सारे अन्य मैचों के लिए।",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!": "इस साइट को अपने समकक्षों के बीच लगभग अपूर्व कहा जा सकता है क्योंकि इसमें उच्च भुगतान और नियमित प्रचार की सुविधा होती है। रोजाना बोनस भी शामिल करें!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games.": "HowlGG एक Rust स्किन जुआ प्लेटफ़ॉर्म है जो जैकपॉट, कॉइनफ्लिप, स्लॉट्स और लाइव कैसीनो खेल समेत विभिन्न खेल प्रदान करता है।",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip.": "BanditCamp एक Rust स्किन जुआ वेबसाइट है जो व्हील ऑफ़ फ़ॉर्च्यून, केस अनबॉक्सिंग और कॉइनफ्लिप जैसे कई Rust थीम के खेल मोड प्रदान करती है।",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016.": "GCSkins एक प्रसिद्ध मोबाइल ऐप और वेबसाइट है जो ऑनलाइन कार्यों को पूरा करने के बदले में CSGO स्किन और आइटम प्रदान करती है। 2016 से उपलब्ध है।",
      "GrindBux is a trusted platform when you can earn some money by completing surveys or play mobile and desktop games.": "GrindBux एक विश्वसनीय प्लेटफ़ॉर्म है जहां आप सर्वेक्षण पूरा करके या मोबाइल और डेस्कटॉप खेलों का खेलकर कुछ पैसे कमा सकते हैं।",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games.": "2017 से चल रही एक Rust स्किन जुआ साइट। इस प्लेटफ़ॉर्म पर लोकप्रिय खेलों की एक विस्तृत विकल्प सुविधा है, जिसमें हाई-रोलर जैकपॉट और कॉइनफ्लिप खेल शामिल हैं।",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly.": "RustBet - विश्वसनीय जुआ साइट, पुरस्कार के रूप में Rust स्किन्स। जैकपॉट, कॉइनफ्लिप और स्किन अपग्रेडर खेल। साफ नाम, SSL एन्क्रिप्शन, उपयोगकर्ता के लिए सुविधाजनक।",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": "RustStake एक Rust स्किन जुआ प्लेटफ़ॉर्म है जो जैकपॉट और कॉइनफ्लिप समेत विभिन्न खेल प्रदान करता है। आसानी से खेलों से आइटम को दाखिल और निकाल सकते हैं।",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods.": "वास्तव में, स्टीम के माध्यम से कमाई के लिए साइटों का पितामह, इसके वापसी विधियों के विशाल चयन के लिए मशहूर है।",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable.": "RustyLoot व्हील, प्लिंको और अन्य खेल समेत विविधता प्रदान करता है। अपने पारदर्शी और सत्यापन योग्य सिस्टम के साथ, RustyLoot सुरक्षित और मजेदार है।",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.": "RustChance 2017 से संचालित हो रहा है और जैकपॉट, व्हील, कॉइनफ्लिप, क्रैश और लैंडमाइंस समेत कई लोकप्रिय खेल प्रदान करता है।",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.": "CrashGG Rust स्किन जुआ पर ध्यान केंद्रित होता है और इसमें इसकी प्रमुख विशेषता, क्रैश गेम मोड समेत विभिन्न खेल प्रदान करता है। यहां द्वंद्व, ब्लैकजैक और लॉटरी भी हैं।",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.": "HypeUp दो प्रसिद्ध बेटिंग साइटों, CSGORoll और HypeDrop के समान ऑपरेटर्स के द्वारा स्वामित्व में है। इसमें दो मूलभूत खेल और लाइव गेम के साथ स्लॉट्स प्रदान की जाती है।",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.": "वेबसाइट पर उचित संख्या में सर्वेक्षण प्रदाता और ऑफरवॉल साझेदार हैं जिन्हें चुना जा सकता है, और कमाई को निकासी के लिए कई विकल्प हैं।",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS:GO and Rust. Owned and operated by RustySell.": "एक ऑनलाइन प्लेटफ़ॉर्म है जो खिलाड़ियों को CS: GO और Rust जैसे प्रसिद्ध खेलों के स्किन को विनिमय और बेचने की अनुमति देता है। RustySell द्वारा स्वामित्व और संचालित होता है।",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.": "CSGOSelly एक वेबसाइट है जो उपयोगकर्ताओं को विभिन्न भुगतान विधियों के माध्यम से अपने CSGO स्किन को पैसे में बदलने की अनुमति देती है। इसे 2021 में स्थापित किया गया था।",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.": "एक अद्वितीय साइट जहां आप विभिन्न मोबाइल गेमिंग साइबर विषयों में खेल जीतकर पैसे कमा सकते हैं। इसके अलावा कई ऑफरवॉल्स भी हैं।",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.": "RustMoment एक रस्ट स्किन प्रशंसकों के लिए एक जुआ साइट है जिसमें छह खेल, बोनस और एक रेकबैक सिस्टम होता है। इसमें मानक और क्रिप्टोकरेंसी भुगतान स्वीकार किए जाते हैं।",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos." : "Freeward एक GPT साइट है जो सर्वेक्षण और वीडियो देखकर जैसे कार्यों के माध्यम से उपयोगकर्ताओं को पुरस्कार कमाने के विभिन्न अवसर प्रदान करती है।",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe." : "Roobet एक ऑनलाइन कैसीनो है जो उपयोगकर्ताओं को क्रिप्टोकरेंसी का उपयोग करके खेल खेलने की अनुमति देता है। प्लेटफ़ॉर्म का विश्वासयोग्य और सुरक्षित होने का प्रमाण है।",
      "xplay is a platform that allows CS:GO players to earn skins just by playing on their servers. The platform offers various servers and daily challenges." : "xplay एक प्लेटफ़ॉर्म है जो CS:GO खिलाड़ियों को उनके सर्वर पर खेलकर स्किन कमाने की सुविधा प्रदान करता है। प्लेटफ़ॉर्म में विभिन्न सर्वर और दैनिक चुनौतियाँ होती हैं।",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations." : "2018 में स्थापित किया गया, यह जैकपॉट, कॉइनफ्लिप और रूलेट खेल प्रदान करता है जिनमें उन्नत सुविधाएं, साबित करने योग्य न्यायता और आकर्षक एनिमेशन होते हैं।",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers." : "GameTame एक GPT साइट है जो विभिन्न गतिविधियों और प्रस्तावों के पूरा करने के लिए पुरस्कार प्रदान करती है। प्लेटफ़ॉर्म विशेष रूप से गेमर्स के लिए डिज़ाइन किया गया है।",
      "Salad is a website that offers users the opportunity to mine wallet and buy giftcards and many more using their computer's processing power." : "Salad एक वेबसाइट है जो उपयोगकर्ताओं को अपने कंप्यूटर की प्रोसेसिंग पावर का उपयोग करके वॉलेट खनन और गिफ्टकार्ड्स खरीदने और बहुत कुछ करने का अवसर प्रदान करती है।",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings." : "Gamehag मालिकों की वेबसाइट। इसमें विभिन्न सर्वेक्षण प्रदाताओं और ऑफरवॉल पार्टनरों की एक अच्छी संख्या होती है जिनमें से चुनने के लिए, कमाई निकालने के लिए कई विकल्प होते हैं।",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources." : "SteamGifts एक वैध वेबसाइट है जो Steam गेम गिवअवे के लिए एक सहायक समुदाय और मददगार संसाधनों के साथ है।",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. By RustChance owners.":"RustCases एक भरोसेमंद Rust जुआ साइट है जिसमें विभिन्न खेल मोड, विशाल संख्या में केस, और स्किन निकासी के विकल्प होते हैं। RustChance के मालिकों द्वारा।",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more !":"RustClash एक नया Rust जुआ साइट है जिसमें रूलेट, अपग्रेडर, केस और अन्य कई खेल शामिल हैं!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.":"BC.Game एक ऑनलाइन कैसीनो और स्पोर्ट्सबुक है जिसे 2017 में लॉन्च किया गया था, जो स्वामित्व वाले और संभावित इंसाफ़ वाले गेम्स सहित 8,000 से अधिक गेम्स प्रदान करता है।",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.":"Primedice एक ऑनलाइन क्रिप्टो डाइस गेम कैसीनो है जो 2013 से संचालन में है। यह जुए के लिए क्रिप्टो का प्रयोग करने वाले पहले प्लेटफ़ॉर्मों में से एक था।",
      "Withdraw BTC, LTC, ETH and many else!":"बीटीसी, एलटीसी, ईटीएच और बहुत सारे अन्य के निकास!",
      "Withdrawal of many types of cryptocurrencies !":"बहुत सारे प्रकार के क्रिप्टोकरेंसीज़ का निकास!",
      "Withdraw CS:GO Skins, Crypto or Real Money!": "वापसी करें CS:GO स्किन, क्रिप्टो या वास्तविक धन!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "वापसी करें CS:GO, Dota 2, TF2 या Rust आइटम!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "वापसी करें CS:GO स्किन, क्रिप्टो या गेम कुंजी!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "वापसी करें CS:GO स्किन, क्रिप्टो या PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "वापसी करें धन, CS:GO, TF2 या Rust स्किन!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "वापसी करें CS:GO स्किन, Dota 2 और H1Z1 आइटम!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "वापसी करें CS:GO, Rust स्किन और Dota 2 आइटम!",
      "Withdraw CS:GO Skins, Gift Cards or Crypto!": "CS:GO स्किन, गिफ्ट कार्ड या क्रिप्टो को निकालें!",
      "Withdraw Rust Skins or Crypto!": "Rust स्किन या क्रिप्टो को निकालें!",
      "Withdraw Rust Skins and Items!": "Rust स्किन और आइटम को निकालें!",
      "Withdraw CS:GO And Rust Skins or Crypto!": "वापसी करें CS:GO और Rust स्किन या क्रिप्टो!",
      "Withdraw CS:GO Skins or real Money!": "वापसी करें CS:GO स्किन या वास्तविक धन!",
      "Withdraw Steam Trading cards or Games.": "वापसी करें Steam ट्रेडिंग कार्ड या गेम्स।",
      "Withdraw USDT, Skins or Real Money!": "वापसी करें USDT, स्किन या वास्तविक धन!",
      "Withdraw Crypto, gift cards or real money!": "क्रिप्टो, गिफ्ट कार्ड या वास्तविक धन को निकालें!",
      "Withdraw Money, CS:GO or Rust Skins!": "वापसी करें धन, CS:GO या Rust स्किन!",
      "Withdraw Money, Crypto or Skins!": "वापसी करें धन, क्रिप्टो या स्किन!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Rust स्किन, क्रिप्टो या PayPal निकालें!",
      "Withdraw CS:GO Skins or Crypto!": "वापसी करें CS:GO स्किन या क्रिप्टो!",
      "Withdraw Money, Crypto or PayPal!": "वापसी करें धन, क्रिप्टो या PayPal!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "P2P CS:GO स्किन के साथ वापसी करें।",
      "Withdraw Real Money or Crypto!": "वापसी करें वास्तविक धन या क्रिप्टो!",
      "Withdraw BTC, ETH, USDT or Tron!": "वापसी करें BTC, ETH, USDT या Tron!",
      "Withdraw CS:GO Skins or PayPal!": "वापसी करें CS:GO स्किन या PayPal!",
      "Withdraw CS:GO Skins and Items!": "वापसी करें CS:GO स्किन और आइटम!",
      "Withdraw Steam Trading cards.": "Steam ट्रेडिंग कार्ड वापसी करें।",
      "Withdraw with many-many ways.": "बहुत-सारे तरीकों से निकालें।",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "बिटकॉइन, एथेरियम या लाइटकॉइन को निकालें!",
      "Withdraw Games, GiftCards and many more!": "गेम्स, गिफ्ट कार्ड्स और बहुत कुछ को निकालें!",
      "Withdraw Crypto or Real Money!": "क्रिप्टो या वास्तविक धन को निकालें!",
      "Withdraw Crypto and Gift Cards!": "क्रिप्टो और गिफ्ट कार्ड निकालें!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "BTC, LTC, USDT, USDC या ETH निकालें!",
      "Withdraw CS:GO Skins or Items!": "CS:GO स्किन या आइटम निकालें!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": "गेम्स, गिफ्ट कार्ड्स या Dota2 और TF2 आइटम निकालें!",
      "Withdraw Games, GiftCards or Donate to Charity!": "गेम्स, गिफ्ट कार्ड्स या चैरिटी को दान करें!",
      "Participate in Giveaways and win Steam Games.": "गिवअवे में भाग लें और स्टीम गेम जीतें।",
      "360% Deposit Bonus":"360% जमा बोनस",
      "Deposit Bonus":"जमा बोनस",
      "Visit WebSite": "वेबसाइट पर जाएं",
      "Visit WebSite or Copy": "वेबसाइट पर जाएं",
      "100% deposit bonus": "100% जमा बोनस",
      "+3% Sell Bonus": "+3% बेचने का बोनस",
      "5% deposit bonus": "5% जमा बोनस",
      "5 Free Cases": "5 मुफ्त केस",
      "Free 50 Gems": "मुफ्त 50 गेम्स",
      "3 Free Cases": "3 मुफ्त केस",
      "1.5$ for free": "1.5 डॉलर मुफ्त में",
      "Free 1.00$": "मुफ्त 1.00 डॉलर",
      "Free 0.90$": "मुफ्त 0.90 डॉलर",
      "Free 0.50$": "मुफ्त 0.50 डॉलर",
      "Free 0.40$": "मुफ्त 0.40 डॉलर",
      "Free 0.30$": "मुफ्त 0.30 डॉलर",
      "Free 0.25$": "मुफ्त 0.25 डॉलर",
      "Free 0.20$": "मुफ्त 0.20 डॉलर",
      "Free 0.15$": "मुफ्त 0.15 डॉलर",
      "Free 0.10$": "मुफ्त 0.10 डॉलर",
      "Free 0.05$": "मुफ्त 0.05 डॉलर",
      "Free Case": "मुफ्त केस",
      "Free 1$": "मुफ्त 1 डॉलर",
      "Big Daily Giveaways": "रोज़ाना बड़े हद तक दिए जाने वाले उपहार",
      "Free Case up to 250$": "250$ तक मुफ्त केस",
      "Daily Giveaway": "रोज़ाना बांटने का इंतेज़ाम",
      "Free 100 Diamonds": "100 मुफ्त हीरे",
      "500 coins": "500 सिक्के मुफ्त",
      "Daily Cases": "रोज़ाना केस",
      "3 Energy Points": "3 ऊर्जा अंक",
      "Free 200 Coins": "200 सिक्के मुफ्त",
      "some free coins": "कुछ मुफ्त सिक्के",
      "Free 2$": "मुफ्त 2 डॉलर",
      "Free spins": "मुफ्त स्पिन",
      "Offerwall": "ऑफरवॉल",
      "x2 Mining Rate": "x2 खनन दर",
      "Games Giveaways": "गेम्स गिवअवे"
    };

    var elements = parentElement.querySelectorAll(".box .content p, .box .logobg .best, .box .content button");
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        elements[j].innerHTML = translations[text];
      }
    }
  }

  // Загружаем содержимое из файла при загрузке страницы
  window.onload = importDivContent;
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