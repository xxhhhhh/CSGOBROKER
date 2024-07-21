function copyToClipboard(selector) {
  var $element = $(selector);

  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($element.text()).select();
  document.execCommand("copy");
  $temp.remove();

  var copiedMessage = (languageTag === 'ru') ? 'Скопировано' : 'Copied';

  var $title = $("<div class='copied-title'>" + copiedMessage + "</div>");

  $element.siblings('.copy').append($title);

  $title.hide();

  $title.fadeIn(150, function() {
      $(this).delay(400).fadeOut(150, function() {
          $(this).remove();
      });
  });
}

forcemodsboxes(); 

  const sitesList = document.querySelector('.boxes-holder');
  const modsboxes = document.querySelector('.mods-main-box');

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
  
  var languageTag = extractLanguageTagFromHTML();

  function updateURLs(parentElement) {
    if (!parentElement) {
      return;
    }
  
    const links = parentElement.querySelectorAll('a[href]');
    const regex = /^(https?:\/\/[^/]+)?(\/[a-z]{2}(?:\/|\.html)?\/?.*)(\?.*)?$/;
  
    const languageTag = extractLanguageTagFromHTML();
    if (!languageTag || languageTag === 'en') {
      return;
    }
  
    links.forEach(link => {
      if (link.closest('div.instruction')) {
        return;
      }

      const href = link.getAttribute('href');
      const match = href.match(regex);
  
      if (match) {
        const domain = match[1] || '';
        let path = match[2];
        const queryString = match[3] || '';
  
        const pathSegments = path.split('/');
        if (pathSegments.length > 1 && pathSegments[1].length === 2) {
          return;
        }
  
        const updatedHref = `/${languageTag}${path}${queryString}`;

        if (!link.classList.contains('copy_style')) {
          link.setAttribute('href', domain + updatedHref);
        }
      }
    });
  }
  
  function addStarRatingToBoxesHolders() {
    for (var boxId in ratings) {
      addStarRating(boxId, ratings[boxId]);
    }
  }

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html') && 
    !window.location.pathname.includes("/topic") && 
    !window.location.pathname.includes('/reviews/') && 
    !window.location.pathname.includes('/mirrors/') && 
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us") &&
    !document.getElementById('error-404')) {

      updateURLs(sitesList);
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
        applyTranslation(categorySelector, languageTag, translations);
      }

      var menuToggle = document.querySelector('.menu-toggle');
      var navBar = document.querySelector('.nav-bar');
      var pages = document.querySelector('.pages');

      if (menuToggle && navBar) {
        menuToggle.addEventListener('click', function () {
          navBar.classList.toggle('active');
          menuToggle.classList.toggle('active');
          pages.classList.toggle('hardhidden');
        });

        navBar.addEventListener('click', function(event) {
          if (event.target === categorySelector) {
              menuToggle.classList.remove('active');
              navBar.classList.remove('active');
              pages.classList.remove('hardhidden');
          }
      });
      
      }

      var bigCategories = document.querySelectorAll('.big-category');

      bigCategories.forEach(function(category) {
        category.addEventListener('click', function(e) {
          const submenu2 = category.querySelector(".submenu2");
          if (submenu2 && window.innerWidth <= 1340 && !e.target.matches('.submenu2 a')) {
            e.preventDefault();
          }
        
          bigCategories.forEach(function(otherCategory) {
            if (otherCategory !== category) {
              otherCategory.classList.remove('active');
            }
          });
          this.classList.toggle('active');
        });
      });
      
      

      var boxContainerNav = document.querySelector('#notexist');
      var categorySelector = document.querySelector('.category-selector');
      if (boxContainerNav) {
        boxContainerNav.addEventListener("click", (e) => {
          const targetBox = e.target.closest(".category-box");

          if (targetBox) {
            const parentListItem = targetBox.closest("li");
            const submenu = parentListItem.querySelector(".submenu");

            const isTargetBoxNewest = targetBox.classList.contains("newest");

            if (!isTargetBoxNewest && window.innerWidth <= 1340) {
              e.preventDefault();
            }

            const allTargetBoxes = document.querySelectorAll(".category-box");
            allTargetBoxes.forEach((box) => {
              if (box !== targetBox) {
                box.classList.remove("current");
                const parentListItem = box.closest("li");
                const siblingSubmenu = parentListItem.querySelector(".submenu");
                if (siblingSubmenu) {
                  siblingSubmenu.classList.remove("current");
                }
              }
            });
            boxContainerNav.classList.remove("current");

            targetBox.classList.toggle("current");

            const isActive = Array.from(allTargetBoxes).some((box) =>
              box.classList.contains("current")
            );

            if (isActive) {
              boxContainerNav.classList.add("current");
            }

            if (submenu) {
              submenu.classList.toggle("current");
            }
          }
        });
      }
    });
});


  function translateTextElements(translations) {
    var siteprosElements = document.querySelectorAll('.sitedetails .sitepros span');
    for (var i = 0; i < siteprosElements.length; i++) {
      var text = siteprosElements[i].textContent.trim();
      if (translations.hasOwnProperty(text)) {
        siteprosElements[i].innerHTML = translations[text] + ' <i class="bi bi-caret-down-fill"></i>';
      }
    }
  
    var ratingwayElements = document.querySelectorAll('.ratingthings .ratingway span, .content button, .boxreview .plusminus .criteria .par p, .features .featuresbox .typesinside a, .instruction li');
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
      "Items Accepts": "Принимаются Предметы",
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
      "Sign up via Steam": "Залогиньтесь через Steam",
      "Done!": "Готово !",
      "Visit WebSite": "Посетить Сайт"
    };
    translateTextElements(translations);
  
    const reviewlinks = document.querySelector('.boxreview');
    updateURLs(reviewlinks)

  }
  
  if (window.location.pathname.includes('/tr/reviews/')) {
    var translations = {
      "Deposit Methods": "Yatırma Yöntemleri",
      "Withdraw Methods": "Çekim Yöntemleri",
      "Sign Up Bonus": "Kayıt Bonusu",
      "No Bonus": "Bonus Yok",
      "Faucet System": "Musluk Sistemi",
      "Daily Rewards": "Günlük Ödüller",
      "Daily Giveaways": "Günlük Çekilişler",
      "Deposit Bonus": "Depozit Bonusu",
      "Rain System": "Yağmur Sistemi",
      "Rakeback System": "Rakeback Sistemi",
      "Pros": "Artılar",
      "Price": "Fiyat",
      "Cons": "Eksiler",
      "Trust": "Güven",
      "Support": "Destek",
      "Payments": "Ödemeler",
      "Functional": "Fonksiyonel",
      "Sign up via Steam": "Steam ile Kayıt Ol",
      "Done!": "Keyfini Çıkar!",
      "Playability": "Oynanabilirlik",
      "Items Accepts": "Kabul Edilen Eşyalar",
      "Visit WebSite": "Web Sitesini Ziyaret Et"
    };
    translateTextElements(translations);

    const reviewlinks = document.querySelector('.boxreview');
    updateURLs(reviewlinks)
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
      "Done!": "Ciesz się!",
      "Visit WebSite": "Odwiedź stronę internetową"
    };
    translateTextElements(translations);
  }
  
  if (
    !window.location.pathname.endsWith("404") &&
    !window.location.pathname.includes("/mirrors/") &&
    !window.location.pathname.includes("/reviews/") &&
    !window.location.pathname.includes("/topic") &&
    window.location.pathname !== "/ru" &&
    window.location.pathname !== "/pt" &&
    window.location.pathname !== "/es" &&
    window.location.pathname !== "/tr" &&
    window.location.pathname !== "/hi" &&
    !window.location.pathname.endsWith("/ru.html") &&
    !window.location.pathname.endsWith("/pt.html") &&
    !window.location.pathname.endsWith("/es.html") &&
    !window.location.pathname.endsWith("/tr.html") &&
    !window.location.pathname.endsWith("/hi.html") &&
    !window.location.pathname.endsWith("/404.html") &&
    !window.location.pathname.endsWith("/index.html") &&
    !window.location.pathname.endsWith("/")
  ) {
    var currentLanguage = languageTag;
    var supportedLanguages = ["en", "ru", "pt", "es", "tr", "hi"];
    var langMenuDiv = document.querySelector(".lang-menu");
    
    function createLanguageListItem(lang, path) {
      return '<li><a href="' + path + '" class="lang-switch" data-lang="' + lang + '">' + lang.toUpperCase() + '</a></li>';
    }
    
    function checkAndAddLanguage(lang) {
      var path = lang === "en" ? window.location.pathname.replace(/^\/[a-z]{2}\//, "/") : "/" + lang + window.location.pathname.replace(/^\/[a-z]{2}\//, "/");
      
      fetch(path, { method: 'HEAD' }).then(function(response) {
        if (response.ok && currentLanguage !== lang) {
          langMenuDiv.querySelector("ul").innerHTML += createLanguageListItem(lang, path);
        }
      });
    }
    
    var newContent = '<div class="selected-lang">' + currentLanguage.toUpperCase() + '</div><ul>';
    langMenuDiv.innerHTML = newContent;
    
    supportedLanguages.forEach(function(lang) {
      checkAndAddLanguage(lang);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (
      !window.location.pathname.includes("/skins/") &&
      !window.location.pathname.includes("/items/") &&
      !window.location.pathname.includes("/cases/") &&
      !window.location.pathname.includes("/sticker-crafts/") &&
      !window.location.pathname.includes("/reviews") &&
      !window.location.pathname.includes("/mirrors") &&
      !window.location.pathname.includes("/privacy-policy") &&
      !window.location.pathname.includes("/terms-of-service") &&
      !window.location.pathname.includes("/contact-us")
    ) {
      const boxContainer = document.querySelector(".category-selector");
      const SpaceboxContainer = document.querySelector(".category-space");
      const buttonsContainer = document.createElement("div");
      const prevButtonContainer = document.createElement("button");
      const nextButtonContainer = document.createElement("button");
      const boxes = boxContainer.querySelectorAll(".category-box");
      const boxWidth = boxes[0].offsetWidth + 2 * 9;
      const containerWidth = boxWidth * 4;
      let scrollPosition = 0;
      let buttonScrollPosition = 0;

      buttonsContainer.classList.add("buttons-container");
      prevButtonContainer.classList.add("controls-button");
      prevButtonContainer.setAttribute("aria-label", "Prev Category");
      prevButtonContainer.innerHTML = '<i class="bi bi-chevron-left"></i>';
      nextButtonContainer.classList.add("controls-button");
      nextButtonContainer.setAttribute("aria-label", "Next Category");
      nextButtonContainer.innerHTML = '<i class="bi bi-chevron-right"></i>';
  
      buttonsContainer.appendChild(prevButtonContainer);
      buttonsContainer.appendChild(nextButtonContainer);
  
      boxContainer.parentNode.insertBefore(buttonsContainer, SpaceboxContainer);
  
      boxContainer.style.width = `${containerWidth}px`;
  
      prevButtonContainer.addEventListener("click", () => {
        scrollPosition -= boxWidth;
        scrollPosition = Math.max(scrollPosition, 0);
        boxContainer.scroll({ left: scrollPosition, behavior: "smooth" });
        buttonScrollPosition = scrollPosition;
      });
  
      nextButtonContainer.addEventListener("click", () => {
        scrollPosition += boxWidth;
        scrollPosition = Math.min(
          scrollPosition,
          boxContainer.scrollWidth - containerWidth
        );
        boxContainer.scroll({ left: scrollPosition, behavior: "smooth" });
        buttonScrollPosition = scrollPosition;
      });

      let isMouseDown = false;
      let startX = 0;
      let scrollLeft = 0;


      boxContainer.addEventListener("click", (e) => {
        const targetBox = e.target.closest(".category-box");
    
        if (targetBox) {
            const parentListItem = targetBox.closest("li");
            const submenu = parentListItem.querySelector(".submenu");
            
            const isTargetBoxNewest = targetBox.classList.contains("newest");
    
            if (!isTargetBoxNewest && window.innerWidth <= 1340) {
                e.preventDefault();
            }
    
            const allTargetBoxes = document.querySelectorAll(".category-box");
            allTargetBoxes.forEach((box) => {
                if (box !== targetBox) {
                    box.classList.remove("current");
                    const parentListItem = box.closest("li");
                    const siblingSubmenu = parentListItem.querySelector(".submenu");
                    if (siblingSubmenu) {
                        siblingSubmenu.classList.remove("current");
                    }
                }
            });
            boxContainer.classList.remove("current");
    
            targetBox.classList.toggle("current");
    
            const isActive = Array.from(allTargetBoxes).some((box) =>
                box.classList.contains("current")
            );
    
            categorySelector.addEventListener('click', function(event) {
              if (event.target === categorySelector) {
                const boxescurrent = boxContainer.querySelectorAll('.category-box.current');
                const submenucurrent = boxContainer.querySelectorAll('.submenu.current');
                boxContainer.classList.remove('current');
            
                boxescurrent.forEach(function(box) {
                  box.classList.remove('current');
                });

                submenucurrent.forEach(function(box) {
                  box.classList.remove('current');
                });
                
              }
            });

            if (isActive) {
                boxContainer.classList.add("current");
            }
    
            if (submenu) {
                submenu.classList.toggle("current");
            }
        }
    });
    
    
      boxContainer.addEventListener("scroll", () => {
        if (boxContainer.scrollLeft === 0) {
          prevButtonContainer.classList.add("disabled");
        } else {
          prevButtonContainer.classList.remove("disabled");
        }
  
        const maxScrollLeft =
          boxContainer.scrollWidth - boxContainer.clientWidth;
        if (boxContainer.scrollLeft >= maxScrollLeft - 1) {
          nextButtonContainer.classList.add("disabled");
        } else {
          nextButtonContainer.classList.remove("disabled");
        }
      });
  
      if (boxContainer.scrollLeft === 0) {
        prevButtonContainer.classList.add("disabled");
      }
      const maxScrollLeft = boxContainer.scrollWidth - boxContainer.clientWidth;
      if (boxContainer.scrollLeft >= maxScrollLeft - 1) {
        nextButtonContainer.classList.add("disabled");
      }
  
      boxContainer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isMouseDown = true;
        startX = e.pageX - boxContainer.offsetLeft;
        scrollLeft = boxContainer.scrollLeft;
      });
  
      boxContainer.addEventListener("mousemove", (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const x = e.pageX - boxContainer.offsetLeft;
        const walk = (x - startX) * 0.6;
        const newScrollLeft = scrollLeft - walk;
        boxContainer.scrollLeft = newScrollLeft;
        buttonScrollPosition = newScrollLeft;
      });
  
      boxContainer.addEventListener("mouseup", () => {
        isMouseDown = false;
      });
  
      boxContainer.addEventListener("mouseleave", () => {
        isMouseDown = false;
      });
  
      boxContainer.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        isMouseDown = true;
        startX = touch.pageX - boxContainer.offsetLeft;
        scrollLeft = boxContainer.scrollLeft;
      });
  
      boxContainer.addEventListener("touchmove", (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.pageX - boxContainer.offsetLeft;
        const walk = (x - startX) * 1.2;
        const newScrollLeft = scrollLeft - walk;
        boxContainer.scrollLeft = newScrollLeft;
        buttonScrollPosition = newScrollLeft;
      });
  
      boxContainer.addEventListener("touchend", () => {
        isMouseDown = false;
      });
  
      var categorySelector = document.querySelector("div.category-selector");
      var ulElements = categorySelector.querySelectorAll(
        "div.category-selector > ul"
      );
      var ulArray = Array.from(ulElements);
  
      ulArray.sort(function (a, b) {
        var aIsActive = a
          .querySelector("li a.category-box, li div.category-box")
          .classList.contains("active");
        var bIsActive = b
          .querySelector("li a.category-box, li div.category-box")
          .classList.contains("active");
  
        if (aIsActive && !bIsActive) {
          return -1;
        } else if (!aIsActive && bIsActive) {
          return 1;
        } else if (
          a.querySelector("li a.category-box, li div.category-box").classList.contains("last")
        ) {
          return 1;
        } else if (
          b.querySelector("li a.category-box, li div.category-box").classList.contains("last")
        ) {
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
  });

  

var ratingsumm = document.querySelector(".ratingsumm");
var sitealternates = document.querySelector(".sitealternates");

if (ratingsumm && sitealternates) {
  ratingsumm.parentNode.insertBefore(
    sitealternates,
    ratingsumm.nextSibling
  );
}

$('.sitepros').click(function() {
  $(this).toggleClass("active");
  if ($(window).width() >= 1340) {
      var $methodlist = $(this).find('.methodlist');
      var methodlistHeight = $methodlist.outerHeight(true);
      var totalHeight = $(this).height() + methodlistHeight;
      var $parent = $(this).parent('.sitedetails');
      var $otherActiveSitepros = $(this).siblings('.sitepros.active');
      var currentHeight = parseInt($parent.css('height'));
      if ($(this).hasClass("active")) {
          if (currentHeight < totalHeight) {
              $parent.css('height', totalHeight + 'px');
          }
      } else if ($otherActiveSitepros.length === 0) {
          $parent.css('height', '');
      }
  }
});

$(document).ready(function(){
  $('.screens').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    speed: 450,
    autoplaySpeed: 5500,
    pauseOnHover: true,
    pauseOnDotsHover: true,
    prevArrow: '<button aria-label="Prev Slide" class="prev-button"><i class="bi bi-chevron-left"></i></button>',
    nextArrow: '<button aria-label="Next Slide" class="next-button"><i class="bi bi-chevron-right"></i></button>',
    dots: true
  });
});

  const backToTopButton = document.querySelector("#back-to-top-btn");
  
  window.addEventListener("scroll", scrollFunction);
  
  function scrollFunction() {
    if (window.pageYOffset > 300) {
      if(!backToTopButton.classList.contains("btnEntrance")) {
        backToTopButton.classList.remove("btnExit");
        backToTopButton.classList.add("btnEntrance");
      }
    }
    else { 
      if(backToTopButton.classList.contains("btnEntrance")) {
        backToTopButton.classList.remove("btnEntrance");
        backToTopButton.classList.add("btnExit");
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
  
  var siteTranslations = {
    '/topic/skins/black-skins': {
      'en': 'Black Color Skins',
      'ru': 'Черные Скины'
    },
    '/topic/skins/gray-skins': {
      'en': 'Gray Color Skins',
      'ru': 'Серые Скины'
    },
    '/topic/skins/cyan-skins': {
      'en': 'Cyan Color Skins',
      'ru': 'Голубые Скины'
    },
    '/topic/skins/pink-skins': {
      'en': 'Pink Color Skins',
      'ru': 'Розовые Скины'
    },
    '/topic/skins/white-skins': {
      'en': 'White Color Skins',
      'ru': 'Белые Скины'
    },
    '/topic/skins/orange-skins': {
      'en': 'Orange Color Skins',
      'ru': 'Оранжевые Скины'
    },
    '/topic/skins/brown-skins': {
      'en': 'Brown Color Skins',
      'ru': 'Коричневые Скины'
    },
    '/topic/skins/yellow-skins': {
      'en': 'Yellow Color Skins',
      'ru': 'Желтые Скины'
    },
    '/topic/skins/blue-skins': {
      'en': 'Blue Color Skins',
      'ru': 'Синие Скины'
    },
    '/topic/skins/purple-skins': {
      'en': 'Purple Color Skins',
      'ru': 'Фиолетовые Скины'
    },
    '/topic/skins/green-skins': {
      'en': 'Green Color Skins',
      'ru': 'Зеленые Скины'
    },
    '/topic/skins/golden-skins': {
      'en': 'Golden Color Skins',
      'ru': 'Золотые Скины'
    },
    '/topic/skins': {
      'en': 'Skins By Color',
      'ru': 'Скины по Цвету'
    },
    '/topic/items': {
      'en': 'Skins By Weapon Types',
      'ru': 'Скины по Типу Оружия'
    },
    '/topic/sticker-crafts': {
      'en': 'Crafts with Stickers',
      'ru': 'Крафты со Стикерами'
    },
    '/newest': {
      'en': 'Newest Sites',
      'ru': 'Новые Сайты'
    },
    '/dota': {
      'en': 'Dota 2 Sites',
      'ru': 'Сайты Dota 2'
    },
    '/': {
      'en': 'CS:GO Sites',
      'ru': 'Сайты CS:GO'
    },
    '/rust': {
      'en': 'Rust Sites',
      'ru': 'Сайты Rust'
    },
    '/freebies': {
      'en': 'Sites with Freebies',
      'ru': 'Сайты с Бонусами'
    },
  };
  
  var sites   = [
    '<li><a href="/topic/skins/black-skins">Black Color Skins</a></li>',
    '<li><a href="/topic/skins/gray-skins">Gray Color Skins</a></li>',
    '<li><a href="/topic/skins/cyan-skins">Cyan Color Skins</a></li>',
    '<li><a href="/topic/skins/pink-skins">Pink Color Skins</a></li>',
    '<li><a href="/topic/skins/white-skins">White Color Skins</a></li>',
    '<li><a href="/topic/skins/orange-skins">Orange Color Skins</a></li>',
    '<li><a href="/topic/skins/brown-skins">Brown Color Skins</a></li>',
    '<li><a href="/topic/skins/yellow-skins">Yellow Color Skins</a></li>',
    '<li><a href="/topic/skins/blue-skins">Blue Color Skins</a></li>',
    '<li><a href="/topic/skins/purple-skins">Purple Color Skins</a></li>',
    '<li><a href="/topic/skins/green-skins">Green Color Skins</a></li>',
    '<li><a href="/topic/skins/golden-skins">Golden Color Skins</a></li>',
    '<li><a href="/topic/skins">Skins By Color</a></li>',
    '<li><a href="/topic/items">Skins By Weapon Types</a></li>',
    '<li><a href="/topic/sticker-crafts">Crafts with Stickers</a></li>',
    '<li><a href="/newest">Newest Sites</a></li>',
    '<li><a href="/dota">Dota 2 Sites</a></li>',
    '<li><a href="/">CS:GO Sites</a></li>',
    '<li><a href="/rust">Rust Sites</a></li>',
    '<li><a href="/freebies">Sites with Freebies</a></li>',
    '<li><a href="/reviews/rustly">Rustly</a></li>',
    '<li><a href="/ru/reviews/skinsly">SKINSLY</a></li>',
    '<li><a href="/reviews/rapidskins">RAPIDSKINS</a></li>',
    '<li><a href="/reviews/itradegg">iTrade.GG</a></li>',
    '<li><a href="/reviews/rustmagic">RustMagic</a></li>',
    '<li><a href="/reviews/idle-empire">Idle-empire</a></li>',
    '<li><a href="/reviews/insanegg">Insanegg</a></li>',
    '<li><a href="/reviews/key-drop">Key-drop</a></li>',
    '<li><a href="/reviews/knifex">Knifex</a></li>',
    '<li><a href="/reviews/lis-skins">Lis-skins</a></li>',
    '<li><a href="/reviews/moonmarket">Moon.Market</a></li>',
    '<li><a href="/reviews/avanmarket">Avan.Market</a></li>',
    '<li><a href="/reviews/aimmarket">Aim.Market</a></li>',
    '<li><a href="/reviews/lootbear">Lootbear</a></li>',
    '<li><a href="/reviews/lootfarm">Lootfarm</a></li>',
    '<li><a href="/reviews/primedice">Primedice</a></li>',
    '<li><a href="/reviews/rollbit">Rollbit</a></li>',
    '<li><a href="/reviews/roobet">Roobet</a></li>',
    '<li><a href="/reviews/rustbet">Rustbet</a></li>',
    '<li><a href="/reviews/rustcases">Rustcases</a></li>',
    '<li><a href="/reviews/rustchance">Rustchance</a></li>',
    '<li><a href="/reviews/rustclash">Rustclash</a></li>',
    '<li><a href="/reviews/dotaclash">Dotaclash</a></li>',
    '<li><a href="/reviews/bounty-stars">Bounty Stars</a></li>',
    '<li><a href="/reviews/rustmoment">Rustmoment</a></li>',
    '<li><a href="/reviews/csgostake">CSGOStake</a></li>',
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
    '<li><a href="/reviews/skinfans">Skinfans</a></li>',
    '<li><a href="/reviews/steamgifts">Steamgifts</a></li>',
    '<li><a href="/reviews/steamlvlup">Steamlvlup</a></li>',
    '<li><a href="/reviews/swapgg">Swapgg</a></li>',
    '<li><a href="/reviews/tradeit">Tradeit</a></li>',
    '<li><a href="/reviews/vvvgamers">Vvvgamers</a></li>',
    '<li><a href="/reviews/xplay">Xplay</a></li>',
    '<li><a href="/reviews/banditcamp">Banditcamp</a></li>',
    '<li><a href="/reviews/bcgame">Bcgame</a></li>',
    '<li><a href="/reviews/bets4pro">Bets4pro</a></li>',
    '<li><a href="/reviews/bitskins">Bitskins</a></li>',
    '<li><a href="/reviews/bitskins-p2p">Bitskins p2p</a></li>',
    '<li><a href="/reviews/clashgg">Clashgg</a></li>',
    '<li><a href="/reviews/csmoney">CS.Money</a></li>',
    '<li><a href="/reviews/csdeals">CS.Deals</a></li>',
    '<li><a href="/reviews/csgo500">CSGO500</a></li>',
    '<li><a href="/reviews/csgobig">CSGOBig</a></li>',
    '<li><a href="/reviews/csgoempire">CSGOEmpire</a></li>',
    '<li><a href="/reviews/csgofast">CSGOFast</a></li>',
    '<li><a href="/reviews/csgoluck">CSGOLuck</a></li>',
    '<li><a href="/reviews/csgo-market">CSGO-Market</a></li>',
    '<li><a href="/reviews/csgopolygon">CSGOPolygon</a></li>',
    '<li><a href="/reviews/csgopositive">CSGOPositive</a></li>',
    '<li><a href="/reviews/csgoroll">CSGORoll</a></li>',
    '<li><a href="/reviews/csgoselly">CSGOSelly</a></li>',
    '<li><a href="/reviews/csgorun">CSGORUN</a></li>',
    '<li><a href="/reviews/csfail">CSFAIL</a></li>',
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
  ];
  
  function compareSites(a, b) {
    var siteNameA = a.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
    var siteNameB = b.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
    var searchTerm = searchInput.value.toLowerCase();
  
    var indexA = siteNameA.indexOf(searchTerm);
    var indexB = siteNameB.indexOf(searchTerm);
  
    if (indexA === 0 && indexB !== 0) {
      return -1;
    } else if (indexB === 0 && indexA !== 0) {
      return 1;
    } else {
      return siteNameA.localeCompare(siteNameB);
    }
  }
  
  
  function updateSiteList() {
    siteList.innerHTML = '';
    sites.forEach(function (site) {
      var li = document.createElement('li');
      li.className = 'site-item';
      li.style.display = 'none';
      li.innerHTML = site;
  
      var link = li.querySelector('a');
      var href = link.getAttribute('href');
  
      if (siteTranslations[href]) {
        link.innerHTML = isRussianPage ? siteTranslations[href]['ru'] : siteTranslations[href]['en'];
      }
  
      if (isRussianPage) {
        link.setAttribute('href', '/ru' + href);
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
  
      if (
        siteName.includes(searchTerm) ||
        siteName.includes(' ' + searchTerm)
      ) {
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
        
        document.addEventListener('DOMContentLoaded', function() {
          document.querySelector('.search-enabler').addEventListener('click', function() {
              document.querySelector('#search-input').classList.add('active');
              this.classList.add('disabled');
              document.querySelector('.search-container').classList.add('expanded');
          });
      });
    
    {        
        function translateURLs2(parentElement, languageTag) {
          var links = parentElement.querySelectorAll("a[href]");
          var supportedLanguages = ["hi", "tr", "pt", "es", "ru"];
      
          for (var i = 0; i < links.length; i++) {
              var href = links[i].getAttribute("href");
      
              if (!href) continue;
      
              var url = new URL(href, window.location.href);
              var path = url.pathname;
              var langIncluded = supportedLanguages.some((lang) => {
                  var langWithSlashes = "/" + lang + "/";
                  return path.includes(langWithSlashes);
              });
      
              if (languageTag !== "en") {
                if ((languageTag === "ru" && path.includes("/topic")) || (!path || path === "/")) {
                    url.pathname = "/" + languageTag + path;
                    links[i].setAttribute("href", url.href);
                } else if (!path.includes("/topic") && !langIncluded && supportedLanguages.includes(languageTag)) {
                    path = "/" + languageTag + path;
                    url.pathname = path;
                    links[i].setAttribute("href", url.href);
                }
            }
            
          }      
      
          var translations = {
            "ru": {
              "CS2 Sites List": "Сайты CS2",
              "Rust Sites List": "Сайты Rust",
              "Dota 2 Sites List": "Сайты Dota 2",
              "Crypto Sites List": "Крипто-Сайты",
              "Newest Sites": "Новые Сайты",
              "Freebies Only": "Все Бонусы",
              "Earning Sites": "Заработок",
              "Steam Sites": "Сайты Steam",
              "Gambling Sites": "Гемблинг Сайты",
              "Earn by Play CS2": "Заработок на Игре в CS2",
              "Others": "Остальное",
              "Skins By Color": "Скины по Цвету",
              "Skins By Weapon Types": "Скины по Типу Оружия",
              "Sticker-Crafts": "Крафты со Стикерами",
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
              "Top Up Steam": "Пополнить Баланс Steam",
              "Buy Steam Games": "Купить Игры Steam",
              "Case Battle": "Кейс Батл"
            },
            "hi": {
              "CS2 Sites List": "CS2 साइटों की सूची",
              "Rust Sites List": "Rust साइटों की सूची",
              "Dota 2 Sites List": "डोटा 2 साइटों की सूची",
              "Crypto Sites List": "क्रिप्टो साइटों की सूची",
              "Newest Sites": "सबसे नई साइटें",
              "Freebies Only": "केवल मुफ्त आइटम",
              "Earning Sites": "आमदनी वाली साइटें",
              "Steam Sites": "स्टीम से संबंधित साइटें",
              "Gambling Sites": "जुआ खेलने के लिए साइटें",
              "Earn by Play CS2": "CS2 खेलकर कमाएं",
              "Others": "अन्य",
              "Skins By Color": "रंग द्वारा स्किनें",
              "Skins By Weapon Types": "हथियार के प्रकार द्वारा स्किनें",
              "Sticker-Crafts": "स्टिकर्स के साथ क्राफ्ट",
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
              "Top Up Steam": "स्टीम रिचार्ज करें",
              "Buy Steam Games": "स्टीम गेम्स खरीदें"
            },
            "pt": {
              "CS2 Sites List": "Sites de CS2",
              "Rust Sites List": "Sites de Rust",
              "Dota 2 Sites List": "Sites de Dota 2",
              "Crypto Sites List": "Sites de Crypto",
              "Newest Sites": "Sites Mais Recentes",
              "Freebies Only": "Apenas Brindes",
              "Earning Sites": "Sites para Ganhar",
              "Steam Sites": "Sites do Steam",
              "Gambling Sites": "Sites de Jogos de Azar",
              "Earn by Play CS2": "Ganhe Jogando CS2",
              "Others": "Outros",
              "Skins By Color": "Skins por Cor",
              "Skins By Weapon Types": "Skins por Tipo de Arma",
              "Sticker-Crafts": "Artesanatos com Stickers",
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
              "Top Up Steam": "Recarregar Steam",
              "Buy Steam Games": "Comprar Jogos do Steam"
            },
            "tr": {
              "CS2 Sites List": "CS2 Siteleri Listesi",
              "Rust Sites List": "Rust Siteleri Listesi",
              "Dota 2 Sites List": "Dota 2 Siteleri Listesi",
              "Crypto Sites List": "Kripto Siteleri Listesi",
              "Newest Sites": "En Yeni Siteler",
              "Freebies Only": "Sadece Bedava Hediyeler",
              "Earning Sites": "Para Kazanma Siteleri",
              "Steam Sites": "Steam Siteleri",
              "Gambling Sites": " Kumar Siteleri",
              "Earn by Play CS2": "CS2 Oynayarak Kazan",
              "Others": "Diğerleri",
              "Skins By Color": "Renklerine Göre Skinler",
              "Skins By Weapon Types": "Silah Türlerine Göre Skinler",
              "Sticker-Crafts": "Stickerlı Craftlar",
              "All Sites": "Tüm Siteler",
              "Match Betting": "Maç Bahisleri",
              "Case Opening": "Kasa Açma",
              "Roulette": "Rulet",
              "Coinflip": "Tura-Yazı",
              "Crash": "Çökme",
              "Casino": "Kumarhane",
              "Jackpot": "Jackpot",
              "Upgrader": "Yükseltici",
              "Dice": "Zar",
              "Bonus Types": "Bonus Türleri",
              "Sign Up Bonuses": "Kayıt Bonusları",
              "Deposit Bonuses": "Yatırım Bonusları",
              "Daily Rewards": "Günlük Ödüller",
              "Giveaways": "Hediyeler",
              "Offerwall Sites": "Teklif Duvarı Siteleri",
              "Earn by Play Sites": "Oyun Oynayarak Kazan Siteleri",
              "Buy or Sell Skins": "Skins Satın Al veya Sat",
              "Buy or Sell Items": "Eşya Satın Al veya Sat",
              "Marketplaces": "Pazar Yerleri",
              "Instant Sell": "Anında Satış",
              "Buy Items": "Eşya Satın Al",
              "Sell Items": "Eşya Sat",
              "Trade Items": "Eşya Takas Et",
              "Buy Skins": "Skins Satın Al",
              "Sell Skins": "Skins Sat",
              "Trade Skins": "Skins Takas Et",
              "Steam Level Up": "Steam Seviye Atlama",
              "Top Up Steam": "Steam Bakiye Yükle",
              "Buy Steam Games": "Steam Oyunları Satın Al"
            },
            "es": {
              "CS2 Sites List": "Lista de sitios de CS2",
              "Rust Sites List": "Lista de sitios de Rust",
              "Dota 2 Sites List": "Lista de sitios de Dota 2",
              "Crypto Sites List": "Lista de sitios de criptomonedas",
              "Newest Sites": "Sitios Más Nuevos",
              "Freebies Only": "Solo regalos gratis",
              "Earning Sites": "Sitios para ganar dinero",
              "Steam Sites": "Sitios de Steam",
              "Gambling Sites": "Sitios de apuestas",
              "Earn by Play CS2": "Gana jugando CS2",
              "Others": "Otros",
              "Skins By Color": "Skins por Color",
              "Skins By Weapon Types": "Skins por Tipo de Arma",
              "Sticker-Crafts": "Manualidades con Stickers",
              "All Sites": "Todos los sitios",
              "Match Betting": "Apuestas de partidos",
              "Case Opening": "Apertura de estuches",
              "Roulette": "Ruleta",
              "Coinflip": "Lanzamiento de moneda",
              "Crash": "Choque",
              "Casino": "Casino",
              "Jackpot": "Bote",
              "Upgrader": "Actualizador",
              "Dice": "Dados",
              "Bonus Types": "Tipos de bonos",
              "Sign Up Bonuses": "Bonos de registro",
              "Deposit Bonuses": "Bonos de depósito",
              "Daily Rewards": "Recompensas diarias",
              "Giveaways": "Regalos",
              "Offerwall Sites": "Sitios de oferta",
              "Earn by Play Sites": "Sitios para ganar jugando",
              "Buy or Sell Skins": "Comprar o vender skins",
              "Buy or Sell Items": "Comprar o vender objetos",
              "Marketplaces": "Mercados",
              "Instant Sell": "Venta instantánea",
              "Buy Items": "Comprar objetos",
              "Sell Items": "Vender objetos",
              "Trade Items": "Intercambiar objetos",
              "Buy Skins": "Comprar skins",
              "Sell Skins": "Vender skins",
              "Trade Skins": "Intercambiar skins",
              "Steam Level Up": "Aumentar nivel de Steam",
              "Top Up Steam": "Recargar Steam",
              "Buy Steam Games": "Comprar juegos de Steam"
            },
          };
      
          var elements = document.querySelectorAll('.category-box-content span, ul .submenu li a, ul .submenu li .nonredir');
          for (var j = 0; j < elements.length; j++) {
            var text = elements[j].textContent.trim();
            if (translations[languageTag] && translations[languageTag].hasOwnProperty(text)) {
              if (!elements[j].classList.contains('translated')) {
                if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
                  elements[j].innerHTML = translations[languageTag][text] + ' <i class="bi bi-caret-right-fill"></i>';
                } else {
                  elements[j].innerHTML = translations[languageTag][text];
                }
                elements[j].classList.add('translated');
              }
            } else if (languageTag === "en" && elements[j].parentNode.classList.contains('category-box-content')) {
              elements[j].classList.add('translated');
            }
          }
        }
        
        var categorySelector = document.querySelector('.category-selector');
        if (categorySelector !== null) {
          translateURLs2(categorySelector, languageTag);
      }
    }
      window.onload = function () {
        (function () {
            if (
                (window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html') &&
                !window.location.pathname.includes('/ru/reviews') &&
                !window.location.pathname.includes('/ru/mirrors') &&
                !window.location.pathname.includes('/ru/topic') &&
                !window.location.pathname.includes("/privacy-policy") &&
                !window.location.pathname.includes("/terms-of-service") &&
                !window.location.pathname.includes("/contact-us")
            ) {
                var boxesHolders = document.querySelectorAll('div.buttons-container-page');
    
                if (!document.querySelector('#button-vpn-filter')) {
                    var button = document.createElement('div');
                    button.className = 'settings-menu';
                    button.innerHTML =
                        '<a class="settings-button" id="button-vpn-filter" data-title="Скрыть сайты требующие VPN"><i id="vpn-icon" class="bi bi-eye"></i></a>';
    
                    boxesHolders.forEach(function (boxesHolder) {
                        boxesHolder.insertBefore(button.cloneNode(true), boxesHolder.firstChild);
                    });
    
                    var vpnIcon = document.getElementById('vpn-icon');
    
                    function toggleVpnBlocks() {
                        var vpnBlocks = document.querySelectorAll('.box');
                        vpnBlocks.forEach(function (block) {
                            var hasVpn = block.querySelector('.vpn');
                            if (hasVpn) {
                                block.style.display = block.style.display === 'none' ? '' : 'none';
                            }
                        });
                    }
    
                    var buttonState = localStorage.getItem('vpnButtonState');
                    var buttonTitle = localStorage.getItem('vpnButtonTitle');
    
                    if (buttonState === 'hidden') {
                        toggleVpnBlocks();
                        vpnIcon.classList.remove('bi-eye');
                        vpnIcon.classList.add('bi-eye-slash');
                    }
    
                    if (buttonTitle) {
                        document.getElementById('button-vpn-filter').dataset.title = buttonTitle;
                    }
    
                    document.getElementById('button-vpn-filter').addEventListener('click', function () {
                        toggleVpnBlocks();
    
                        var buttonState = localStorage.getItem('vpnButtonState') || 'visible';
    
                        var newButtonState = buttonState === 'hidden' ? 'visible' : 'hidden';
                        localStorage.setItem('vpnButtonState', newButtonState);
    
                        vpnIcon.classList.toggle('bi-eye');
                        vpnIcon.classList.toggle('bi-eye-slash');
    
                        var button = document.getElementById('button-vpn-filter');
                        if (vpnIcon.classList.contains('bi-eye')) {
                              button.dataset.title = 'Скрыть сайты требующие VPN';
                        } else {
                            button.dataset.title = 'Показать сайты требующие VPN';
                        }
    
                        localStorage.setItem('vpnButtonTitle', button.dataset.title);
                    });
                }
            }
        })(); 
    };
    
    document.addEventListener('DOMContentLoaded', function () {
      var replacementHTML = `
          <div class="contact">
              <a href="/contact-us" class="contact-box" id="contact">
                  <span>Contact Us</span>
              </a>
              <a href="/terms-of-service" class="contact-box" id="tos">
                  <span>Terms of Service</span>
              </a>
              <a href="/privacy-policy" class="contact-box" id="privacy">
                  <span>Privacy Policy</span>
              </a>
          </div>
      `;
  
      var isRussianPage = window.location.href.match(/\/ru(?:\.html)?(?:\/|$)/);
  
      if (isRussianPage) {
          replacementHTML = replacementHTML.replace(/href="\/(.*?)"/g, 'href="/ru/$1"');
      }
  
      var contactElement = document.querySelector('.contact');
      if (contactElement) {
          contactElement.innerHTML = replacementHTML;
      }
  });
  
const btnfaq = document.getElementById("toggle");

if (btnfaq) {
  btnfaq.onclick = function () {
    const targetDiv = document.getElementById("FAQ");

    if (targetDiv) {
      const targetDivComputedStyle = window.getComputedStyle(targetDiv);
      const targetDivPaddingTop = parseFloat(targetDivComputedStyle.paddingTop);
      const targetDivPaddingBottom = parseFloat(targetDivComputedStyle.paddingBottom);
      const targetDivHeight = targetDiv.scrollHeight + targetDivPaddingTop + targetDivPaddingBottom;

      const currentHeight = parseFloat(targetDiv.style.height) || 0;

      if (currentHeight === 0) {
        targetDiv.style.height = targetDivHeight * 2 + "px";
        btnfaq.classList.add("active");
        targetDiv.classList.add("active");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        targetDiv.style.height = "0px";
        btnfaq.classList.remove("active");
        targetDiv.classList.remove("active");
      }
    }
  };
}

const pathSegments = window.location.pathname.split('/');
const languagePrefix = pathSegments[1] || '';
const identifierIndex = pathSegments.indexOf('mirrors');
const isRussianVersion = languagePrefix === 'ru';

if (identifierIndex > 0) {
  const reviewsPath = `/${isRussianVersion ? languagePrefix + '/' : ''}reviews/${pathSegments[identifierIndex + 1]}`;

  fetch(reviewsPath)
    .then(response => response.text())
    .then(htmlContent => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      const updateElementContent = (selector, content) => {
        const targetElement = document.querySelector(selector);
        if (targetElement) {
          targetElement.innerHTML = content;
        }
      };

      updateElementContent('div.sitealternates', doc.querySelector('div.sitealternates').innerHTML);
      updateElementContent('.box.main', doc.querySelector('.box.main').innerHTML);
      updateElementContent('.features', doc.querySelector('.features').innerHTML);

      const updateLinks = (selector, path) => {
        const targetLinks = document.querySelectorAll(selector);
        targetLinks.forEach(link => {
          link.href = path;
        });
      };

      const reviewsPathForLinks = `/${isRussianVersion ? languagePrefix + '/' : ''}reviews/${pathSegments[identifierIndex + 1]}`;
      updateLinks('.box.main .logobg a', reviewsPathForLinks);

      if (isRussianVersion) {
        const updateAlternateLinks = () => {
          const alternateLinks = document.querySelectorAll('div.sitealternates .box .logobg a');
          alternateLinks.forEach(link => {
            const currentHref = link.getAttribute('href');
            const newHref = `/${isRussianVersion ? 'ru' : ''}${currentHref}`;
            link.href = newHref;
          });
        };

        updateAlternateLinks();
        addStarRatingToBoxesHolders();
      }
    });
}

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')) {
  
  
  var newDiv = document.createElement("div");
  newDiv.className = "vpn";
  newDiv.textContent = "Нужен VPN";

//   if (window.innerWidth < 1000) {
//     newDiv.textContent = "VPN";
// }

  var allowedIds = [
    "Clash",
    "CSGORoll",
    "DMarket",
    "Rollbit",
    "Primedice",
    "Duelbits",
    "FlameCases",
    "BCGame",
    "DaddySkins",
    "gcskins",
    "FarmSkins",
    "RustyPot",
    "vvvgamers",
  ];

  var boxElements = document.querySelectorAll(".box");

  boxElements.forEach(function(boxElement) {
      var boxId = boxElement.id;
      if (allowedIds.includes(boxId)) {
          var logobgElement = boxElement.querySelector(".logobg");
          if (logobgElement) {
              var clonedDiv = newDiv.cloneNode(true);
              logobgElement.appendChild(clonedDiv);
          }
      }
  });
}

if (window.location.pathname.includes("/items/") || window.location.pathname.includes("/cases/")) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var sitetoppannel = document.querySelector("div.sitetoppannel");
          var alltopic = document.querySelector("div.sitepage");

          if (sitetoppannel) {
              sitetoppannel.innerHTML = "";
              sitetoppannel.innerHTML = this.responseText;

              if (languageTag === 'ru') {
                var navBarLinks = document.querySelectorAll('div.sitetoppannel a');
                navBarLinks.forEach(function(link) {
                  var href = link.getAttribute('href');
                  if (href && href.indexOf('/ru/') !== 0) {
                    link.setAttribute('href', '/ru' + href);
                  }
                });
              }
          }

          if (alltopic) {
              alltopic.classList.add("fade-in-topic");
          }
      }
  };
  xhr.open("GET", "/code-parts/nav-bar-items.html", true);
  xhr.send();
}

  if (!window.location.pathname.endsWith("newest") &&
    !window.location.pathname.endsWith("newest.html") &&
    window.location.href.indexOf('/reviews/') === -1 &&
    window.location.href.indexOf('/mirrors/') === -1 && 
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/topic") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us")) {
    
    var newestBoxesDiv = document.createElement('div');
    newestBoxesDiv.classList.add('newest-boxes');
    
    var newestBoxesTitleDiv = document.createElement('div');
    newestBoxesTitleDiv.classList.add('newest-boxes-title');
    
    var newestBoxesTitleBoxDiv = document.createElement('div');
    newestBoxesTitleBoxDiv.classList.add('newest-boxes-title-box');
    var titleSpan = document.createElement('span');
    
    if (languageTag === 'ru' && !window.location.pathname.startsWith("/rust")) {
        titleSpan.textContent = 'Новые Сайты';
      } else if (languageTag === 'tr') {
        titleSpan.textContent = 'Yeni Eklenenler';
    } else if (languageTag === 'pt') {
        titleSpan.textContent = 'Recentemente Adicionados';
    } else if (languageTag === 'es') {
        titleSpan.textContent = 'Recientemente Añadidos';
    } else if (languageTag === 'hi') {
        titleSpan.textContent = 'हाल ही में जोड़ा गया';
    } else {
        titleSpan.textContent = 'Recently Added';
    }
    
    newestBoxesTitleBoxDiv.appendChild(titleSpan);
    newestBoxesTitleDiv.appendChild(newestBoxesTitleBoxDiv);
    newestBoxesDiv.appendChild(newestBoxesTitleDiv);
    
    var newestFragment = languageTag === 'ru' && !window.location.pathname.startsWith("/rust") ? '/code-parts/newest-ru.html' : '/code-parts/newest.html';
    
    fetch(newestFragment)
        .then(response => response.text())
        .then(data => {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
    
            var existingBoxIds = new Set();
            document.querySelectorAll('.boxes-holder .box').forEach(box => {
                existingBoxIds.add(box.id);
            });
    
            var boxes = tempDiv.querySelectorAll('.box');
            var addedCount = 0;
            for (var i = 0; i < boxes.length && addedCount < 4; i++) {
                if (!existingBoxIds.has(boxes[i].id)) {
                    newestBoxesDiv.appendChild(boxes[i].cloneNode(true));
                    addedCount++;
                }
            }
    
            var footerElement = document.querySelector('footer');
            var sliderContainer = document.querySelector('.slider-container');
    
            if (sliderContainer) {
                sliderContainer.parentNode.insertBefore(newestBoxesDiv, sliderContainer.nextSibling);
            } else {
                footerElement.parentNode.insertBefore(newestBoxesDiv, footerElement);
            }
    
            if (languageTag === 'ru' && !window.location.pathname.startsWith("/rust")) {
                updateURLs(newestBoxesDiv);
            }
        });      
}
function forcemodsboxes() {
  const cachedContent = {};
  const importedMods = {};
  const url = cleanUrl(window.location.href);
  const pageType = getPageType(url);

  switch (pageType) {
    case 'csgo':
      if (isMultiBoxPage(url)) {
        importModsBox("csgo-skins");
        importModsBox("csgo");
      } else {
        importModsBox("csgo");
      }
      break;
    case 'rust':
      if (isMultiBoxPage(url)) {
        importModsBox("rust-skins");
        importModsBox("rust");
      } else {
        importModsBox("rust");
      }
      break;
    case 'dota':
      if (isMultiBoxPage(url)) {
        importModsBox("dota-items");
        importModsBox("dota");
      } else {
        importModsBox("dota");
      }
      break;
    case 'tf2':
      importModsBox("tf2-items");
      break;
    case 'freebies':
      importModsBox("freebies");
      break;
    case 'crypto':
      importModsBox("crypto");
      break;
    default:
      if (url.includes("/csgo/") || url.endsWith("/ru") || url.endsWith("/es") || url.endsWith("/tr") || url.endsWith("/pt") || url.endsWith("/hi") || url.endsWith("/") || url.endsWith("index.html") || url.endsWith("/ru.html") || url.endsWith("/es.html") || url.endsWith("/tr.html") || url.endsWith("/pt.html") || url.endsWith("/hi.html")) {
        importModsBox("csgo");
      } else if (url.includes("/rust/") || url.endsWith("/rust") || url.endsWith("/rust.html")) {
        importModsBox("rust");
      } else if (url.includes("/dota/") || url.endsWith("/dota") || url.endsWith("/dota.html")) {
        importModsBox("dota");
      }
      break;
  }

  function importModsBox(boxId) {
    if (importedMods[boxId]) {
      return;
    }

    const existingContainer = document.querySelector('.boxes-holder');
    const isExistingContentCached = existingContainer && cachedContent[boxId];

    if (isExistingContentCached) {
      insertModsBox(existingContainer, boxId, cachedContent[boxId]);
    } else {
      let fileToFetch = '/code-parts/micro-parts/insert-mods-box.html';


      fetch(fileToFetch)
        .then(response => response.text())
        .then(data => {
          cachedContent[boxId] = data;
          insertModsBox(existingContainer, boxId, data);
          importedMods[boxId] = true;
        });
    }
  }

  function insertModsBox(container, boxId, data) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;

    const newModsBox = tempDiv.querySelector(`[data-box-id="${boxId}"]`);
    const existingModsBoxes = container.querySelectorAll('.mods-box');
    const existingBox = Array.from(existingModsBoxes).find(box => box.getAttribute('data-box-id') === boxId);

    if (existingBox) {
      container.replaceChild(newModsBox, existingBox);
    } else {
      container.insertBefore(newModsBox, container.firstChild);
    }

    const languageTag = extractLanguageTagFromHTML();
    if (languageTag && ['ru', 'tr', 'pt', 'hi', 'es'].includes(languageTag)) {
      const singlemodBoxes = newModsBox.querySelectorAll('.singlemod-box');
      singlemodBoxes.forEach(box => {
        translateElement(box, languageTag);
      });
    }

    setTimeout(() => {
      newModsBox.classList.add('fade-in-topic');
      const singlemodBoxes = newModsBox.querySelectorAll('.singlemod-box');
      singlemodBoxes.forEach(box => {
        const link = box.querySelector('a').getAttribute('href');
        if (url.includes(link)) {
          box.classList.add('active');
        }
      });
    }, 100);

    updateURLs(newModsBox);
  }

  function getPageType(url) {
    const pageTypes = ['csgo', 'rust', 'dota', 'tf2', 'freebies', 'crypto'];
    for (const type of pageTypes) {
      if (url.includes(`/${type}/`) || url.endsWith(`/${type}`) || url.endsWith(`/${type}.html`)) {
        return type;
      }
    }
    return 'other';
  }

  function cleanUrl(url) {
    return url.split('?')[0].toLowerCase();
  }

  function isMultiBoxPage(url) {
    const cleanUrlValue = cleanUrl(url);

    return cleanUrlValue.endsWith("/buy-skins") || cleanUrlValue.endsWith("/buy-items") || cleanUrlValue.endsWith("/sell-items") || cleanUrlValue.endsWith("/trade-items") || cleanUrlValue.endsWith("/sell-skins") || cleanUrlValue.endsWith("/trade-skins") || cleanUrlValue.endsWith("/instant-sell") || cleanUrlValue.endsWith("/marketplaces") || cleanUrlValue.endsWith("/buy-skins.html") || cleanUrlValue.endsWith("/buy-items.html") || cleanUrlValue.endsWith("/sell-items.html") || cleanUrlValue.endsWith("/trade-items.html") || cleanUrlValue.endsWith("/sell-skins.html") || cleanUrlValue.endsWith("/trade-skins.html") || cleanUrlValue.endsWith("/marketplaces.html") || cleanUrlValue.endsWith("/instant-sell.html");
  }

  function translateElement(element, languageTag) {
    const translations = {
      'Buy Skins': {
        'ru': 'Купить скины',
        'tr': 'Skinler Satın Al',
        'pt': 'Comprar Skins',
        'hi': 'स्किन्स खरीदें',
        'es': 'Comprar Skins'
      },
      'Sell Skins': {
        'ru': 'Продать скины',
        'tr': 'Skinler Sat',
        'pt': 'Vender Skins',
        'hi': 'स्किन्स बेचें',
        'es': 'Vender Skins'
      },
      'Trade Skins': {
        'ru': 'Обменять скины',
        'tr': 'Skinler Takas Et',
        'pt': 'Negociar Skins',
        'hi': 'स्किन्स विनिमय',
        'es': 'Intercambiar Skins'
      },
      'Buy Items': {
        'ru': 'Купить предметы',
        'tr': 'Eşyalar Satın Al',
        'pt': 'Comprar Itens',
        'hi': 'वस्तुएँ खरीदें',
        'es': 'Comprar Ítems'
      },
      'Sell Items': {
        'ru': 'Продать предметы',
        'tr': 'Eşyalar Sat',
        'pt': 'Vender Itens',
        'hi': 'वस्तुएँ बेचें',
        'es': 'Vender Ítems'
      },
      'Trade Items': {
        'ru': 'Обменять предметы',
        'tr': 'Eşyalar Takas Et',
        'pt': 'Negociar Itens',
        'hi': 'वस्तुएँ विनिमय',
        'es': 'Intercambiar Ítems'
      },
      'Instant Sell': {
        'ru': 'Моментальная продажа',
        'tr': 'Anlık Satış',
        'pt': 'Venda Imediata',
        'hi': 'त्वरित बेचें',
        'es': 'Venta Instantánea'
      },
      'Marketplaces': {
        'ru': 'Торговые Площадки',
        'tr': 'Pazarlar',
        'pt': 'Mercados',
        'hi': 'बाजार',
        'es': 'Mercados'
      },
      'Daily Rewards': {
        'ru': 'Ежедневные Награды',
        'tr': 'Günlük Ödüller',
        'pt': 'Recompensas Diárias',
        'hi': 'दैनिक पुरस्कार',
        'es': 'Recompensas Diarias'
      },
      'Deposit Bonuses': {
        'ru': 'Бонусы к Пополнению',
        'tr': 'Yatırım Bonusları',
        'pt': 'Bônus de Depósito',
        'hi': 'जमा बोनस',
        'es': 'Bonos de Depósito'
      },
      'Giveaways': {
        'ru': 'Розыгрыши',
        'tr': 'Çekilişler',
        'pt': 'Sorteios',
        'hi': 'गिफ्ट वे',
        'es': 'Sorteos'
      },
      'Sign Up Bonuses': {
        'ru': 'Бонусы за Регистрацию',
        'tr': 'Kayıt Bonusları',
        'pt': 'Bônus de Inscrição',
        'hi': 'साइन अप बोनस',
        'es': 'Bonos de Registro'
      },
      'Match Betting': {
        'ru': 'Ставки на Матчи',
        'tr': 'Maç Bahisleri',
        'pt': 'Apostas em Partidas',
        'hi': 'मैच सट्टेबाजी',
        'es': 'Apuestas en Partidos'
      },
    'Roulette': {
        'ru': 'Рулетка',
        'tr': 'Rulet',
        'pt': 'Roleta',
        'hi': 'रूले',
        'es': 'Ruleta'
      },
    'Case Opening': {
        'ru': 'Открытие Кейсов',
        'tr': 'Kasa Açma',
        'pt': 'Abertura de Caixas',
        'hi': 'केस खोलना',
        'es': 'Apertura de Cajas'
      },
    'Crash': {
        'ru': 'Краш',
        'tr': 'Çöküş',
        'pt': 'Queda',
        'hi': 'क्रैश',
        'es': 'Choque'
      },
    'Jackpot': {
        'ru': 'Джекпот',
        'tr': 'Büyük İkramiye',
        'pt': 'Jackpot',
        'hi': 'जैकपॉट',
        'es': 'Jackpot'
      },
    'Coinflip': {
        'ru': 'Монетка',
        'tr': 'Yazı Tura',
        'pt': 'Cara ou Coroa',
        'hi': 'सिक्का उछालना',
        'es': 'Lanzamiento de Moneda'
      }
    };

    const textElement = element.querySelector('.singlemod-select span');
    if (textElement) {
        const text = textElement.innerText.trim();

        const normalizeText = (text, lang) => {
            if (lang === 'tr') {
                return text.toLocaleLowerCase('tr-TR');
            }
            return text.toLowerCase();
        };

        const key = Object.keys(translations).find(key => normalizeText(key, languageTag) === normalizeText(text, languageTag));
        if (key && translations[key][languageTag]) {
            textElement.innerText = translations[key][languageTag];
        }
    }

    const dataTitle = element.getAttribute('data-title');
    if (dataTitle) {
        const normalizeText = (text, lang) => {
            if (lang === 'tr') {
                return text.toLocaleLowerCase('tr-TR');
            }
            return text.toLowerCase();
        };

        const key = Object.keys(translations).find(key => normalizeText(key, languageTag) === normalizeText(dataTitle, languageTag));
        if (key && translations[key][languageTag]) {
            element.setAttribute('data-title', translations[key][languageTag]);
        }
    }
}
}


$(document).ready(function() {

  var excludedPages = ['/terms-of-service', '/privacy-policy', '/contact-us'];
  var path = window.location.pathname;
  var excluded = false;
  excludedPages.forEach(function(excludedPage) {
    if (path.endsWith(excludedPage) || path.endsWith(excludedPage + '.html')) {
      excluded = true;
    }
  });
  if (excluded) {
    return;
  }

  var sliderItems = [
    { href: '/', src: '/img/best-gambling-sites-slide-2024.png', label: 'Best Gambling Sites' },
    { href: '/earning/offerwalls', src: '/img/earn-skins-slider-2024.png', label: 'Best Offerwall Sites' },
    { href: '/rust', src: '/img/best-rust-sites-slide-2024.png', label: 'Best Rust Sites' }
  ];

  if (languageTag === 'ru') {
    sliderItems = [
      { href: '/ru', src: '/img/best-gambling-sites-slide-2024-ru.png', label: 'Лучшие Гемблинг Сайты CS2' },
      { href: '/ru/earning/offerwalls', src: '/img/earn-skins-slider-2024-ru.png', label: 'Лучшие Сайты с Заданиями' },
      { href: '/ru/rust', src: '/img/best-rust-sites-slide-2024-ru.png', label: 'Лучшие Сайты Rust' }
    ];
  }

  var sliderContainer = $('<div class="slider-container"></div>');
  sliderItems.forEach(function(item) {
    sliderContainer.append(createSliderItem(item.href, item.src, item.label));
  });

  if (path.includes('/reviews/') || path.includes('/mirrors/')) {
    var sitealternates = $('.sitealternates');
    sliderContainer.insertAfter(sitealternates);
  } else if (path.includes('/topic/') && $('.boxtopic').length > 0) {
    var boxTopic = $('.boxtopic');
    boxTopic.append(sliderContainer);
  } else if ($('.newest-boxes').length > 0) {
    var newestBoxes = $('.newest-boxes');
    sliderContainer.insertBefore(newestBoxes);
  } else {
    var footer = $('footer');
    sliderContainer.insertBefore(footer);
  }

  sliderContainer.slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    speed: 450,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    pauseOnDotsHover: true,
    prevArrow: '<button aria-label="Prev Slide" class="prev-button"><i class="bi bi-chevron-left"></i></button>',
    nextArrow: '<button aria-label="Next Slide" class="next-button"><i class="bi bi-chevron-right"></i></button>',
    dots: true,
    customPaging: function(slider, i) {
      return '<button class="slider-dot">' + (i + 1) + '</button>';
    },
  });

  function createSliderItem(href, src, label) {
    return '<a href="' + href + '" class="slider-banner" aria-label="Visit ' + label + '"><img src="' + src + '" alt="' + label + '" draggable="false"></a>';
  }
  const sliderlinks = document.querySelector('.slider-container');
  updateURLs(sliderlinks);
});

