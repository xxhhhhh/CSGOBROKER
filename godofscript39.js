function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
  }
  
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
  
  var languageTag = extractLanguageTagFromHTML(window.location.pathname);


  function updateURLs(parentElement) {
    const links = parentElement.querySelectorAll('a[href]');
    const regex = /^(https?:\/\/[^/]+)?(\/[a-z]{2}(?:\/|\.html)?\/?.*)$/;
  
    const languageTag = extractLanguageTagFromHTML();
    if (!languageTag || languageTag === 'en') {
      return;
    }
  
    for (let i = 0; i < links.length; i++) {
      const href = links[i].getAttribute('href');
      if (!href || href.includes('vk.com')) {
        continue;
      }
  
      const match = href.match(regex);
      if (match) {
        const domain = match[1] || '';
        let path = match[2];
        let updatedHref = path;
  
        const pathSegments = path.split('/');
        if (pathSegments.length > 1 && pathSegments[1].length === 2) {
          continue;
        }
  
        updatedHref = '/' + languageTag + path;
  
      if (!links[i].classList.contains('copy_style')) {
        links[i].setAttribute('href', domain + updatedHref);
      }
    }
  }
}
  
  if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')  && !window.location.pathname.includes("/topic/") && !window.location.pathname.includes('/reviews/') && !window.location.pathname.includes('/mirrors/') && !window.location.pathname.includes("/privacy-policy") &&
  !window.location.pathname.includes("/terms-of-service") &&
  !window.location.pathname.includes("/contact-us")) {

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

      var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;


      var header = document.querySelector('header');

      if (!header) return;

      header.insertAdjacentElement('afterend', navBarContainer.firstChild);

      var categorySelector = document.querySelector('.category-selector');

      if (categorySelector) {
        applyTranslation(categorySelector, languageTag, translations);
      }

      var menuToggle = document.querySelector('.menu-toggle');
      var navBar = document.querySelector('.nav-bar');

      if (menuToggle && navBar) {
        menuToggle.addEventListener('click', function () {
          navBar.classList.toggle('active');
          menuToggle.classList.toggle('active');
        });

        if (screenWidth >= 1340) {
          navBar.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            navBar.classList.remove('active');
          });
        }
      }

      var langMenuOnPage = document.querySelector('div.lang-menu');
      if (langMenuOnPage) {
        var languageElement = document.getElementById('language');
        if (languageElement) {
          var langMenuClone = langMenuOnPage.cloneNode(true);
          languageElement.appendChild(langMenuClone);
        }
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
  
    var links = document.getElementsByTagName('a');
  
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      
      if (!link.closest('div.siteblock .box, .sitealternatesboxes .content , ol li a, nav .socials')) {
        if (!link.classList.contains('lang-switch') && !link.closest('.instruction-mirrors')) {
          var path = link.pathname;
  
          if (!path.includes('/ru/') && path.indexOf('/ru') !== 0) {
            if (path !== '/') {
              link.pathname = '/ru' + path;
            } else {
              link.href = link.href.replace('csgobroker.cc/', 'csgobroker.cc/ru/');
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
      "Done!": "Ciesz się!",
      "Visit WebSite": "Odwiedź stronę internetową"
    };
    translateTextElements(translations);
  }
  
  if (
    !window.location.pathname.includes("/reviews/") &&
    !window.location.pathname.includes("/topic/") &&
    !window.location.pathname.includes("/mirrors/") &&
    !window.location.pathname.endsWith("privacy-policy.html") &&
    !window.location.pathname.endsWith("contact-us.html") &&
    !window.location.pathname.endsWith("terms-of-service.html") &&
    !window.location.pathname.endsWith("privacy-policy") &&
    !window.location.pathname.endsWith("contact-us") &&
    !window.location.pathname.endsWith("404") &&
    !window.location.pathname.endsWith("terms-of-service") &&
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
    !window.location.pathname.endsWith("404.html") &&
    !window.location.pathname.endsWith("index.html")
  ) {
    var currentLanguage = languageTag || "en";
  
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

  document.addEventListener("DOMContentLoaded", function () {
    if (
      !window.location.pathname.includes("/skins/") &&
      !window.location.pathname.includes("/items/") &&
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
        $parent.css('height', '60px');
    }
});

$(document).ready(function(){
  $('.screens').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    speed: 450,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    pauseOnDotsHover: true,
    prevArrow: '<button class="prev-button"><i class="bi bi-chevron-left"></i></button>',
    nextArrow: '<button class="next-button"><i class="bi bi-chevron-right"></i></button>',
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
        backToTopButton.style.height = "40px";
        backToTopButton.style.border = "2px solid rgba(0,0,0,.04)";
      }
    }
    else { 
      if(backToTopButton.classList.contains("btnEntrance")) {
        backToTopButton.classList.remove("btnEntrance");
        backToTopButton.classList.add("btnExit");
        setTimeout(function() {
          backToTopButton.style.height = "0";
          backToTopButton.style.border = "0 solid transparent";
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
    '<li><a href="/reviews/wtfskins">Wtfskins</a></li>',
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
    '<li><a href="/reviews/csgolive">CSGOLive</a></li>',
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
    '<li><a href="/reviews/hypeup">Hypeup</a></li>',
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
  
      $(document).ready(function () {
        var originalOrder = $(".box-skins-list").html();
        var enabledFiltersState = {};
    
        function updateNavigationReset() {
            var enabledFilters = $(".navigation-weapon-type.enabled").length;
            var sortEnabled = $(".navigation-weapon-sort").hasClass("enabled");
            if (enabledFilters === 0 && !sortEnabled) {
                if ($(".topic-centralizer .navigation-reset").length === 0) {
                    $(".topic-centralizer").append('<div class="navigation-reset">Reset Navigation</div>');
                }
            } else {
                $(".topic-centralizer .navigation-reset").remove();
            }
        }
    
        function updateSearchUrl(selectedSite, languageTag) {
            const skinLinks = document.querySelectorAll('.skin');
    
            skinLinks.forEach(link => {
                const skinName = link.querySelector('.skin-desc-name').textContent.trim();
                let href = '';
    
                switch (selectedSite) {
                    case 'Tradeit':
                        href = `https://tradeit.gg/csgo/store?search=${encodeURIComponent(skinName)}&aff=csgobroker`;
                        break;
                    case 'BitSkins':
                        href = `https://bitskins.com/market/cs2?search={"order":[{"field":"price","order":"ASC"}],"where":{"skin_name":"${encodeURIComponent(skinName)}"}}&ref_alias=csgobroker`;
                        break;
                    case 'Steam':
                        href = `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(skinName)}`;
                        break;
                    default:
                        href = `https://lis-skins.ru/market/csgo/?query=${encodeURIComponent(skinName)}&rf=83346597`;
                        break;
                }
    
                link.setAttribute('href', href);
                link.setAttribute('target', '_blank');
            });
    
            if (languageTag === 'ru') {
                if (document.getElementById('Lis-Skins')) {
                    document.getElementById('Lis-Skins').title = 'Искать на Lis-Skins';
                }
                if (document.getElementById('Tradeit')) {
                    document.getElementById('Tradeit').title = 'Искать на Tradeit';
                }
                if (document.getElementById('BitSkins')) {
                    document.getElementById('BitSkins').title = 'Искать на BitSkins';
                }
                if (document.getElementById('Steam')) {
                    document.getElementById('Steam').title = 'Искать в Steam';
                }
                if (document.getElementById('Quality-Filter')) {
                    document.getElementById('Quality-Filter').title = 'По Редкости';
                }
            }
        }
    
        $(".box-topic").on("click", ".site-searcher-box", function () {
            $(".site-searcher-box").removeClass("enabled");
            $(this).addClass("enabled");
            updateSearchUrl(this.id);
            localStorage.setItem('selectedSite', this.id);
        });
    
        const lastSelectedSite = localStorage.getItem('selectedSite');
        if (lastSelectedSite) {
            const selectedDiv = document.getElementById(lastSelectedSite);
            if (selectedDiv) {
                selectedDiv.classList.add('enabled');
                const languageTag = extractLanguageTagFromHTML(window.location.pathname);
                updateSearchUrl(lastSelectedSite, languageTag);
            }
        }
    
        if (window.location.pathname.includes("/skins/")) {
            $('.close-box-skins').on('click', function () {
                var parentBoxSkins = $(this).closest(".box-skins");
                parentBoxSkins.toggleClass("selected");
                $(".box-skins").not(parentBoxSkins).removeClass("selected");
                var zoomIcon = $(this).find("i");
                zoomIcon.toggleClass("bi-zoom-in bi-zoom-out");
                $(".close-box-skins i").not(zoomIcon).removeClass("bi-zoom-out").addClass("bi-zoom-in");
            });
    
            $(".box-skins-name").click(function () {
                var parentBoxSkins = $(this).closest(".box-skins");
                parentBoxSkins.toggleClass("selected");
                $(".box-skins").not(parentBoxSkins).removeClass("selected");
                var zoomIcon = $(this).siblings(".close-box-skins").find("i");
                zoomIcon.toggleClass("bi-zoom-in bi-zoom-out");
                $(".close-box-skins i").not(zoomIcon).removeClass("bi-zoom-out").addClass("bi-zoom-in");
            });
    
            document.addEventListener("DOMContentLoaded", function () {
                var boxSkinsNames = document.querySelectorAll('.box-skins-name');
                boxSkinsNames.forEach(function (boxSkinsName) {
                    boxSkinsName.classList.add('visible');
                });
            });
    
            $(".navigation-weapon-type").click(function () {
                var weaponType = $(this).attr("class").split(" ")[1];
                $(".box-skins." + weaponType).toggleClass("disabled");
                $(this).toggleClass("enabled");
                updateNavigationReset();
            });
    
            $(".topic-centralizer").on("click", ".navigation-reset", function () {
                $(".box-skins").removeClass("disabled");
                $(".navigation-weapon-type").addClass("enabled");
                $(".box-skins").removeClass("selected");
                $(".topic-centralizer .navigation-reset").remove();
            });
        } else if (window.location.pathname.includes("/items/")) {
            $(".box-topic").load("/code-parts/micro-parts/box-topic-items.html", function () {
                $(".navigation-weapon-type").click(function () {
                    var weaponType = $(this).attr("class").split(" ")[1];
                    $(".skin." + weaponType).toggleClass("disabled");
                    $(this).toggleClass("enabled");
                    enabledFiltersState[weaponType] = $(this).hasClass("enabled");
                    updateNavigationReset();
                });
    
                $(".navigation-weapon-sort").click(function () {
                    var enabledFilters = $(".navigation-weapon-type.enabled").length;
                    if (enabledFilters === 0) {
                        return;
                    }
    
                    var skins = $(".box-skins-list .skin").get();
                    skins.sort(function (a, b) {
                        var aClass = $(a).attr('class').split(' ')[1];
                        var bClass = $(b).attr('class').split(' ')[1];
                        var sortOrder = ['white', 'lblue', 'blue', 'purple', 'pink', 'red', 'gold'];
                        return sortOrder.indexOf(aClass) - sortOrder.indexOf(bClass);
                    });
    
                    if (!$(this).hasClass("enabled")) {
                        $(".box-skins-list").html(skins);
                    } else {
                        $(".box-skins-list").html(originalOrder);
                    }
    
                    for (var filter in enabledFiltersState) {
                        var isEnabled = enabledFiltersState[filter];
                        if (isEnabled) {
                            $(".skin." + filter).removeClass("disabled");
                            $(".navigation-weapon-type." + filter).addClass("enabled");
                        } else {
                            $(".skin." + filter).addClass("disabled");
                            $(".navigation-weapon-type." + filter).removeClass("enabled");
                        }
                    }
    
                    $(this).toggleClass("enabled");
                    updateNavigationReset();
                });
    
                $(".topic-centralizer").on("click", ".navigation-reset", function () {
                    $(".skin").removeClass("disabled");
                    $(".navigation-weapon-type").addClass("enabled");
                    $(".topic-centralizer .navigation-reset").remove();
                    enabledFiltersState = {};
                });
    
                const lastSelectedSite = localStorage.getItem('selectedSite');
                if (lastSelectedSite) {
                    const selectedDiv = document.getElementById(lastSelectedSite);
                    if (selectedDiv) {
                        selectedDiv.classList.add('enabled');
                        const languageTag = extractLanguageTagFromHTML(window.location.pathname);
                        updateSearchUrl(lastSelectedSite, languageTag);
                    }
                }
            });
        }
    });
    
    
    
    
      
      if (window.location.pathname.includes("/topic/")) {
        var elements = document.querySelectorAll('.box-skins-list');
        elements.forEach(function(element) {
            element.classList.add('visible');
        });
document.addEventListener('DOMContentLoaded', function () {
    const boxSkinsElements = document.querySelectorAll('.box-skins');

    boxSkinsElements.forEach(function(boxSkinsElement) {
        const boxSkinsList = boxSkinsElement.querySelector('.box-skins-list');

        if (boxSkinsList.scrollWidth > boxSkinsList.clientWidth) {
            const boxSkinsControl = document.createElement('div');
            boxSkinsControl.className = 'box-skins-control';
            boxSkinsControl.innerHTML = `
            <div class="box-skins-button left hidden"><i class="bi bi-chevron-left"></i></div>
            <div class="box-skins-button right hidden"><i class="bi bi-chevron-right"></i></div>
            `;
            boxSkinsElement.appendChild(boxSkinsControl);

            const leftButton = boxSkinsControl.querySelector('.box-skins-button.left');
            const rightButton = boxSkinsControl.querySelector('.box-skins-button.right');

            leftButton.addEventListener('click', function () {
                boxSkinsList.scrollBy({
                    left: -boxSkinsList.querySelector('.skin').offsetWidth - 10,
                    behavior: 'smooth'
                });
            });

            rightButton.addEventListener('click', function () {
                boxSkinsList.scrollBy({
                    left: boxSkinsList.querySelector('.skin').offsetWidth + 10,
                    behavior: 'smooth'
                });
            });

            boxSkinsList.addEventListener('scroll', function () {
                leftButton.classList.toggle('hidden', boxSkinsList.scrollLeft <= boxSkinsList.querySelector('.skin').offsetWidth);
                rightButton.classList.toggle('hidden', boxSkinsList.scrollLeft + boxSkinsList.clientWidth >= boxSkinsList.scrollWidth);
            });

            leftButton.classList.toggle('hidden', boxSkinsList.scrollLeft <= boxSkinsList.querySelector('.skin').offsetWidth);

            rightButton.classList.toggle('hidden', boxSkinsList.scrollLeft + boxSkinsList.clientWidth >= boxSkinsList.scrollWidth);
        }
    });
});

        const colorBoxes = document.querySelectorAll('.color-box-selection-button');
        const colorList = document.getElementById('color-list');
      
        colorBoxes.forEach(box => {
          box.addEventListener('click', () => {
            box.classList.toggle('clicked');
            colorList.classList.toggle('active');
          });
        });
        function translateElements(languageTag) {
          if (languageTag === "ru") {
              var translations = {
                  "Knives": "Ножи",
                  "Gloves": "Перчатки",
                  "Pistols": "Пистолеты",
                  "Rifles": "Винтовки",
                  "Sniper Rifles": "Снайперские винтовки",
                  "SMGs": "ПП",
                  "Shotguns": "Дробовики",
                  "Machine guns": "Пулеметы",
                  "Change Color": "Сменить Цвет"
              };
      
              var elementsToTranslate = document.querySelectorAll('.navigation-weapon-type, .color-box-selection-button');
              elementsToTranslate.forEach(function(element) {
                  var originalText = element.textContent.trim();
                  if (translations.hasOwnProperty(originalText)) {
                      element.textContent = translations[originalText];
                  }
              });
          }
      }
      
      translateElements(languageTag); 
    }{        
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
                if ((languageTag === "ru" && path.includes("/topic/")) || (!path || path === "/")) {
                    url.pathname = "/" + languageTag + path;
                    links[i].setAttribute("href", url.href);
                } else if (!path.includes("/topic/") && !langIncluded && supportedLanguages.includes(languageTag)) {
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
              "Gambling Sites": "Игральные Сайты",
              "Earn by Play CS2": "Заработок на Игре в CS2",
              "Others": "Остальное",
              "Skins By Color": "Скины по Цвету",
              "Skins By Weapon Types": "Скины по Типу Оружия",
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
              "Buy Steam Games": "Comprar juegos de Steam"
            },
          };
      
          var elements = document.querySelectorAll('.category-box-content span, ul .submenu li a, ul .submenu li .nonredir');
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
                        '<a class="settings-button" id="button-vpn-filter" title="Скрыть сайты требующие VPN"><i id="vpn-icon" class="bi bi-eye"></i></a>';
    
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
                        document.getElementById('button-vpn-filter').title = buttonTitle;
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
                            button.title = 'Скрыть сайты требующие VPN';
                        } else {
                            button.title = 'Показать сайты требующие VPN';
                        }
    
                        localStorage.setItem('vpnButtonTitle', button.title);
                    });
                }
            }
        })();
    
        function insertRandomAdsBox() {
          var currentPath = window.location.pathname;
      
          if (currentPath.includes('/topic/skins/') && currentPath.includes('/ru/') || currentPath.includes('/topic/sticker-crafts/') && currentPath.includes('/ru/') || (currentPath.includes('/topic/items/') && currentPath.includes('/ru/'))) {
            var adsFilePath = '/code-parts/topic-ads-ru.html';
        } else if (currentPath.includes('/topic/skins/') || currentPath.includes('/topic/sticker-crafts/') || (currentPath.includes('/topic/items/'))) {
            var adsFilePath = '/code-parts/topic-ads.html';
        } else {
            return;
        }
      
          var xhr = new XMLHttpRequest();
          xhr.open('GET', adsFilePath, true);
      
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var adsBoxesHtml = xhr.responseText;
                var adsBoxes = document.createElement('div');
                adsBoxes.innerHTML = adsBoxesHtml;
        
                var insertAfterElement = document.querySelector('.box-topic');
        
                var randomAdsBox = adsBoxes.children[Math.floor(Math.random() * adsBoxes.children.length)];
        
                insertAfterElement.parentNode.insertBefore(randomAdsBox, insertAfterElement.nextSibling);
        
                setTimeout(function () {
                    setTimeout(function () {
                        randomAdsBox.classList.add('active');
                    }, 100);
                });
            }
        };
        
      
          xhr.send();
      }
      
      insertRandomAdsBox();
      
      
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
  document.addEventListener("DOMContentLoaded", function () {
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function hideCookieWidget() {
        var cookieWidget = document.querySelector('.cookie-widget');
        if (cookieWidget) {
            cookieWidget.style.animationName = 'btnExit';
            setCookie('cookieConsent', 'true', 365);
            cookieWidgetButton.removeEventListener('click', hideCookieWidget);
        }
    }

    var cookieConsent = getCookie('cookieConsent');
    if (!cookieConsent) {
        var cookieWidgetButton = document.querySelector('.cookie-widget-button');
        if (cookieWidgetButton) {
            cookieWidgetButton.addEventListener('click', hideCookieWidget);
        }

        var header = document.querySelector('header');
        if (header) {
            var cookieWidget = document.createElement('div');
            cookieWidget.className = 'cookie-widget';
            var languagePrefix = window.location.pathname.indexOf('/ru/') !== -1 || window.location.pathname === '/ru' || window.location.pathname === '/ru.html' ? 'Мы используем файлы <a href="/ru/privacy-policy" class="cookie-redirect">cookie</a>для улучшения вашего опыта' : 'We use <a href="/privacy-policy" class="cookie-redirect">cookie</a> to improve your browsing experience';
            var buttonText = languagePrefix.indexOf('/ru/') !== -1 ? 'Ознакомлен' : 'Informed';

            cookieWidget.innerHTML = '<span class="cookie-widget-info">' + languagePrefix + '</span>' +
                '<button class="cookie-widget-button">' + buttonText + '</button>';

            header.insertAdjacentElement('afterend', cookieWidget);

            cookieWidgetButton = document.querySelector('.cookie-widget-button');
            if (cookieWidgetButton) {
                cookieWidgetButton.addEventListener('click', hideCookieWidget);
            }
        }
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
      }
    });
}

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')) {
  
  
  var newDiv = document.createElement("div");
  newDiv.className = "vpn";
  newDiv.textContent = "Нужен VPN";

  if (window.innerWidth < 1000) {
    newDiv.textContent = "VPN";
}

  var allowedIds = ["Clash", "CSGORoll", "DMarket", "Rollbit", "Primedice", "Duelbits", "FlameCases", "BCGame", "DaddySkins", "CSGOLive", "WTFSkins", "gcskins", "FarmSkins", "vvvgamers"];

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

