function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')  && !window.location.pathname.includes("/topic/") && !window.location.pathname.includes('/reviews/') && !window.location.pathname.includes('/mirrors/')) {
  function updateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href]');
    var regex = /^(https?:\/\/[^/]+)?(\/.*)$/;
  
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      
      if (href.includes('vk.com')) {
        continue;
      }
      
      var match = href.match(regex);
      if (match) {
        var domain = match[1] || '';
        var path = match[2];
        var updatedHref = '/ru' + path;
        links[i].setAttribute('href', updatedHref);
      }
    }
  }

  var SitesList = document.querySelector('.boxes-holder');
  updateURLs(SitesList);
}

if (!window.location.pathname.startsWith("/rust") && !window.location.pathname.includes("/topic") && !window.location.pathname.includes("/reviews")) {

  function translateURLsMain(parentElement, languageTag, translations) {
    var links = parentElement.querySelectorAll('a[href]');
    var supportedLanguages = Object.keys(translations);
    
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      
      if (!href) continue;
      
      var url = new URL(href, window.location.href);
      var path = url.pathname;
      var langIncluded = supportedLanguages.some(lang => {
        var langWithSlashes = '/' + lang + '/';
        return path.includes(langWithSlashes);
      });
      
      if (languageTag !== 'en') {
        if (!langIncluded && supportedLanguages.includes(languageTag)) {
          path = '/' + languageTag + path;
          url.pathname = path;
          links[i].setAttribute('href', url.href);
        }
      }
    }
  
    var elements = document.querySelectorAll('.category-box-content span, ul .submenu li a');
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations[languageTag] && translations[languageTag].hasOwnProperty(text)) {
        if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
          elements[j].innerHTML = translations[languageTag][text] + ' <i class="bi bi-caret-right-fill"></i>';
        } else {
          elements[j].innerHTML = translations[languageTag][text];
        }
      }
    }
  }

  // Load translations from JSON file
  fetch('/code-parts/translations/categories.json')
    .then(response => response.json())
    .then(translations => {
      var categorySelector = document.querySelector('.category-selector');
      translateURLsMain(categorySelector, languageTag, translations);
    })
    .catch(error => console.error('Error loading translations:', error));
}


if (!window.location.pathname.startsWith("/rust")) {

  function translateURLs2(parentElement, languageTag, translations) {
    var supportedLanguages = Object.keys(translations);
    var langWithSlashes = supportedLanguages.map(lang => '/' + lang + '/');
  
    var links = parentElement.querySelectorAll('a[href]');
    for (var i = 0, len = links.length; i < len; i++) {
      var href = links[i].getAttribute('href');
  
      if (!href) continue;
  
      var url = new URL(href, window.location.href);
      var path = url.pathname;
  
      if (languageTag !== 'en') {
        var langIncluded = langWithSlashes.some(lang => path.includes(lang));
        if (!langIncluded && supportedLanguages.includes(languageTag)) {
          path = '/' + languageTag + path;
          url.pathname = path;
          links[i].setAttribute('href', url.href);
        }
      }
    }

    var elements = document.querySelectorAll('.nav-bar .category-box-content span, .nav-bar ul .submenu li a');
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations[languageTag] && translations[languageTag].hasOwnProperty(text)) {
        if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
          elements[j].innerHTML = translations[languageTag][text] + ' <i class="bi bi-caret-right-fill"></i>';
        } else {
          elements[j].innerHTML = translations[languageTag][text];
        }
      }
    }
  }

  function applyTranslation(element, languageTag, translations) {
    translateURLs2(element, languageTag, translations);
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          var addedElement = mutation.addedNodes[0];
          if (addedElement.classList && addedElement.classList.contains('category-selector')) {
            translateURLs2(addedElement, languageTag, translations);
          }
        }
      });
    });

    observer.observe(element, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var navBarContainer = document.createElement('div');

    fetch('/code-parts/nav-bar.html')
      .then(response => response.text())
      .then(data => {
        navBarContainer.innerHTML = data;

        var header = document.querySelector('header');

        if (!header) return;

        header.insertAdjacentElement('afterend', navBarContainer.firstChild);

        var categorySelector = document.querySelector('.category-selector');
        if (categorySelector) {
          fetch('/code-parts/translations/categories.json')  // Load translations from JSON file
            .then(response => response.json())
            .then(translations => {
              applyTranslation(categorySelector, languageTag, translations);
            });
        }

        var menuToggle = document.querySelector('.menu-toggle');
        var navBar = document.querySelector('.nav-bar');

        if (menuToggle && navBar) {
          menuToggle.addEventListener('click', function() {
            navBar.classList.toggle('active');
          });

          navBar.addEventListener('click', function() {
            navBar.classList.remove('active');
          });
        }
      });
  });

}

