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
      "Withdraw CS:GO Skins, Crypto or Real Money!": "Выводите скины CS:GO, криптовалюту или деньги!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "Выводите предметы CS:GO, Dota 2, TF2 или Rust!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "Выводите скины CS:GO, криптовалюту или Игры!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "Выводите скины CS:GO, Криптовалюту или PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "Выводите Деньги, Скины CS:GO, TF2 или Rust!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "Выводите предметы CS:GO, Dota 2 и H1Z1!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "Выводите предметы CS:GO, Dota 2 и Rust!",
      "Withdraw CS:GO And Rust Skins or Crypto!": "Выводите скины CS:GO, Rust или Крипту!",
      "Withdraw CS:GO Skins or real Money!": "Выводите скины CS:GO или деньги на Карту!",
      "Withdraw Steam Trading cards or Games.": "Выводите Steam Trading cards или Игры.",
      "Withdraw USDT, Skins or Real Money!": "Выводите USDT, Скины или Реальные Деньги",
      "Withdraw Money, CS:GO or Rust Skins!": "Выводите Деньги, скины CS:GO или Rust!",
      "Withdraw Money, Crypto or Skins!": "Выводите Деньги, Криптовалюту или Скины!",
      "Withdraw CS:GO Skins or Crypto!": "Выводите скины CS:GO или криптовалюту!",
      "Withdraw Money, Crypto or PayPal!": "Выводите Деньги, Крипту или PayPal!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "Вывод только скинами CS:GO через P2P!",
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

  function importDivContent() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          var divToImport = document.getElementById('csgo-best-sites');
          divToImport.innerHTML = xhr.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        } else {
          console.error('Не удалось загрузить содержимое div.');
        }
      }
    };
    xhr.open('GET', '/multitop/csgo-best-sites.html', true);
    xhr.send();
  }

  function translateURLs(parentElement) {
    var translations = {
      "CSGO500 probably the best CS:GO Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, provavelmente o melhor site de apostas de CS:GO. Chuvas regulares, brindes e códigos promocionais. Você pode jogar muitos jogos e caça-níqueis.",
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
      "Withdraw CS:GO Skins, Crypto or Real Money!": "Retirar Skins do CS:GO, Criptomoedas ou Dinheiro!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "Retirar Itens do CS:GO, Dota 2, TF2 ou Rust!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "Retirar Skins do CS:GO, Criptomoedas ou Jogos!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "Retirar Skins do CS:GO, Criptomoedas ou PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "Retirar Dinheiro, Skins do CS:GO, TF2 ou Rust!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "Retirar Skins do CS:GO, Dota 2 e Itens do H1Z1!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "Retirar Skins do CS:GO, Rust e Itens do Dota 2!",
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
      "Visit WebSite": "Visite o Site",
      "Visit WebSite or Copy": "Visite o Site ou Copie",
      "100% deposit bonus": "Bônus de depósito de 100%",
      "+3% Sell Bonus": "Bônus de venda de +3%",
      "5% deposit bonus": "Bônus de depósito de 5%",
      "5 Free Cases": "5 Caixas Grátis",
      "Free 50 Gems": "50 Gemas Grátis",
      "3 Free Cases": "3 Caixas Grátis",
      "1.5$ for free": "1,5$ grátis",
      "Free 0.90$": "0,90$ grátis",
      "Free 0.50$": "0,50$ grátis",
      "Free 0.40$": "0,40$ grátis",
      "Free 0.30$": "0,30$ grátis",
      "Free 0.25$": "0,25$ grátis",
      "Free 0.05$": "0,05$ grátis",
      "Free Case": "Caixa Grátis",
      "Free 1$": "1$ grátis",
      "Free 2$": "2$ grátis",
      "Free 1$": "1$ grátis",
      "Free spins": "Rodadas Grátis"    
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

  function importDivContent() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          var divToImport = document.getElementById('csgo-best-sites');
          divToImport.innerHTML = xhr.responseText;
          translateURLs(divToImport); // Вызов функции перевода после загрузки содержимого
        } else {
          console.error('Не удалось загрузить содержимое div.');
        }
      }
    };
    xhr.open('GET', '/multitop/csgo-best-sites.html', true);
    xhr.send();
  }

  function translateURLs(parentElement) {
    var translations = {
      "CSGO500 probably the best CS:GO Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, संभवतः सर्वश्रेष्ठ CS:GO जुआ साइट है। नियमित वर्षवृष्टि, गिफ्टवे और प्रोमोकोड्स। आप कई खेल और स्लॉट्स खेल सकते हैं।",
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
      "Withdraw CS:GO Skins, Crypto or Real Money!": "वापसी करें CS:GO स्किन, क्रिप्टो या वास्तविक धन!",
      "Withdraw CS:GO, Dota 2, TF2 or Rust Items!": "वापसी करें CS:GO, Dota 2, TF2 या Rust आइटम!",
      "Withdraw CS:GO Skins, Crypto or Game Keys!": "वापसी करें CS:GO स्किन, क्रिप्टो या गेम कुंजी!",
      "Withdraw CS:GO Skins, Crypto or PayPal!": "वापसी करें CS:GO स्किन, क्रिप्टो या PayPal!",
      "Withdraw Money, CS:GO, TF2 or Rust Skins!": "वापसी करें धन, CS:GO, TF2 या Rust स्किन!",
      "Withdraw CS:GO Skins, Dota 2 and H1Z1 Items!": "वापसी करें CS:GO स्किन, Dota 2 और H1Z1 आइटम!",
      "Withdraw CS:GO, Rust Skins and Dota 2 Items!": "वापसी करें CS:GO, Rust स्किन और Dota 2 आइटम!",
      "Withdraw CS:GO And Rust Skins or Crypto!": "वापसी करें CS:GO और Rust स्किन या क्रिप्टो!",
      "Withdraw CS:GO Skins or real Money!": "वापसी करें CS:GO स्किन या वास्तविक धन!",
      "Withdraw Steam Trading cards or Games.": "वापसी करें Steam ट्रेडिंग कार्ड या गेम्स।",
      "Withdraw USDT, Skins or Real Money!": "वापसी करें USDT, स्किन या वास्तविक धन!",
      "Withdraw Money, CS:GO or Rust Skins!": "वापसी करें धन, CS:GO या Rust स्किन!",
      "Withdraw Money, Crypto or Skins!": "वापसी करें धन, क्रिप्टो या स्किन!",
      "Withdraw CS:GO Skins or Crypto!": "वापसी करें CS:GO स्किन या क्रिप्टो!",
      "Withdraw Money, Crypto or PayPal!": "वापसी करें धन, क्रिप्टो या PayPal!",
      "WITHDRAW WITH P2P CS:GO SKINS.": "P2P CS:GO स्किन के साथ वापसी करें।",
      "Withdraw Real Money or Crypto!": "वापसी करें वास्तविक धन या क्रिप्टो!",
      "Withdraw BTC, ETH, USDT or Tron!": "वापसी करें BTC, ETH, USDT या Tron!",
      "Withdraw CS:GO Skins or PayPal!": "वापसी करें CS:GO स्किन या PayPal!",
      "Withdraw CS:GO Skins and Items!": "वापसी करें CS:GO स्किन और आइटम!",
      "Withdraw Steam Trading cards.": "Steam ट्रेडिंग कार्ड वापसी करें।",
      "Visit WebSite": "वेबसाइट पर जाएं",
      "Visit WebSite or Copy": "वेबसाइट पर जाएं",
      "100% deposit bonus": "100% जमा बोनस",
      "+3% Sell Bonus": "+3% बेचने का बोनस",
      "5% deposit bonus": "5% जमा बोनस",
      "5 Free Cases": "5 मुफ्त केस",
      "Free 50 Gems": "मुफ्त 50 गेम्स",
      "3 Free Cases": "3 मुफ्त केस",
      "1.5$ for free": "1.5 डॉलर मुफ्त में",
      "Free 0.90$": "मुफ्त 0.90 डॉलर",
      "Free 0.50$": "मुफ्त 0.50 डॉलर",
      "Free 0.40$": "मुफ्त 0.40 डॉलर",
      "Free 0.30$": "मुफ्त 0.30 डॉलर",
      "Free 0.25$": "मुफ्त 0.25 डॉलर",
      "Free 0.05$": "मुफ्त 0.05 डॉलर",
      "Free Case": "मुफ्त केस",
      "Free 1$": "मुफ्त 1 डॉलर",
      "Free 2$": "मुफ्त 2 डॉलर",
      "Free 1$": "मुफ्त 1 डॉलर",
      "Free spins": "मुफ्त स्पिन"
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