if (window.location.href.indexOf("/topic/items/") > -1) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          var sitetoppannel = document.querySelector("div.sitetoppannel");
          var alltopic = document.querySelector("div.sitepage");
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

          alltopic.classList.add("fade-in-topic");
      }
  };
  xhr.open("GET", "/code-parts/nav-bar-items.html", true);
  xhr.send();
}

if (window.location.pathname !== '/newest' &&
    window.location.pathname !== '/newest.html' &&
    window.location.href.indexOf('/reviews/') === -1 &&
    window.location.href.indexOf('/mirrors/') === -1 && 
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/sticker-crafts/") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us")) {
    
    var newestBoxesDiv = document.createElement('div');
    newestBoxesDiv.classList.add('newest-boxes');

    if (window.location.href.indexOf('/topic/items/') !== -1 || window.location.href.indexOf('/topic/sticker-crafts/') !== -1 || window.location.href.indexOf('/topic/skins/') !== -1) {
        newestBoxesDiv.classList.add('topic');
    }

    var newestBoxesTitleDiv = document.createElement('div');
    newestBoxesTitleDiv.classList.add('newest-boxes-title');

    var newestBoxesTitleBoxDiv = document.createElement('div');
    newestBoxesTitleBoxDiv.classList.add('newest-boxes-title-box');
    var titleSpan = document.createElement('span');

    if (languageTag === 'ru' && !window.location.pathname.startsWith("/rust")) {
        titleSpan.textContent = 'Новые Сайты';
    } else {
        titleSpan.textContent = 'Recently Added';
    }

    newestBoxesTitleBoxDiv.appendChild(titleSpan);

    newestBoxesTitleDiv.appendChild(newestBoxesTitleBoxDiv);

    newestBoxesDiv.appendChild(newestBoxesTitleDiv);

    var newestFile = languageTag === 'ru' && !window.location.pathname.startsWith("/rust") ? '/ru/newest.html' : '/newest.html';
    fetch(newestFile)
        .then(response => response.text())
        .then(data => {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
    
            var boxes = tempDiv.querySelectorAll('div.boxes-holder .box');
            for (var i = 0; i < 4 && i < boxes.length; i++) {
                newestBoxesDiv.appendChild(boxes[i].cloneNode(true));
            }
    
            var footerElement = document.querySelector('footer');
            var sliderContainer = document.querySelector('.slider-container');
    
            if (sliderContainer) {
              if (
                  window.location.pathname.includes("/topic/skins/") ||
                  window.location.pathname.includes("/topic/items/") ||
                  window.location.pathname.includes("/topic/sticker-crafts/")
              ) {
                  footerElement.parentNode.insertBefore(newestBoxesDiv, footerElement);
              } else {
                  sliderContainer.parentNode.insertBefore(newestBoxesDiv, sliderContainer.nextSibling);
              }
          } else {
              footerElement.parentNode.insertBefore(newestBoxesDiv, footerElement);
          }
          
    
            if (languageTag === 'ru' && !window.location.pathname.startsWith("/rust")) {
                updateURLs(newestBoxesDiv);
            }
        });
    
  }


  const cachedContent = {};

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
  