function translateTextElements(translations) {
  var siteprosElements = document.querySelectorAll('.sitedetails .sitepros span');
  for (var i = 0; i < siteprosElements.length; i++) {
    var text = siteprosElements[i].textContent.trim();
    if (translations.hasOwnProperty(text)) {
      siteprosElements[i].innerHTML = translations[text] + ' <i class="bi bi-caret-down-fill"></i>';
    }
  }

  var ratingwayElements = document.querySelectorAll('.ratingthings .ratingway span, .content button, .boxreview .plusminus .criteria .par h2, .features .featuresbox .typesinside a, .instruction li');
  for (var j = 0; j < ratingwayElements.length; j++) {
    var text = ratingwayElements[j].textContent.trim();
    if (translations.hasOwnProperty(text)) {
      ratingwayElements[j].innerHTML = translations[text];
    }
  }
}

if (window.location.pathname.includes('/ru/reviews/') || window.location.pathname.includes('/ru/mirrors/')) {
  var translations = {
    "Deposit Methods": "Способы Пополнения",
    "Withdraw Methods": "Способы Вывода",
    "Sign Up Bonus": "Бонус за Регистрацию",
    "Faucet System": "Система Кранов",
    "Daily Rewards": "Ежедневные Награды",
    "Daily Giveaways": "Ежедневные Розыгрыши",
    "No Bonus": "Нет Бонуса",
    "Deposit Bonus": "Бонус к Пополнению",
    "Rain System": "Дожди",
    "Rakeback System": "Рейкбек",
    "Pros": "Плюсы",
    "Price": "Цены",
    "Cons": "Минусы",
    "Trust": "Доверие",
    "Support": "Поддержка",
    "Payments": "Деп/Вывод",
    "Functional": "Функционал",
    "Playability": "Режимы",
    "Sign up via Steam": "Залогиньтесь через Steam ",
    "Enjoy !": "Наслаждайтесь !",
    "Visit WebSite": "Посетить Сайт"
  };
  translateTextElements(translations);

  var links = document.getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    
    // Check if the link is not inside div.box
    if (!link.closest('div.siteblock div.box, ol li a, nav .socials')) {
      if (!link.classList.contains('lang-switch') && !link.closest('.instruction-mirrors')) {
        var path = link.pathname;

        if (!path.includes('/ru/') && path.indexOf('/ru') !== 0) {
          if (path !== '/') {
            link.pathname = '/ru' + path;
          } else {
            link.href = link.href.replace('csgobroker.co/', 'csgobroker.co/ru/');
          }
        }
      }     
    }
  }
}

if (window.location.pathname.includes('/pl/reviews/')) {
  var translations = {
    "Deposit Methods": "Metody Depozytu",
    "Withdraw Methods": "Metody Wypłaty",
    "Sign Up Bonus": "Bonus Rejestracyjny",
    "No Bonus": "Brak Bonusu",
    "Pros": "Zalety",
    "Price": "Cena",
    "Cons": "Wady",
    "Trust": "Zaufanie",
    "Support": "Wsparcie",
    "Payments": "Płatności",
    "Functional": "Funkcjonalność",
    "Sign up via Steam": "Zarejestruj się za pomocą Steam",
    "Enjoy !": "Ciesz się!",
    "Visit WebSite": "Odwiedź stronę internetową"
  };
  translateTextElements(translations);
}

