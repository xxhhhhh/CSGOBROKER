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

// Получаем языковую настройку браузера пользователя
var userLang = navigator.language || navigator.userLanguage;

// Проверяем значение языковой настройки и перенаправляем на соответствующую страницу
if (userLang === 'ru' || userLang === 'ru-RU') {
  // Получаем текущий URL-адрес
  var currentUrl = window.location.href;

  // Разбиваем URL-адрес на основе символа '/'
  var urlParts = currentUrl.split('/');

  // Вставляем '/ru/' перед остальной частью URL-адреса
  urlParts.splice(3, 0, 'ru');

  // Формируем новый URL-адрес
  var newUrl = urlParts.join('/');

  // Перенаправляем на новый URL-адрес
  window.location.href = newUrl;
}


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