function getPageType(url) {
  const pageTypes = ['csgo', 'rust', 'dota', 'freebies', 'crypto'];
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



function importModsBox(boxId) {
  const existingContainer = document.querySelector('.boxes-holder');
  const isExistingContentCached = existingContainer && cachedContent[boxId];

  if (isExistingContentCached) {
    insertModsBox(existingContainer, boxId, cachedContent[boxId]);
  } else {
    fetch('/code-parts/micro-parts/insert-mods-box.html')
      .then(response => response.text())
      .then(data => {
        cachedContent[boxId] = data;
        insertModsBox(existingContainer, boxId, data);
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

function translateElement(element, targetLang) {
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
      'ru': 'Бонусы за Депозит',
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
    }
  };

  const textElement = element.querySelector('.singlemod-select span');
  if (textElement) {
    const text = textElement.innerText.trim();
    const key = Object.keys(translations).find(key => key.toLowerCase() === text.toLowerCase());
    if (key && translations[key][targetLang]) {
      textElement.innerText = translations[key][targetLang];
    }
  }
}

$(document).ready(function () {
  if (isTopicItemsLink()) {
    var boxtopic = $('.boxtopic');
    if (boxtopic.length) {
        var urlnav = '/code-parts/micro-parts/nav-topic-box.html';
        $.get(urlnav, function (data) {
            boxtopic.append(data);

            boxtopic.on('click', '.topic-nav-box', function () {
                toggleActiveClass($(this));
                toggleActiveClass($('.topic-nav-selector'));
            });

            boxtopic.on('click', '.topic-nav-close', function () {
                toggleActiveClass($('.topic-nav-selector'));
            });

            boxtopic.on('click', '.weapon-container', function () {
                var clickedContainer = $(this);
                $('.weapon-container').not(clickedContainer).removeClass('active');
                toggleActiveClass(clickedContainer);
            });
        });
    }
  }
});

function toggleActiveClass(element) {
  element.toggleClass('active');
}

function isTopicItemsLink() {
  return window.location.href.includes('/topic/items/');
}

function loadExternalContent(url, targetElement) {
  if (!isTopicItemsLink()) return;

  fetch(url)
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.text();
      })
      .then(data => {
          targetElement.innerHTML = data + targetElement.innerHTML;

          const topicNavBox = document.querySelector('.topic-nav-box');
          const topicNavSelector = document.querySelector('.topic-nav-selector');
          const weaponContainers = document.querySelectorAll('.weapon-container');
          const topicNavClose = document.querySelector('.topic-nav-close');

          topicNavBox.addEventListener('click', function () {
              toggleActiveClass(topicNavBox);
              toggleActiveClass(topicNavSelector);
          });

          topicNavClose.addEventListener('click', function () {
              toggleActiveClass(topicNavSelector);
          });

          weaponContainers.forEach(function (container) {
              container.addEventListener('click', function () {
                  weaponContainers.forEach(function (otherContainer) {
                      if (otherContainer !== container) {
                          otherContainer.classList.remove('active');
                      }
                  });
                  toggleActiveClass(container);
              });
          });
      });
}


var ratings = {
  "csgo500": 4.625,
  "CSGOFast":4,
  "Gamdom": 4.125,
  "CSGOEmpire":4,
  "CSFAIL":3.5,
  "CSGORUN":3.5,
  "CSGOLuck":3.875,
  "Key-Drop":3.5,
  "xplay":4.5,
  "InsaneGG":3.5,
  "DatDrop":3.5,
  "HellStore":2.875,
  "CSGOStake":2.875,
  "CSGOPOSITIVE":3.75,
  "Hellcase":3.375,
  "Bounty Stars":3,
  "CSGOBIG":3.125,
  "KNIFEX":3,
  "SkinSwap":4.5,
  "Tradeit":4.625,
  "Lis-Skins":3.875,
  "SKINFANS":3,
  "csgo-skins":3,
  "CSGORoll":4,
  "Clash":4,
  "FlameCases":3.375,
  "DaddySkins":3.5,
  "Duelbits":4.125,
  "Rollbit":4,
  "WTFSkins":3.375,
  "FarmSkins":2.625,
  "Bets4pro":3.125,
  "RustMagic":3.5,
  "Rustly":3.625,
  "CS.Money":4.5,
  "RAPIDSKINS":3.125,
  "Aim.market":3.5,
  "SKINBOX":3.5,
  "Moon.Market":3.875,
  "gcskins":4.125,
  "HypeUp":3.5,
  "vvvgamers":3.375,
  "banditcamp":4.125,
  "GrindBux":3.5,
  "Earnweb":3.125,
  "RustClash":4,
  "RustStake":4,
  "HowlGG":4.25,
  "SkinCashier":4.125,
  "Shuffle":3.375,
  "RustyPot":3.5,
  "RustBet":3,
  "Rustyloot":3.125,
  "RustChance":3.5,
  "CSGOPolygon":3.625,
  "Skinbet":3.375,
  "RUSTMOMENT":2.75,
  "Idle-Empire":4.5,
  "BCGame":4.5,
  "Freeward":3.375,
  "SteamLevelU":3.75,
  "CSGOLive":3.5,
  "Freecash":5,
  "STEAMLVLUP":4.5,
  "CYBERSHOKE":4.125,
  "Gamehag":3.875,
  "CSGOSelly":3,
  "SteamGifts":4.5,
  "SKINSLY":2.625,
  "SwapGG":3.875,
  "CS.Deals":4,
  "DMarket":4.625,
  "LOOT.Farm":3.5,
  "BitSkins":4,
  "ShadowPay":3.5,
  "GamerPay":3.5,
  "CSGO-Market":3.875,
  "SkinBaron":3.5,
  "WhiteMarket":3.5,
  "SkinBid":3.125,
  "iTrade.GG":3.125,
  "Avan.Market":4,
  "LootBear":3.375,
  "Skins.Cash":2.625,
  "RustCases":3.375,
  "SteamLevels":3.5,
  "GGDROP":4,
  "Roobet":4.625,
  "Primedice":4.125,
};

function addStarRating(boxId, rating) {
  var boxElement = document.getElementById(boxId);
  if (boxElement) {
      var starRatingHTML = '<div class="rating-case-single">';
      starRatingHTML += '<div class="star_rating"><i class="bi bi-star-fill"></i></div>';
      starRatingHTML += '<div class="rating-summ">' + rating.toFixed(2) + '</div>';
      starRatingHTML += '</div>';
      var logobgElement = boxElement.querySelector('.logobg');
      logobgElement.innerHTML += starRatingHTML;
  }
}

var boxesHolder = document.querySelector('.boxes-holder');
if (boxesHolder) {
  for (var boxId in ratings) {
      addStarRating(boxId, ratings[boxId]);
  }
}

$(document).ready(function(){

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
  

  var sliderContainer = $('<div class="slider-container"></div>');  

  var slider1 = createSliderItem('/', '/img/best-gambling-sites-slide-2024.png', 'Best Gambling Sites');
  var slider2 = createSliderItem('/earning/offerwalls', '/img/earn-skins-slider-2024.png', 'Best Offerwall Sites');
  var slider3 = createSliderItem('/rust', '/img/best-rust-sites-slide-2024.png', 'Best Rust Sites');
  
  sliderContainer.append(slider1, slider2, slider3);

  var path = window.location.pathname;
  if (path.includes('/reviews/')) {
    var sitealternates = $('.sitealternates');
    sliderContainer.insertAfter(sitealternates);
  } else if (path.includes('/mirrors/')) {
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
    prevArrow: '<button class="prev-button"><i class="bi bi-chevron-left"></i></button>',
    nextArrow: '<button class="next-button"><i class="bi bi-chevron-right"></i></button>',
    dots: true,
    customPaging: function(slider, i) {
      return '<button class="slider-dot" data-role="none">' + (i + 1) + '</button>';
    },
  });
  
  translateURLsSlider(sliderContainer[0], languageTag);

  function createSliderItem(href, src, alt) {
    return '<a href="' + href + '" class="slider-banner"><img src="' + src + '" alt="' + alt + '" draggable="false"></a>';
  }
});


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
              if (path === '/') {
                  url.pathname = '/' + languageTag;
              } else {
                  path = '/' + languageTag + path;
                  url.pathname = path;
              }
              links[i].setAttribute('href', url.href);
          }
      }
  }
}

$(document).ready(function(){
  $('.crafting-table-step').click(function(){
      $('.crafting-table-step').removeClass('active');
      $('.crafting-table-screen').removeClass('active');
      $(this).addClass('active');
      var index = $(this).index();
      $('.crafting-table-screen').eq(index).addClass('active');
  });

  $('.preview-craft-unit').click(function(){
      if ($(this).hasClass('preview')) {
          $('.preview-craft-unit').removeClass('preview');
      } else {
          $('.preview-craft-unit').removeClass('preview');
          $(this).addClass('preview');
      }
  });
});

document.addEventListener("DOMContentLoaded", function() {
  if (window.location.pathname.startsWith("/topic/skins")) {
      var colorList = ["white", "gray", "black", "brown", "red", "orange", "golden", "silver", "yellow", "green", "cyan", "blue", "purple", "pink"];

      colorList.forEach(function(color) {
          var bgImage = new Image();
          bgImage.src = "/img/skins/previews/small/example-" + color + ".webp";
          bgImage.onload = function() {
              var elements = document.querySelectorAll("[data-color='" + color + "']");
              elements.forEach(function(element) {
                  element.style.backgroundImage = "url(" + bgImage.src + ")";
                  element.classList.add("active");
              });
          };
      });
  }
});