document.addEventListener('DOMContentLoaded', function() {
if (!window.location.pathname.includes("/reviews/") && !window.location.pathname.includes("/mirrors/") && !window.location.pathname.includes("/topic")) {
  const boxContainer = document.querySelector('.category-selector');
  const buttonsContainer = document.createElement('div');
  const prevButtonContainer = document.createElement('button');
  const nextButtonContainer = document.createElement('button');
  const boxes = boxContainer.querySelectorAll('.category-box');
  const boxWidth = boxes[0].offsetWidth + (2 * 9);
  const containerWidth = boxWidth * 4;
  let scrollPosition = 0;
  let buttonScrollPosition = 0;

  buttonsContainer.classList.add('buttons-container');
  prevButtonContainer.classList.add('controls-button');
  prevButtonContainer.innerHTML = '<i class="bi bi-chevron-left"></i>';
  nextButtonContainer.classList.add('controls-button');
  nextButtonContainer.innerHTML = '<i class="bi bi-chevron-right"></i>';

  buttonsContainer.appendChild(prevButtonContainer);
  buttonsContainer.appendChild(nextButtonContainer);

  boxContainer.parentNode.insertBefore(buttonsContainer, boxContainer);

  boxContainer.style.width = `${containerWidth}px`;

  prevButtonContainer.addEventListener('click', () => {
    scrollPosition -= boxWidth;
    scrollPosition = Math.max(scrollPosition, 0);
    boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
    buttonScrollPosition = scrollPosition;
  });

  nextButtonContainer.addEventListener('click', () => {
    scrollPosition += boxWidth;
    scrollPosition = Math.min(scrollPosition, boxContainer.scrollWidth - containerWidth);
    boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
    buttonScrollPosition = scrollPosition;
  });

  let isMouseDown = false;
  let startX = 0;
  let scrollLeft = 0;

  boxContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isMouseDown = true;
    startX = e.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  boxContainer.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 0.6;
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft;
  });

  boxContainer.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  boxContainer.addEventListener('mouseleave', () => {
    isMouseDown = false;
  });

  boxContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    isMouseDown = true;
    startX = touch.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  boxContainer.addEventListener('touchmove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 1.2;
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft;
  });

  boxContainer.addEventListener('touchend', () => {
    isMouseDown = false;
  });

  var categorySelector = document.querySelector('div.category-selector');
  var ulElements = categorySelector.querySelectorAll('div.category-selector > ul');
  var ulArray = Array.from(ulElements);

  ulArray.sort(function(a, b) {
    var aIsActive = a.querySelector('li a.category-box').classList.contains('active');
    var bIsActive = b.querySelector('li a.category-box').classList.contains('active');
  
    if (aIsActive && !bIsActive) {
      return -1;
    } else if (!aIsActive && bIsActive) {
      return 1;
    } else if (a.querySelector('li a.category-box').classList.contains('last')) {
      return 1;
    } else if (b.querySelector('li a.category-box').classList.contains('last')) {
      return -1;
    } else {
      return Math.random() - 0.5;
    }
  });  

  while (categorySelector.firstChild) {
    categorySelector.removeChild(categorySelector.firstChild);
  }

  ulArray.forEach(function (ul) {
    categorySelector.appendChild(ul);
  });

  buttonsContainer.scrollLeft = buttonScrollPosition;
}

function translateURLsSlider(parentElement, languageTag) {
  var links = parentElement.querySelectorAll('a[href]');
  var supportedLanguages = ['hi', 'tr', 'pt', 'es', 'ru'];
  
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    
    if (!href) continue;
    
    var url = new URL(href, window.location.href);
    var path = url.pathname;
    var langIncluded = supportedLanguages.some(lang => {
      var langWithSlashes = '/' + lang + '/';
      return path.includes(langWithSlashes);
    });
    
    if (languageTag !== 'en') {
      if (langIncluded) {
        path = path.replace(/\/(hi|tr|pt|es|ru)\//, '/' + languageTag + '/');
        url.pathname = path;
        links[i].setAttribute('href', url.href);
      } else if (supportedLanguages.includes(languageTag)) {
        path = '/' + languageTag + path;
        url.pathname = path;
        links[i].setAttribute('href', url.href);
      }
    }
  }
}