$(document).ready(function() {
  $(window).on('scroll resize', function() {
      var $pages = $('.pages');
      if ($pages.length && $(window).width() <= 1340) {
          if ($(window).scrollTop() >= 100) {
              $pages.addClass('hidden');
          } else {
              $pages.removeClass('hidden');
          }
      }
  });

  $(window).trigger('scroll');
});
  
document.addEventListener("DOMContentLoaded", function() {
  if (!window.location.pathname.includes('/reviews/')) {
      return;
  }

  const translations = {
      en: {
          plusminus: 'Pros and Cons',
          screentable: 'Screenshots and Modes',
          sitedetails: 'Payment Methods',
          sitealternates: 'Similar Sites'
      },
      ru: {
          plusminus: 'Плюсы и Минусы Сайта',
          screentable: 'Скриншоты и Режимы',
          sitedetails: 'Платежные Способы',
          sitealternates: 'Похожие Сайты'
      },
      tr: {
          plusminus: 'Artılar ve Eksiler',
          screentable: 'Ekran Görüntüleri ve Modlar',
          sitedetails: 'Ödeme Yöntemleri',
          sitealternates: 'Benzer Siteler'
      }
  };

  const t = translations[languageTag];

  const mainBox = document.querySelector('.box.main');
  const mirrorRedirect = document.querySelector('.mirror-redirect, .partner-site');

  const navReview = document.createElement('div');
  navReview.classList.add('nav-review');

  const ol = document.createElement('ol');
  navReview.appendChild(ol);

  const sections = [
      { selector: '.plusminus', text: t.plusminus },
      { selector: 'h2', text: document.querySelector('h2')?.textContent },
      { selector: 'h3', text: document.querySelector('h3')?.textContent },
      { selector: '.screentable', text: t.screentable },
      { selector: '.sitedetails', text: t.sitedetails },
      { selector: '.sitealternates', text: t.sitealternates }
  ];

  function isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 80 &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
  }

  sections.forEach(section => {
      const element = document.querySelector(section.selector);
      if (element && window.getComputedStyle(element).display !== 'none') {
          const li = document.createElement('li');
          li.textContent = section.text;
          li.addEventListener('click', () => {
              if (!isElementInViewport(element)) {
                  const rect = element.getBoundingClientRect();
                  const offsetTop = window.scrollY + rect.top - 150;
                  window.scrollTo({
                      top: offsetTop,
                      behavior: 'smooth'
                  });
              }

              let targetElement = element;
              if (section.selector === 'h2') {
                  targetElement = document.querySelector('.smallreview');
              } else if (section.selector === 'h3') {
                  targetElement = document.querySelector('.instruction');
              }

              if (targetElement) {
                  targetElement.classList.remove('navmark');

                  void targetElement.offsetWidth;

                  targetElement.classList.add('navmark');

                  targetElement.addEventListener('animationend', function handler() {
                      targetElement.classList.remove('navmark');
                      targetElement.removeEventListener('animationend', handler);
                  });
              }

              if (section.selector === '.sitedetails') {
                  document.querySelectorAll('.sitepros').forEach(sitepros => {
                      sitepros.classList.toggle('active');
                      if (window.innerWidth >= 1340) {
                          const methodlist = sitepros.querySelector('.methodlist');
                          const methodlistHeight = methodlist ? methodlist.offsetHeight : 0;
                          const totalHeight = sitepros.offsetHeight + methodlistHeight;
                          const parent = sitepros.closest('.sitedetails');
                          const otherActiveSitepros = Array.from(sitepros.parentNode.children).filter(child => child !== sitepros && child.classList.contains('active'));
                          const currentHeight = parseInt(window.getComputedStyle(parent).height);
                          if (sitepros.classList.contains('active')) {
                              if (currentHeight < totalHeight) {
                                  parent.style.height = totalHeight + 'px';
                              }
                          } else if (otherActiveSitepros.length === 0) {
                              parent.style.height = '';
                          }
                      }
                  });
              }
          });
          ol.appendChild(li);
      }
  });

  if (mirrorRedirect) {
      mirrorRedirect.insertAdjacentElement('afterend', navReview);
  } else if (mainBox) {
      mainBox.insertAdjacentElement('afterend', navReview);
  }
});