(function() {
  var insertAfter = function(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  let currentSlide = 0;
  var slideInterval;
  var slideShowActive = true; // Добавляем флаг
  var isTransitioning = false; // Флаг для блокировки анимации

  function showSlide(index) {
    const slides = document.querySelectorAll('.slider-banner');
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    if (slideShowActive && !isTransitioning) { // Проверяем флаги перед сменой слайда
      isTransitioning = true; // Устанавливаем флаг анимации

      setTimeout(function() {
        isTransitioning = false; // Сбрасываем флаг анимации
      }, 6000); // Устанавливаем длительность анимации в миллисекундах (здесь 500 мс)

      currentSlide = (currentSlide + 1) % 3;
      showSlide(currentSlide);
    }
  }

  function startSlideShow() {
    slideShowActive = true;
    slideInterval = setInterval(nextSlide, 6000);
  }

  function stopSlideShow() {
    slideShowActive = false;
    clearInterval(slideInterval);
  }

  startSlideShow();

  var path = window.location.pathname;
  var existingSliderPlacer = document.querySelector('.slider-placer');

  if (existingSliderPlacer) {
    existingSliderPlacer.parentNode.removeChild(existingSliderPlacer);
  }

  var sliderPlacer = document.createElement('div');
  sliderPlacer.classList.add('slider-placer');

  var controlsContainer = document.createElement('div');
  controlsContainer.classList.add('controls');

  var prevButton = document.createElement('button');
  prevButton.classList.add('prev-button');
  prevButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
  controlsContainer.appendChild(prevButton);
  
  var nextButton = document.createElement('button');
  nextButton.classList.add('next-button');
  nextButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
  controlsContainer.appendChild(nextButton);  

  var slider1 = document.createElement('a');
  slider1.href = '/';
  slider1.classList.add('slider-banner', 'active');
  var img1 = document.createElement('img');
  img1.src = '/img/best-gambling-sites-slide.png';
  img1.alt = 'Best Gambling Sites';
  slider1.appendChild(img1);

  var slider2 = document.createElement('a');
  slider2.href = '/earning/offerwalls';
  slider2.classList.add('slider-banner');
  var img2 = document.createElement('img');
  img2.src = '/img/earn-skins-slider.png';
  img2.alt = 'Best Offerwall Sites';
  slider2.appendChild(img2);

  var slider3 = document.createElement('a');
  slider3.href = '/rust';
  slider3.classList.add('slider-banner');
  var img3 = document.createElement('img');
  img3.src = '/img/best-rust-sites-slide.png';
  img3.alt = 'Best Rust Sites';
  slider3.appendChild(img3);

  sliderPlacer.appendChild(controlsContainer);
  sliderPlacer.appendChild(slider1);
  sliderPlacer.appendChild(slider2);
  sliderPlacer.appendChild(slider3);

  var languageTag = path.match(/\/(hi|tr|pt|es|ru)(\.html)?/);
  if (languageTag) {
    languageTag = languageTag[1];
    translateURLsSlider(sliderPlacer, languageTag);
  }

  if (path.includes('/mirrors/')) {
    var sitealternatesboxes = document.querySelector('.sitealternatesboxes');
    if (sitealternatesboxes) {
      insertAfter(sliderPlacer, sitealternatesboxes);
    }
  } else if (path.includes('/reviews/')) {
    var ratingsumm = document.querySelector('div.ratingsumm');
    if (ratingsumm) {
      insertAfter(sliderPlacer, ratingsumm);
    }
  } else {
    var footer = document.querySelector('footer');
    footer.parentNode.insertBefore(sliderPlacer, footer);
  }

  var slideElements = document.querySelectorAll('.slider-banner');
  slideElements.forEach(function(slideElement) {
    slideElement.addEventListener('mouseenter', function() {
      stopSlideShow();
    });

    slideElement.addEventListener('mouseleave', function() {
      startSlideShow();
    });
  });

  nextButton.addEventListener('click', function() {
    currentSlide = (currentSlide + 1) % 3; // Updated to % 3
    showSlide(currentSlide);
  });
  
  prevButton.addEventListener('click', function() {
    currentSlide = (currentSlide - 1 + 3) % 3; // Updated to % 3
    showSlide(currentSlide);
  });

})();



if (
  !window.location.pathname.includes("/reviews/") &&
  !window.location.pathname.includes("/mirrors/") &&
  window.location.pathname !== "/ru" &&
  window.location.pathname !== "/pt" &&
  window.location.pathname !== "/es" &&
  window.location.pathname !== "/tr" &&
  window.location.pathname !== "/hi" &&
  !window.location.pathname.endsWith("ru.html") &&
  !window.location.pathname.endsWith("pt.html") &&
  !window.location.pathname.endsWith("es.html") &&
  !window.location.pathname.endsWith("tr.html") &&
  !window.location.pathname.endsWith("hi.html") &&
  !window.location.pathname.endsWith("index.html")
) {
  var currentLanguage = "";

  var languageMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
  if (languageMatch && languageMatch[1]) {
    currentLanguage = languageMatch[1];
  } else {
    currentLanguage = "en";
  }

  var langMenuDiv = document.querySelector(".lang-menu");

  var newContent = '<div class="selected-lang">';
  if (currentLanguage === "en") {
    newContent += "EN";
  } else if (currentLanguage === "ru") {
    newContent += "RU";
  } else if (currentLanguage === "pt") {
    newContent += "PT";
  } else if (currentLanguage === "es") {
    newContent += "ES";
  } else if (currentLanguage === "tr") {
    newContent += "TR";
  } else if (currentLanguage === "hi") {
    newContent += "HI";
  }
  newContent += "</div><ul>";
  if (currentLanguage !== "en") {
    newContent +=
      '<li><a href="' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="en">EN</a></li>';
  }
  if (currentLanguage !== "ru") {
    newContent +=
      '<li><a href="/ru' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="ru">RU</a></li>';
  }
  if (currentLanguage !== "pt") {
    newContent +=
      '<li><a href="/pt' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="pt">PT</a></li>';
  }
  if (currentLanguage !== "es") {
    newContent +=
      '<li><a href="/es' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="es">ES</a></li>';
  }
  if (currentLanguage !== "tr") {
    newContent +=
      '<li><a href="/tr' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="tr">TR</a></li>';
  }
  if (currentLanguage !== "hi") {
    newContent +=
      '<li><a href="/hi' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="hi">HI</a></li>';
  }
  newContent += "</ul>";

  langMenuDiv.innerHTML = newContent;
}

const backToTopButton = document.querySelector("#back-to-top-btn");

window.addEventListener("scroll", scrollFunction);

function scrollFunction() {
  if (window.pageYOffset > 300) {
    if(!backToTopButton.classList.contains("btnEntrance")) {
      backToTopButton.classList.remove("btnExit");
      backToTopButton.classList.add("btnEntrance");
      backToTopButton.style.display = "block";
    }
  }
  else { //
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
var searchInput = document.getElementById('search-input'); 
var isRussianPage = window.location.pathname.includes('/ru');
var sites = [
  '<li><a href="/topic/skins/red-skins">Red Skins</a></li>',
  '<li><a href="/topic/skins/yellow-skins">Yellow Skins</a></li>',
  '<li><a href="/topic/skins/blue-skins">Blue Skins</a></li>',
  '<li><a href="/topic/skins/purple-skins">Purple Skins</a></li>',
  '<li><a href="/topic/skins/green-skins">Green Skins</a></li>',
  '<li><a href="/reviews/idle-empire">Idle-empire</a></li>',
  '<li><a href="/reviews/insanegg">Insanegg</a></li>',
  '<li><a href="/reviews/key-drop">Key-drop</a></li>',
  '<li><a href="/reviews/knifex">Knifex</a></li>',
  '<li><a href="/reviews/lis-skins">Lis-skins</a></li>',
  '<li><a href="/reviews/lootbear">Lootbear</a></li>',
  '<li><a href="/reviews/lootfarm">Lootfarm</a></li>',
  '<li><a href="/reviews/primedice">Primedice</a></li>',
  '<li><a href="/reviews/rollbit">Rollbit</a></li>',
  '<li><a href="/reviews/roobet">Roobet</a></li>',
  '<li><a href="/reviews/rustbet">Rustbet</a></li>',
  '<li><a href="/reviews/rustcases">Rustcases</a></li>',
  '<li><a href="/reviews/rustchance">Rustchance</a></li>',
  '<li><a href="/reviews/rustclash">Rustclash</a></li>',
  '<li><a href="/reviews/rustix">Rustix</a></li>',
  '<li><a href="/reviews/rustmoment">Rustmoment</a></li>',
  '<li><a href="/reviews/ruststake">Ruststake</a></li>',
  '<li><a href="/reviews/rustyloot">Rustyloot</a></li>',
  '<li><a href="/reviews/rustypot">Rustypot</a></li>',
  '<li><a href="/reviews/salad">Salad</a></li>',
  '<li><a href="/reviews/shadowpay">Shadowpay</a></li>',
  '<li><a href="/reviews/skinbaron">Skinbaron</a></li>',
  '<li><a href="/reviews/skinbet">Skinbet</a></li>',
  '<li><a href="/reviews/skincashier">Skincashier</a></li>',
  '<li><a href="/reviews/skinscash">Skinscash</a></li>',
  '<li><a href="/reviews/skinswap">Skinswap</a></li>',
  '<li><a href="/reviews/steamgifts">Steamgifts</a></li>',
  '<li><a href="/reviews/steamlvlup">Steamlvlup</a></li>',
  '<li><a href="/reviews/swapgg">Swapgg</a></li>',
  '<li><a href="/reviews/tradeit">Tradeit</a></li>',
  '<li><a href="/reviews/vvvgamers">Vvvgamers</a></li>',
  '<li><a href="/reviews/wtfskins">Wtfskins</a></li>',
  '<li><a href="/reviews/xplay">Xplay</a></li>',
  '<li><a href="/reviews/avanmarket">Avanmarket</a></li>',
  '<li><a href="/reviews/banditcamp">Banditcamp</a></li>',
  '<li><a href="/reviews/bcgame">Bcgame</a></li>',
  '<li><a href="/reviews/bets4pro">Bets4pro</a></li>',
  '<li><a href="/reviews/bitskins">Bitskins</a></li>',
  '<li><a href="/reviews/bitskins-p2p">Bitskins p2p</a></li>',
  '<li><a href="/reviews/clashgg">Clashgg</a></li>',
  '<li><a href="/reviews/crashgg">Crashgg</a></li>',
  '<li><a href="/reviews/csdeals">CsDeals</a></li>',
  '<li><a href="/reviews/csgo500">CSGO500</a></li>',
  '<li><a href="/reviews/csgobig">CSGOBig</a></li>',
  '<li><a href="/reviews/csgoempire">CSGOEmpire</a></li>',
  '<li><a href="/reviews/csgofast">CSGOFast</a></li>',
  '<li><a href="/reviews/csgolive">CSGOLive</a></li>',
  '<li><a href="/reviews/csgoluck">CSGOLuck</a></li>',
  '<li><a href="/reviews/csgo-market">CSGO-Market</a></li>',
  '<li><a href="/reviews/csgopolygon">CSGOPolygon</a></li>',
  '<li><a href="/reviews/csgopositive">CSGOPositive</a></li>',
  '<li><a href="/reviews/csgoroll">CSGORoll</a></li>',
  '<li><a href="/reviews/csgoselly">CSGOSelly</a></li>',
  '<li><a href="/reviews/csgo-skins">CSGO-Skins</a></li>',
  '<li><a href="/reviews/cybershoke">Cybershoke</a></li>',
  '<li><a href="/reviews/daddyskins">Daddyskins</a></li>',
  '<li><a href="/reviews/datdrop">Datdrop</a></li>',
  '<li><a href="/reviews/dmarket">Dmarket</a></li>',
  '<li><a href="/reviews/duelbits">Duelbits</a></li>',
  '<li><a href="/reviews/earnweb">Earnweb</a></li>',
  '<li><a href="/reviews/farmskins">Farmskins</a></li>',
  '<li><a href="/reviews/flamecases">Flamecases</a></li>',
  '<li><a href="/reviews/freecash">Freecash</a></li>',
  '<li><a href="/reviews/freeward">Freeward</a></li>',
  '<li><a href="/reviews/gamdom">Gamdom</a></li>',
  '<li><a href="/reviews/gamehag">Gamehag</a></li>',
  '<li><a href="/reviews/gamerpay">Gamerpay</a></li>',
  '<li><a href="/reviews/gametame">Gametame</a></li>',
  '<li><a href="/reviews/gcskins">Gcskins</a></li>',
  '<li><a href="/reviews/grindbux">Grindbux</a></li>',
  '<li><a href="/reviews/hellcase">Hellcase</a></li>',
  '<li><a href="/reviews/hellstore">Hellstore</a></li>',
  '<li><a href="/reviews/howlgg">Howlgg</a></li>',
  '<li><a href="/reviews/skinbid">SkinBid</a></li>',
  '<li><a href="/reviews/shuffle">Shuffle</a></li>',
  '<li><a href="/reviews/steamlevels">SteamLevels</a></li>',
  '<li><a href="/reviews/steamlevelu">SteamLevelU</a></li>',
  '<li><a href="/reviews/whitemarket">White.Market</a></li>',
  '<li><a href="/reviews/hypeup">Hypeup</a></li>',
];

function compareSites(a, b) {
  var siteNameA = a.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var siteNameB = b.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var searchTerm = searchInput.value.toLowerCase();

  if (
    siteNameA.charAt(0) === searchTerm.charAt(0) &&
    siteNameB.charAt(0) !== searchTerm.charAt(0)
  ) {
    return -1;
  } else if (
    siteNameA.charAt(0) !== searchTerm.charAt(0) &&
    siteNameB.charAt(0) === searchTerm.charAt(0)
  ) {
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
    
    if (isRussianPage) {
      var href = link.getAttribute('href');
      var newHref = href.replace('/', '/ru/');
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
var threshold = 100;

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
  
    if (direction === "next") {
      nextSlide.classList.add("next");
    } else if (direction === "previous") {
      nextSlide.classList.add("previous");
    }
  
    currentIndex = index;
  
    var triggerLabels = triggersContainer.querySelectorAll("label");
    triggerLabels.forEach(function (label, labelIndex) {
      if (labelIndex === index) {
        label.classList.add("active");
      } else {
        label.classList.remove("active");
      }
    });
  
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
  
  triggersContainer.addEventListener("touchstart", function (event) {
    startX = event.touches[0].clientX;
  });
  
  triggersContainer.addEventListener("touchend", function (event) {
    var endX = event.changedTouches[0].clientX;
    var deltaX = endX - startX;
  
    if (deltaX > threshold) {
      previousSlide();
      startSlideShow();
    } else if (deltaX < -threshold) {
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
  
  
  function startSlideShow() {
    stopSlideShow();
    slideInterval = setInterval(nextSlide, 5000);
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
  
  showSlide(currentIndex);
  startSlideShow();
  
  prevButton.addEventListener("click", function () {
    if (currentIndex !== 0) {
      previousSlide();
      startSlideShow();
    }
  });
  
  nextButton.addEventListener("click", function () {
    if (currentIndex !== slides.length - 1) {
      nextSlide();
      startSlideShow();
    }
  });
}

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')) {


        // Создаем новый div элемент
        var newDiv = document.createElement("div");
        newDiv.className = "vpn";
        newDiv.textContent = "Нужен VPN";

        // Массив айди, на которые нужно добавлять .vpn
        var allowedIds = ["CSGORoll", "Clash", "HowlGG", "RustyPot", "RustChance", "Rollbit", "Duelbits", "FlameCases", "BCGame", "Roobet", "DaddySkins", "CSGOLive", "WTFSkins", "Key-Drop", "gcskins", "FarmSkins", "vvvgamers"];

        // Находим все элементы .box
        var boxElements = document.querySelectorAll(".box");

        // Проходим по всем элементам .box и добавляем новый div в нужные элементы
        boxElements.forEach(function(boxElement) {
            var boxId = boxElement.id;
            if (allowedIds.includes(boxId)) {
                var logobgElement = boxElement.querySelector(".logobg");
                if (logobgElement) {
                    var clonedDiv = newDiv.cloneNode(true);
                    logobgElement.appendChild(clonedDiv);
                } else {
                    console.error("Не удалось найти элемент .logobg внутри .box");
                }
            }
        });
      }});