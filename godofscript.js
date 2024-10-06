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
  const reviewBox = document.querySelector('.box.main .content');
  const modsboxes = document.querySelector('.mods-main-box');
  const supportedLanguages = ["en", "es", "hi", "pt", "ru", "tr"];


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
    const languageTag = extractLanguageTagFromHTML();
  
    if (!languageTag || languageTag === 'en' || languageTag === 'pl') {
      return;
    }
  
    links.forEach(link => {
      if (link.closest('div.instruction') || link.closest('div.instruction-mirrors')) {
        return;
      }
  
      if (languageTag === 'tr' && link.classList.contains('mirror-redirect')) {
        return;
      }
  
      let href = link.getAttribute('href');
  
      if (href === '/') {
        href = `/${languageTag}/`;
      } else {
        const pathSegments = href.split('/');
        
        if (pathSegments.length > 1 && pathSegments[1].length === 2) {
          return;
        }
        
        if (href.startsWith('/')) {
          href = `/${languageTag}${href}`;
        } else {
          href = `/${languageTag}/${href}`;
        }
      }
  
      if (!link.classList.contains('visit') && !link.classList.contains('notupdt')) {
        if (languageTag === 'es' || languageTag === 'pt' || languageTag === 'hi') {
          if (!link.classList.contains('review-button') && !link.classList.contains('boxtitle') && !link.closest('.box')) {
            link.setAttribute('href', href);
          }
        } else {
          link.setAttribute('href', href);
        }
      }
      
    });
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    const basePath = "/code-parts/site-infos";
  
    function loadJsonData(filePath, callback) {
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load JSON data');
                return response.json();
            })
            .then(data => {
                if (data) {
                    callback(data);
                }
            })
            .catch(error => console.error("Error loading JSON data: ", error));
    }
  
    function modifyBox(box, mainMode) {
        const logobg = box.querySelector('.logobg');
        if (!logobg) return;
  
        const mainModeDiv = document.createElement('div');
        mainModeDiv.className = `main-mode ${mainMode} lang-${languageTag}`;
        mainModeDiv.innerHTML = `<div class="main-mode-box"><div class="main-mode-icon"></div></div>`;
  
        logobg.appendChild(mainModeDiv);
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
  
  function loadReviewSettings(callback) {
    fetch('/code-parts/review-settings.json')
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error("Error loading review settings: ", error));
  }
  
  window.updateReviewButtons = updateReviewButtons;
  
  function updateReviewButtons(box, data, pageKey, reviewSettings) {
    const reviewButton = box.querySelector('.content-buttons a.review-button');
    const visitButton = box.querySelector('.content-buttons a.review-button.visit');
  
    const translations = {
        "similarSites": {
            "en": `Similar Sites of ${data.name}`,
            "ru": `Альтернативы ${data.name}`
        },
        "readReview": {
            "en": `Read Review ${data.name}`,
            "ru": `Смотреть Обзор ${data.name}`
        },
        "visitSite": {
            "en": `Visit ${data.name}`,
            "ru": `Перейти на ${data.name}`
        }
    };
  
    function getTranslation(key) {
        return translations[key][languageTag] || translations[key]['en'];
    }
  
    if (reviewButton) {
        if (window.location.pathname.includes("/reviews/") || window.location.pathname.includes("/mirrors/")) {
            if (data["Main Mode"] && reviewSettings) {
                const mainModePath = reviewSettings.mainModeLinks[data["Main Mode"]];
                if (mainModePath) {
                    reviewButton.href = mainModePath;
                    reviewButton.setAttribute('aria-label', getTranslation('similarSites'));
                }
            }
        } else {
            reviewButton.href = `/reviews/${pageKey}`;
            reviewButton.setAttribute('aria-label', getTranslation('readReview'));
        }
    }
  
    if (visitButton && data.link) {
        visitButton.href = data.link;
        visitButton.setAttribute('aria-label', getTranslation('visitSite'));
    }
  }
  
  
    let currentPath = window.location.pathname;
    if (currentPath.includes("/reviews/") || currentPath.includes("/mirrors/")) {
        if (currentPath.endsWith(".html")) {
            currentPath = currentPath.slice(0, -5);
        }
  
        const pageKey = currentPath.split("/").pop();
        const mainJsonFilePath = `${basePath}/${pageKey}.json`;
  
        loadReviewSettings(reviewSettings => {
          loadJsonData(mainJsonFilePath, data => {
              if (data.code) {
                  const siteCodeElement = document.getElementById('site-code');
                  if (siteCodeElement) {
                      siteCodeElement.textContent = data.code;
                  }
      
                  const copyButtons = document.querySelectorAll('.copy');
                  copyButtons.forEach(button => {
                      button.addEventListener('click', () => copyToClipboard(data.code, button));
                  });
              }
      
              const mainBoxes = document.querySelectorAll('.box:not(.sitealternates .box)');
              mainBoxes.forEach(box => {
                  if (data["Main Mode"]) {
                      modifyBox(box, data["Main Mode"]);
                  }
                  updateReviewButtons(box, data, pageKey, reviewSettings);
                  updateURLs(reviewBox);   
              });
          });
      });
      
    } else {
        const holderBoxes = document.querySelectorAll('.boxes-holder .box');
        holderBoxes.forEach(box => {
            const logoLink = box.querySelector('.logobg a');
            if (logoLink) {
                const path = logoLink.getAttribute('href');
                const pageKey = path.split('/').pop();
                const jsonFilePath = `${basePath}/${pageKey}.json`;
  
                loadJsonData(jsonFilePath, data => {
                  if (data.code) {
                      const copyButtons = box.querySelectorAll('.copy');
                      copyButtons.forEach(button => {
                          button.addEventListener('click', () => copyToClipboard(data.code, button));
                      });
                  }
                  if (data["Main Mode"]) {
                      modifyBox(box, data["Main Mode"]);
                  }
                  updateReviewButtons(box, data, pageKey);  
                  updateURLs(sitesList);   
              });         
            }  
        });
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    const userAgent = navigator.userAgent;
  
    if (userAgent.includes('Googlebot')) {
        function replaceDomain(url) {
            return url.replace('csgobroker.cc', 'csgobroker.me');
        }
  
        const elements = document.querySelectorAll('link[rel="canonical"], link[rel="alternate"], meta[property="og:url"]');
        elements.forEach(element => {
            let href = element.getAttribute('href');
            if (href) {
                const newUrl = replaceDomain(href);
                element.setAttribute('href', newUrl);
            }
        });
  
        const metaElements = document.querySelectorAll('meta[property="og:url"]');
        metaElements.forEach(element => {
            let content = element.getAttribute('content');
            if (content) {
                const newUrl = replaceDomain(content);
                element.setAttribute('content', newUrl);
            }
        });
    }
  });
  

  const path = window.location.pathname;
  const excludePaths = [
      "/topic",
      "/reviews/",
      "/mirrors/",
      "/privacy-policy",
      "/terms-of-service",
      "/contact-us"
  ];
  
  const isRuPath = path === '/ru' || path === '/ru.html' || path.startsWith('/ru/');
  const isExcluded = excludePaths.some(excludedPath => path.includes(excludedPath));
  const isErrorPage = document.getElementById('error-404');
  
  if (isRuPath && !isExcluded && !isErrorPage) {
      updateURLs(sitesList);
  }
  
  if (
    !window.location.pathname.endsWith("404") &&
    !window.location.pathname.includes("/mirrors/") &&
    !window.location.pathname.includes("/reviews/") &&
    !window.location.pathname.includes("/topic") &&
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us") &&
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
    var langMenuDiv = document.querySelector(".lang-menu");
    
    function getLanguageName(lang) {
        switch (lang) {
            case "en": return "English";
            case "ru": return "Русский";
            case "pt": return "Português";
            case "es": return "Español";
            case "tr": return "Türkçe";
            case "hi": return "हिन्दी";
            default: return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
        }
    }
    
    function createLanguageListItem(lang, path) {
        return '<li><a href="' + path + '" class="lang-switch" data-lang="' + lang + '"><i class="flagbox flag-' + lang + '"></i>' + getLanguageName(lang) + '</a></li>';
    }
    
    function checkAndAddLanguage(lang) {
        var path = lang === "en" ? window.location.pathname.replace(/^\/[a-z]{2}\//, "/") : "/" + lang + window.location.pathname.replace(/^\/[a-z]{2}\//, "/");
    
        fetch(path, { method: 'HEAD' }).then(function(response) {
            if (response.ok && currentLanguage !== lang) {
                langMenuDiv.querySelector("ul").innerHTML += createLanguageListItem(lang, path);
            }
        });
    }
    
    var newContent = '<div class="selected-lang">' + currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1).toLowerCase() + '</div><ul>';
    langMenuDiv.innerHTML = newContent;
    
    supportedLanguages.forEach(function(lang) {
        checkAndAddLanguage(lang);
    });
    
  }

var ratingsumm = document.querySelector(".ratingsumm");
var sitealternates = document.querySelector(".sitealternates");

if (ratingsumm && sitealternates) {
  ratingsumm.parentNode.insertBefore(
    sitealternates,
    ratingsumm.nextSibling
  );
}

if (supportedLanguages.includes(languageTag)) {
  const cacheKey = `infoboxContent_${languageTag}`;
  const cachedContent = localStorage.getItem(cacheKey);

  const insertInfobox = (content) => {
    let insertionPoint;
    if (window.location.pathname.includes('/reviews/')) {
      insertionPoint = document.querySelector('.sitealternates');
    } else {
      insertionPoint = document.querySelector('.boxes-holder');
    }

    if (insertionPoint) {
      insertionPoint.insertAdjacentHTML('afterend', content);
    }
  };

  if (cachedContent) {
    insertInfobox(cachedContent);
  } else {
    const filePath = `/code-parts/micro-parts/main-infobox/${languageTag}.html`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', filePath, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const infoboxContent = xhr.responseText;

        localStorage.setItem(cacheKey, infoboxContent);

        insertInfobox(infoboxContent);
      }
    };

    xhr.send();
  }
}


$('.sitepros').click(function() {
  $(this).toggleClass("active");

  if ($(window).width() >= 1365) {
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

$('.sitepros .methodlist').click(function(event) {
  event.stopPropagation();
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
    prevArrow: '<button aria-label="Prev Slide" class="prev-button"><i class="officon chevron left"></i></button>',
    nextArrow: '<button aria-label="Next Slide" class="next-button"><i class="officon chevron right"></i></button>',
    dots: true
  });
});
  
window.onload = function () {
  (function () {
    const pathname = window.location.pathname;
    const excludedPaths = [
      '/ru/reviews',
      '/ru/mirrors',
      '/ru/topic',
      '/privacy-policy',
      '/terms-of-service',
      '/contact-us'
    ];
    const isRuPage = pathname.startsWith('/ru/') || pathname === '/ru' || pathname === '/ru.html';
    const isExcludedPath = excludedPaths.some(path => pathname.includes(path));

    let buttonsContainer = document.querySelector('.buttons-container-page');

    if (!buttonsContainer) {
      buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'buttons-container-page';
      document.body.appendChild(buttonsContainer);
    }

    if (isRuPage && !isExcludedPath && !document.querySelector('#button-vpn-filter')) {
      const vpnButtonContainer = document.createElement('div');
      vpnButtonContainer.className = 'settings-menu';
      vpnButtonContainer.innerHTML =
        '<div class="settings-button" id="button-vpn-filter" data-title="Скрыть сайты требующие VPN"><i id="vpn-icon" class="officon eye"></i></div>';
      
      buttonsContainer.appendChild(vpnButtonContainer);

      const vpnIcon = document.getElementById('vpn-icon');

      function toggleVpnBlocks() {
        const vpnBlocks = document.querySelectorAll('.box');
        vpnBlocks.forEach(block => {
          if (block.querySelector('.vpn')) {
            block.style.display = block.style.display === 'none' ? '' : 'none';
          }
        });
      }

      const buttonState = localStorage.getItem('vpnButtonState');
      const buttonTitle = localStorage.getItem('vpnButtonTitle');

      if (buttonState === 'hidden') {
        toggleVpnBlocks();
        vpnIcon.classList.replace('eye', 'eye-slash');
      }

      if (buttonTitle) {
        document.getElementById('button-vpn-filter').dataset.title = buttonTitle;
      }

      document.getElementById('button-vpn-filter').addEventListener('click', function () {
        toggleVpnBlocks();

        const currentState = localStorage.getItem('vpnButtonState') || 'visible';
        const newState = currentState === 'hidden' ? 'visible' : 'hidden';
        localStorage.setItem('vpnButtonState', newState);

        vpnIcon.classList.toggle('eye');
        vpnIcon.classList.toggle('eye-slash');

        const button = document.getElementById('button-vpn-filter');
        button.dataset.title = vpnIcon.classList.contains('eye') ?
          'Скрыть сайты требующие VPN' : 'Показать сайты требующие VPN';

        localStorage.setItem('vpnButtonTitle', button.dataset.title);
      });
    }

    if (!document.querySelector('#back-to-top-btn')) {
      const backToTopButton = document.createElement('button');
      backToTopButton.id = 'back-to-top-btn';
      backToTopButton.setAttribute('aria-label', 'Back to Top Button');
      backToTopButton.className = 'officon chevron btnExit';
      buttonsContainer.appendChild(backToTopButton);

      window.addEventListener("scroll", scrollFunction);

      function scrollFunction() {
        if (window.pageYOffset > 300) {
          if (!backToTopButton.classList.contains("btnEntrance")) {
            backToTopButton.classList.remove("btnExit");
            backToTopButton.classList.add("btnEntrance");
          }
        } else {
          if (backToTopButton.classList.contains("btnEntrance")) {
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
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
      }
    }
  })();
};

  const siteList = document.getElementById('site-list');
  const searchInput = document.getElementById('search-input');
  
  let sites = [];
  let siteTranslations = {};
  
  fetch('/code-parts/search-config/config.json')
    .then(response => response.json())
    .then(data => {
      sites = data.sites;
      return fetch('/code-parts/search-config/translations.json');
    })
    .then(response => response.json())
    .then(data => {
      siteTranslations = data;
      updateSiteList();
    });
  
  function getTranslation(path) {
    if (!siteTranslations[path]) {
      return path;
    }
    
    const translations = siteTranslations[path];
    
    if (translations.og) {
      return translations.og;
    }
  
    return languageTag === 'ru' ? translations.ru || translations.en : translations.en || translations.ru;
  }
  
  function updateSiteList() {
    siteList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    sites.forEach(path => {
      const li = document.createElement('li');
      li.className = 'site-item hidden';
  
      const link = document.createElement('a');
      link.href = path;
      link.textContent = getTranslation(path);
  
      if (languageTag === 'ru') {
        link.href = '/ru' + path;
      }
  
      li.appendChild(link);
      fragment.appendChild(li);
    });
    siteList.appendChild(fragment);
  }
  
  
  function hideAllSites(siteItems) {
    Array.from(siteItems).forEach(hideSite);
  }
  
  function hideSite(siteItem) {
    siteItem.classList.remove('show');
    siteItem.classList.add('hidden');
  }
  
  function showSite(siteItem) {
    siteItem.classList.remove('hidden');
    siteItem.classList.add('show');
  }
  
  function handleSearchInput() {
    const searchTerm = searchInput.value.toLowerCase();
    const siteItems = siteList.getElementsByClassName('site-item');
  
    if (searchTerm === '') {
      hideAllSites(siteItems);
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
      return;
    }
  
    let hasVisibleItems = false;
  
    Array.from(siteItems).forEach(siteItem => {
      const siteName = siteItem.textContent.toLowerCase();
      if (siteName.includes(searchTerm)) {
        showSite(siteItem);
        hasVisibleItems = true;
      } else {
        hideSite(siteItem);
      }
    });
  
    if (hasVisibleItems) {
      siteList.classList.remove('hidden');
      siteList.classList.add('show');
    } else {
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
    }
  }
  
  searchInput.addEventListener('input', handleSearchInput);
  
  searchInput.addEventListener('focus', () => {
    if (searchInput.value === '') {
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
    } else {
      siteList.classList.remove('hidden');
      siteList.classList.add('show');
    }
  });
  
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
    }, 150);
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.search-enabler').addEventListener('click', () => {
      document.querySelector('#search-input').classList.add('active');
      document.querySelector('.search-enabler').classList.add('disabled');
      document.querySelector('.search-container').classList.add('expanded');
    });
  });
      
    document.addEventListener('DOMContentLoaded', function () {
      var replacementHTML = `
          <div class="contact-content">
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
  
const btnfaq = document.getElementById("btnfaq");

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

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')) {
  
  
  var newDiv = document.createElement("div");
  newDiv.className = "vpn";
  newDiv.textContent = "Нужен VPN";

  var allowedIds = [
    "ClashGG",
    "CSGORoll",
    "DMarket",
    "Rollbit",
    "Primedice",
    "Duelbits",
    "FlameCases",
    "BCGame",
    "DaddySkins",
    "FarmSkins",
    "RustyPot",
    "RustChance",
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

const href = window.location.href;

const isExcludedPage = [
  "newest",
  "newest.html",
  "/reviews/",
  "/mirrors/",
  "/privacy-policy",
  "/topic",
  "/terms-of-service",
  "/contact-us"
].some(exclusion => path.endsWith(exclusion) || href.includes(exclusion));

if (!isExcludedPage) {
  const createDiv = (className) => {
    const div = document.createElement('div');
    div.classList.add(className);
    return div;
  };

  const newestBoxesDiv = createDiv('newest-boxes');
  const newestBoxesTitleDiv = createDiv('newest-boxes-title');
  const newestBoxesTitleBoxDiv = createDiv('newest-boxes-title-box');
  
  const titleSpan = document.createElement('span');
  const titles = {
    ru: 'Недавно Добавленные',
    tr: 'Yeni Eklenenler',
    pt: 'Recentemente Adicionados',
    es: 'Recientemente Añadidos',
    hi: 'हाल ही में जोड़ा गया',
  };
  titleSpan.textContent = titles[languageTag] || 'Recently Added';

  newestBoxesTitleBoxDiv.appendChild(titleSpan);
  newestBoxesTitleDiv.appendChild(newestBoxesTitleBoxDiv);
  newestBoxesDiv.appendChild(newestBoxesTitleDiv);

  const newestFragment = languageTag === 'ru' && !path.startsWith("/rust")
    ? '/code-parts/newest-ru.html'
    : '/code-parts/newest.html';

  fetch(newestFragment)
    .then(response => response.text())
    .then(data => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data;

      const boxes = Array.from(tempDiv.querySelectorAll('.box'));
      boxes.forEach(box => newestBoxesDiv.appendChild(box.cloneNode(true)));

      const sliderContainer = document.querySelector('.slider-container');
      const insertBeforeElement = sliderContainer ? sliderContainer.nextSibling : document.querySelector('footer');
      
      insertBeforeElement.parentNode.insertBefore(newestBoxesDiv, insertBeforeElement);

      if (languageTag === 'ru' && !path.startsWith("/rust")) {
        updateURLs(newestBoxesDiv);
      }
      updateURLs(sliderContainer);
    });
}


function forcemodsboxes() {
  const importedMods = {};
  const url = cleanUrl(window.location.href);
  const pageType = getPageType(url);

  switch (pageType) {
    case "csgo":
      if (isMultiBoxPage(url)) {
        importModsBox("csgo-skins");
        importModsBox("csgo");
      } else {
        importModsBox("csgo");
      }
      break;
    case "rust":
      if (isMultiBoxPage(url)) {
        importModsBox("rust-skins");
        importModsBox("rust");
      } else {
        importModsBox("rust");
      }
      break;
    case "dota":
      if (isMultiBoxPage(url)) {
        importModsBox("dota-items");
        importModsBox("dota");
      } else {
        importModsBox("dota");
      }
      break;
    case "tf2":
      importModsBox("tf2-items");
      break;
    case "freebies":
      importModsBox("freebies");
      break;
    case "crypto":
      importModsBox("crypto");
      break;
    default:
      if (
        url.includes("/csgo/") ||
        url.endsWith("/cs2") ||
        url.endsWith("/cs2.html") ||
        url.endsWith("/ru") ||
        url.endsWith("/es") ||
        url.endsWith("/tr") ||
        url.endsWith("/pt") ||
        url.endsWith("/hi") ||
        url.endsWith("/") ||
        url.endsWith("index.html") ||
        url.endsWith("/ru.html") ||
        url.endsWith("/es.html") ||
        url.endsWith("/tr.html") ||
        url.endsWith("/pt.html") ||
        url.endsWith("/hi.html")
      ) {
        importModsBox("csgo");
      } else if (
        url.includes("/rust/") ||
        url.endsWith("/rust") ||
        url.endsWith("/rust.html")
      ) {
        importModsBox("rust");
      } else if (
        url.includes("/dota/") ||
        url.endsWith("/dota") ||
        url.endsWith("/dota.html")
      ) {
        importModsBox("dota");
      }
      break;
  }

  function importModsBox(boxId) {
    if (importedMods[boxId]) {
      return;
    }

    const existingContainer = document.querySelector(".boxes-holder");
    const cachedContent = localStorage.getItem(`modsBox-v2-${boxId}`);

    if (cachedContent) {
      insertModsBox(existingContainer, boxId, cachedContent);
      importedMods[boxId] = true;
    } else {
      let fileToFetch = "/code-parts/micro-parts/insert-mods-box.html";

      fetch(fileToFetch)
        .then((response) => response.text())
        .then((data) => {
          localStorage.setItem(`modsBox-v2-${boxId}`, data);
          insertModsBox(existingContainer, boxId, data);
          importedMods[boxId] = true;
        });
    }
  }

  function insertModsBox(container, boxId, data) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = data;

    const newModsBox = tempDiv.querySelector(`[data-box-id="${boxId}"]`);
    const existingModsBoxes = container.querySelectorAll(".mods-box");
    const existingBox = Array.from(existingModsBoxes).find(
      (box) => box.getAttribute("data-box-id") === boxId
    );

    if (existingBox) {
      container.replaceChild(newModsBox, existingBox);
    } else {
      container.insertBefore(newModsBox, container.firstChild);
    }

    const languageTag = extractLanguageTagFromHTML();
    if (languageTag && ["ru", "tr", "pt", "hi", "es"].includes(languageTag)) {
      const singlemodBoxes = newModsBox.querySelectorAll(".singlemod-box");
      singlemodBoxes.forEach((box) => {
        translateElement(box, languageTag);
      });
    }

    setTimeout(() => {
      const singlemodBoxes = newModsBox.querySelectorAll(".singlemod-box");
      singlemodBoxes.forEach((box) => {
        const link = box.querySelector("a").getAttribute("href");
        if (url.includes(link)) {
          box.classList.add("active");
        }
      });
    });

    updateURLs(newModsBox);
  }

  function getPageType(url) {
    const pageTypes = ["csgo", "rust", "dota", "tf2", "freebies", "crypto"];
    for (const type of pageTypes) {
      if (
        url.includes(`/${type}/`) ||
        url.endsWith(`/${type}`) ||
        url.endsWith(`/${type}.html`)
      ) {
        return type;
      }
    }
    return "other";
  }

  function cleanUrl(url) {
    return url.split("?")[0].toLowerCase();
  }

  function isMultiBoxPage(url) {
    const cleanUrlValue = cleanUrl(url);

    return (
      cleanUrlValue.endsWith("/buy-skins") ||
      cleanUrlValue.endsWith("/buy-items") ||
      cleanUrlValue.endsWith("/sell-items") ||
      cleanUrlValue.endsWith("/trade-items") ||
      cleanUrlValue.endsWith("/sell-skins") ||
      cleanUrlValue.endsWith("/trade-skins") ||
      cleanUrlValue.endsWith("/instant-sell") ||
      cleanUrlValue.endsWith("/marketplaces") ||
      cleanUrlValue.endsWith("/buy-skins.html") ||
      cleanUrlValue.endsWith("/buy-items.html") ||
      cleanUrlValue.endsWith("/sell-items.html") ||
      cleanUrlValue.endsWith("/trade-items.html") ||
      cleanUrlValue.endsWith("/sell-skins.html") ||
      cleanUrlValue.endsWith("/trade-skins.html") ||
      cleanUrlValue.endsWith("/marketplaces.html") ||
      cleanUrlValue.endsWith("/instant-sell.html")
    );
  }

  window.translateElement = translateElement;

  function translateElement(element, languageTag) {
    const translations = {
      "Buy Skins": {
        ru: "Купить скины",
        tr: "Skinler Satın Al",
        pt: "Comprar Skins",
        hi: "स्किन्स खरीदें",
        es: "Comprar Skins",
      },
      "Sell Skins": {
        ru: "Продать скины",
        tr: "Skinler Sat",
        pt: "Vender Skins",
        hi: "स्किन्स बेचें",
        es: "Vender Skins",
      },
      "Trade Skins": {
        ru: "Обменять скины",
        tr: "Skinler Takas Et",
        pt: "Negociar Skins",
        hi: "स्किन्स विनिमय",
        es: "Intercambiar Skins",
      },
      "Buy Items": {
        ru: "Купить предметы",
        tr: "Eşyalar Satın Al",
        pt: "Comprar Itens",
        hi: "वस्तुएँ खरीदें",
        es: "Comprar Ítems",
      },
      "Sell Items": {
        ru: "Продать предметы",
        tr: "Eşyalar Sat",
        pt: "Vender Itens",
        hi: "वस्तुएँ बेचें",
        es: "Vender Ítems",
      },
      "Trade Items": {
        ru: "Обменять предметы",
        tr: "Eşyalar Takas Et",
        pt: "Negociar Itens",
        hi: "वस्तुएँ विनिमय",
        es: "Intercambiar Ítems",
      },
      "Instant Sell": {
        ru: "Моментальная продажа",
        tr: "Anlık Satış",
        pt: "Venda Imediata",
        hi: "त्वरित बेचें",
        es: "Venta Instantánea",
      },
      Marketplaces: {
        ru: "Торговые Площадки",
        tr: "Pazarlar",
        pt: "Mercados",
        hi: "बाजार",
        es: "Mercados",
      },
      "Daily Rewards": {
        ru: "Ежедневные Награды",
        tr: "Günlük Ödüller",
        pt: "Recompensas Diárias",
        hi: "दैनिक पुरस्कार",
        es: "Recompensas Diarias",
      },
      "Deposit Bonuses": {
        ru: "Бонусы к Пополнению",
        tr: "Yatırım Bonusları",
        pt: "Bônus de Depósito",
        hi: "जमा बोनस",
        es: "Bonos de Depósito",
      },
      Giveaways: {
        ru: "Розыгрыши",
        tr: "Çekilişler",
        pt: "Sorteios",
        hi: "गिफ्ट वे",
        es: "Sorteos",
      },
      "Sign Up Bonuses": {
        ru: "Бонусы за Регистрацию",
        tr: "Kayıt Bonusları",
        pt: "Bônus de Inscrição",
        hi: "साइन अप बोनस",
        es: "Bonos de Registro",
      },
      "Match Betting": {
        ru: "Ставки на Матчи",
        tr: "Maç Bahisleri",
        pt: "Apostas em Partidas",
        hi: "मैच सट्टेबाजी",
        es: "Apuestas en Partidos",
      },
      Roulette: {
        ru: "Рулетка",
        tr: "Rulet",
        pt: "Roleta",
        hi: "रूले",
        es: "Ruleta",
      },
      "Case Opening": {
        ru: "Открытие Кейсов",
        tr: "Kasa Açma",
        pt: "Abertura de Caixas",
        hi: "केस खोलना",
        es: "Apertura de Cajas",
      },
      Crash: {
        ru: "Краш",
        tr: "Çöküş",
        pt: "Queda",
        hi: "क्रैश",
        es: "Choque",
      },
      Jackpot: {
        ru: "Джекпот",
        tr: "Büyük İkramiye",
        pt: "Jackpot",
        hi: "जैकपॉट",
        es: "Jackpot",
      },
      Coinflip: {
        ru: "Монетка",
        tr: "Yazı Tura",
        pt: "Cara ou Coroa",
        hi: "सिक्का उछालना",
        es: "Lanzamiento de Moneda",
      },
      "Case Battle": {
        ru: "",
        tr: "Kasa Savaşı",
        pt: "Batalha de Caixas",
        hi: "केस बैटल",
        es: "Batalla de Cajas",
      },
      Casino: {
        ru: "",
        tr: "Kumarhane",
        pt: "Cassino",
        hi: "कैसिनो",
        es: "Casino",
      },
      More: {
        ru: "",
        tr: "Daha Fazla",
        pt: "Mais",
        hi: "अधिक",
        es: "Más",
      },
      
      "Popular CS2 Gambling Sites": {
        ru: "",
        tr: "Popüler CS2 Kumar Siteleri",
        pt: "Sites Populares de Apostas CS2",
        hi: "लोकप्रिय CS2 जुआ साइटें",
        es: "Sitios de Apuestas Populares de CS2",
      },
      "Popular Rust Gambling Sites": {
        ru: "",
        tr: "Popüler Rust Kumar Siteleri",
        pt: "Sites Populares de Apostas Rust",
        hi: "लोकप्रिय Rust जुआ साइटें",
        es: "Sitios de Apuestas Populares de Rust",
      },
      "Popular CS2 Trading Sites": {
        ru: "",
        tr: "Popüler CS2 Takas Siteleri",
        pt: "Sites Populares de Troca CS2",
        hi: "लोकप्रिय CS2 विनिमय साइटें",
        es: "Sitios de Intercambio Populares de CS2",
      },
      "Instant Sell Platforms": {
        ru: "",
        tr: "Hızlı Satış Hizmetleri",
        pt: "Serviços de Venda Rápida",
        hi: "त्वरित बिक्री सेवाएं",
        es: "Servicios de Venta Rápida",
      },
      "Best Task Services": {
        ru: "",
        tr: "En İyi Görev Hizmetleri",
        pt: "Melhores Serviços de Tarefas",
        hi: "सर्वश्रेष्ठ कार्य सेवाएं",
        es: "Mejores Servicios de Tareas",
      },
    };

    const textElement = element.querySelector(
      ".mods-box.skins-box .singlemod-select span, .boxes-holder-name h3"
    );
    if (textElement) {
      const text = textElement.innerText.trim();

      const normalizeText = (text, lang) => {
        if (lang === "tr") {
          return text.toLocaleLowerCase("tr-TR");
        }
        return text.toLowerCase();
      };

      const key = Object.keys(translations).find(
        (key) =>
          normalizeText(key, languageTag) === normalizeText(text, languageTag)
      );

      if (key && translations[key][languageTag]) {
        textElement.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = translations[key][languageTag];
          }
        });
      }
    }

    const boxesHolderModesElements = element.querySelectorAll(
      ".boxes-holder-modes, .boxes-holder-more"
    );

    boxesHolderModesElements.forEach((textElement) => {
      const text = textElement.innerText.trim();

      const normalizeText = (text, lang) => {
        if (lang === "tr") {
          return text.toLocaleLowerCase("tr-TR");
        }
        return text.toLowerCase();
      };

      const key = Object.keys(translations).find(
        (key) =>
          normalizeText(key, languageTag) === normalizeText(text, languageTag)
      );

      if (key && translations[key][languageTag]) {
        textElement.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = translations[key][languageTag];
          }
        });
      }
    });

    const dataTitle = element.getAttribute("data-title");
    if (dataTitle) {
      const normalizeText = (text, lang) => {
        if (lang === "tr") {
          return text.toLocaleLowerCase("tr-TR");
        }
        return text.toLowerCase();
      };

      const key = Object.keys(translations).find(
        (key) =>
          normalizeText(key, languageTag) ===
          normalizeText(dataTitle, languageTag)
      );
      if (key && translations[key][languageTag]) {
        element.setAttribute("data-title", translations[key][languageTag]);
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

  if ($('.main-infobox').length > 0) {
    var mainInfobox = $('.main-infobox');
    sliderContainer.insertAfter(mainInfobox);
} else if (path.includes('/reviews/') || path.includes('/mirrors/')) {
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
    prevArrow: '<button aria-label="Prev Slide" class="prev-button"><i class="officon chevron left"></i></button>',
    nextArrow: '<button aria-label="Next Slide" class="next-button"><i class="officon chevron right"></i></button>',
    dots: true,
    customPaging: function(slider, i) {
      return '<button class="slider-dot">' + (i + 1) + '</button>';
    },
  });

  function createSliderItem(href, src, label) {
    return '<a href="' + href + '" class="slider-banner" aria-label="Visit ' + label + '"><img src="' + src + '" alt="' + label + '" draggable="false"></a>';
  }
  const sliderlinks = document.querySelector('.slider-container');
  if (!languageTag === 'pl') { 
    updateURLs(sliderlinks);
  }
});

$(document).ready(function() {
  $(window).on('scroll resize', function() {
      var $pages = $('.pages');
      if ($pages.length && $(window).width() <= 1365) {
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
      },
      pl: {
        plusminus: 'Pros and Cons',
        screentable: 'Screenshots and Modes',
        sitedetails: 'Payment Methods',
        sitealternates: 'Similar Sites'
    },
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
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 120 &&
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
                      if (window.innerWidth >= 1365) {
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

document.addEventListener('DOMContentLoaded', function () {
  var boxes = document.querySelectorAll('.box:not(.main)');

  boxes.forEach(function (box) {
      var logoLink = box.querySelector('.logobg a');
      if (logoLink) {
          var href = logoLink.getAttribute('href');

          var firstParagraph = box.querySelector('.content p:first-child');
          if (firstParagraph) {
              var newLink = document.createElement('a');
              newLink.href = href;
              newLink.textContent = firstParagraph.textContent;
              newLink.classList.add('boxtitle');

              firstParagraph.replaceWith(newLink);
          }
      }
  });
});

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');
const themeStyleLink = document.getElementById('theme-style');

let currentTheme = localStorage.getItem('theme') || 'dark';
applyTheme(currentTheme);

function applyTheme(theme) {
  if (theme === 'light') {
    themeStyleLink.href = '/style_light.css';
    themeStyleLink.disabled = false;
    themeIcon.classList.replace('lightbulb-off', 'lightbulb-on');
  } else {
    themeStyleLink.href = '';
    themeStyleLink.disabled = true;
    themeIcon.classList.replace('lightbulb-on', 'lightbulb-off');
  }
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
});

document.addEventListener("DOMContentLoaded", function() {
  let currentPath = window.location.pathname;

  if (!currentPath.includes("/reviews/") && !currentPath.includes("/mirrors/")) {
      return;
  }

  const basePath = "/code-parts/site-infos";
  const altSitesPath = `${basePath}/sites-alts/`;
  const filterSettingsPath = "/code-parts/filter-settings.json";
  const reviewSettingsPath = "/code-parts/review-settings.json"; 
  const translationsPath = "/code-parts/review-translations.json"; 

  if (currentPath.endsWith(".html")) {
      currentPath = currentPath.slice(0, -5);
  }

  const pageKey = currentPath.split("/").pop();
  const jsonFilePath = `${basePath}/${pageKey}.json`;

  function loadPageData(filePath) {
      return fetch(filePath)
          .then(response => {
              if (!response.ok) {
                  return null;
              }
              return response.json();
          })
          .catch(() => null);
  }

  function insertHTMLContent(selector, contentArray) {
      const container = document.querySelector(selector);
      if (container && contentArray) {
          container.innerHTML = '';
          contentArray.forEach(htmlString => {
              container.insertAdjacentHTML('beforeend', htmlString);
          });
      }
  }

  function generateRatingStars(rating) {
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 !== 0;
      let starsHTML = '';

      for (let i = 0; i < fullStars; i++) {
          starsHTML += '<div class="officon star_rating full"></div>';
      }

      if (halfStar) {
          starsHTML += '<div class="officon star_rating half"></div>';
      }

      for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) {
          starsHTML += '<div class="officon star_rating empty"></div>';
      }

      return starsHTML;
  }

  function insertOverallRating(ratings) {
      const possibleRatings = ['Trust', 'Support', 'Payments', 'Functional', 'Price', 'Variety', 'Playability'];
      let sum = 0;
      let count = 0;

      possibleRatings.forEach(category => {
          if (ratings[category]) {
              sum += ratings[category];
              count++;
          }
      });

      if (count === 0) return;

      let averageRating = sum / count;

      if (averageRating < 4) {
          averageRating = Math.ceil(averageRating * 2) / 2;
      } else {
          averageRating = Math.floor(averageRating * 2) / 2;
      }

      const container = document.querySelector('.rating');
      if (container) {
          const liveratingDiv = document.createElement('div');
          liveratingDiv.classList.add('liverating');
          liveratingDiv.innerHTML = generateRatingStars(averageRating);

          container.appendChild(liveratingDiv);
          liveratingDiv.classList.add('fadein');
      }
  }

  function insertRatings(ratings) {
      const container = document.querySelector('.ratingsumm');
      if (container && ratings) {
          container.innerHTML = '';

          const ratingSection = document.createElement('div');
          ratingSection.classList.add('ratingsection');

          for (const [category, rating] of Object.entries(ratings)) {
              const ratingHTML = `
                  <div class="ratingway">
                      <span>${category}</span>
                      ${generateRatingStars(rating)}
                  </div>
              `;
              ratingSection.insertAdjacentHTML('beforeend', ratingHTML);
          }

          container.appendChild(ratingSection);

          insertOverallRating(ratings);
      }
  }

function insertFeatures(features, settings, featureOrder) {
    const featuresContainer = document.querySelector('.boxreview .features');
    if (featuresContainer) {
        if (features && features.length > 0) {
            const featuresBox = document.createElement('div');
            featuresBox.classList.add('featuresbox');

            const typesInside = document.createElement('div');
            typesInside.classList.add('typesinside');

            features.sort((a, b) => {
                const indexA = featureOrder.indexOf(a);
                const indexB = featureOrder.indexOf(b);
                return (indexA === -1 ? featureOrder.length : indexA) - (indexB === -1 ? featureOrder.length : indexB);
            });

            features.forEach(feature => {
                if (settings[feature]) {
                    const featureName = settings[feature].name || feature;
                    const featurePath = settings[feature].path || '#';
                    const featureClass = feature.toLowerCase().replace(/\s+/g, '-');
                    const featureIcon = settings[feature].icon || ''; 

                    const featureLink = `
                        <a href="${featurePath}" class="${featureClass}">
                            ${featureIcon ? `<i class="${featureIcon}"></i>` : ''} ${featureName}
                        </a>
                    `;
                    typesInside.insertAdjacentHTML('beforeend', featureLink);
                }
            });

            featuresBox.appendChild(typesInside);
            featuresContainer.appendChild(featuresBox);
            featuresContainer.classList.add('fadein');
        }
    }
}

  function sortAndInsertContent(content, order, selector) {
      if (content && content.length > 0) {
          content.sort((a, b) => {
              const classA = a.match(/class="([^"]+)"/)?.[1] || '';
              const classB = b.match(/class="([^"]+)"/)?.[1] || '';
              const indexA = order.indexOf(classA);
              const indexB = order.indexOf(classB);
              return (indexA === -1 ? order.length : indexA) - (indexB === -1 ? order.length : indexB);
          });

          insertHTMLContent(selector, content);
      }
  }

  function translateTextElements(translations) {
    var siteprosElements = document.querySelectorAll('.sitedetails .sitepros span');
    for (var i = 0; i < siteprosElements.length; i++) {
        var element = siteprosElements[i];
        var originalText = element.textContent.trim();
        
        if (translations.hasOwnProperty(originalText)) {
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = node.textContent.replace(originalText, translations[originalText]);
                }
            });
        }
    }

    var ratingwayElements = document.querySelectorAll('.ratingsection .ratingway span, .content button, .boxreview .plusminus .criteria .par p, .features .featuresbox .typesinside a, .instruction li');
    for (var j = 0; j < ratingwayElements.length; j++) {
        var element = ratingwayElements[j];
        var originalText = element.textContent.trim();

        if (translations.hasOwnProperty(originalText)) {
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = node.textContent.replace(originalText, translations[originalText]);
                }
            });
        }
    }
}



  function insertAlternatives(alternatives) {
    let siteAlternates = document.querySelector('.sitealternates');
    let siteAlternatesBoxes;

    const mainSiteName = document.querySelector('.box.main .content p').textContent.trim();

    let alternatesTitle = '';
    switch (languageTag) {
        case 'ru':
            alternatesTitle = `Лучшие Аналоги ${mainSiteName}`;
            break;
        case 'en':
            alternatesTitle = `Best ${mainSiteName} Alternatives`;
            break;
        case 'tr':
            alternatesTitle = `En İyi ${mainSiteName} Alternatifleri`;
            break;
        case 'pl':
            alternatesTitle = `Najlepsze alternatywy dla ${mainSiteName}`;
            break;
        default:
            alternatesTitle = `Best ${mainSiteName} Alternatives`;
    }

    if (siteAlternates) {
        siteAlternates.innerHTML = `<div class="alternates-title">${alternatesTitle}</div><div class="sitealternatesboxes"></div>`;
    } else {
        const screentable = document.querySelector('.screentable');
        siteAlternates = document.createElement('div');
        siteAlternates.className = 'sitealternates';
        siteAlternates.innerHTML = `<div class="alternates-title">${alternatesTitle}</div><div class="sitealternatesboxes"></div>`;
        screentable.insertAdjacentElement('afterend', siteAlternates);
    }

    siteAlternatesBoxes = siteAlternates.querySelector('.sitealternatesboxes');

    alternatives.forEach(alt => {
        const altJsonPath = `${altSitesPath}${alt}.json`;
        loadPageData(altJsonPath).then(altData => {
            const altBox = document.createElement('div');
            altBox.className = 'box';
            altBox.id = altData.name;

            let rewardText = altData.reward;
            if (languageTag === 'ru' && altData.reward_ru) {
                rewardText = altData.reward_ru;
            } else if (languageTag === 'tr' && altData.reward_tr) {
                rewardText = altData.reward_tr;
            } else if (languageTag === 'pl' && altData.reward_pl) {
                rewardText = altData.reward_pl;
            }

            let reviewLink = `/reviews/${alt}`;

            altBox.innerHTML = `
                <div class="logobg">
                    <a href="${reviewLink}"><img src="${altData.logo}" loading="lazy" draggable="false" alt="${altData.name}"></a>
                </div>
                <div class="content">
                    <a class="boxtitle" href="${reviewLink}">${altData.name}</a>
                    <div class="site-reward">
                        <p>${rewardText}</p>
                    </div>
                <div class="content-buttons">
                    <a href="${reviewLink}" aria-label="Read Review" class="review-button"></a>
                    <a href='${altData.link}' aria-label="Visit WebSite" target="_blank" class="review-button visit"></a>
                </div>
                </div>`;

            siteAlternatesBoxes.appendChild(altBox);
        });
    });

    function addStarRatingAlternatives() {
      for (var boxId in ratings) {
        addStarRating(boxId, ratings[boxId]);
      }
    }

    Promise.all(alternatives.map(alt => loadPageData(`${altSitesPath}${alt}.json`)))
        .then(() => {
            for (let i = alternatives.length; i < 4; i++) {
                const emptyBox = document.createElement('div');
                emptyBox.className = 'box';
                siteAlternatesBoxes.appendChild(emptyBox);
            }
            addStarRatingAlternatives();
            updateURLs(siteAlternatesBoxes);
        });
}

  Promise.all([loadPageData(jsonFilePath), loadPageData(filterSettingsPath), loadPageData(reviewSettingsPath), loadPageData(translationsPath)])
      .then(([pageData, filterSettings, reviewSettings, translations]) => {
          if (pageData && reviewSettings) {
              sortAndInsertContent(pageData.gamemodesContent, reviewSettings.gamemodesOrder, '.gamemodes .featuresbox .typesinside');
              const methodOrder = reviewSettings.paymentMethodsOrder;
              sortAndInsertContent(pageData.firstMethodContent, methodOrder, '.methodlist#first');
              sortAndInsertContent(pageData.secondMethodContent, methodOrder, '.methodlist#second');
              insertFeatures(pageData.featuresContent, filterSettings, reviewSettings.featureOrder);
              insertRatings(pageData.ratings);
              
              if (pageData["Sites Alternatives"] && pageData["Sites Alternatives"].length > 0) {
                  insertAlternatives(pageData["Sites Alternatives"]);
              }
          }

          if (translations) {
              const languageTag = document.documentElement.lang || 'en';
              if (translations[languageTag]) {
                  translateTextElements(translations[languageTag]);
              }
          }
          const reviewlinks = document.querySelectorAll('.boxreview, .box-extra-links');
          reviewlinks.forEach(link => {
              updateURLs(link);
          });
      });
});

document.addEventListener('DOMContentLoaded', function() {
  const navBarContainer = document.createElement('div');

  fetch('/code-parts/nav-bar.html')
    .then(response => response.text())
    .then(data => {
      navBarContainer.innerHTML = data;

      const header = document.querySelector('header');
      if (!header) return;

      header.insertAdjacentElement('afterend', navBarContainer.firstChild);

      const categorySelector = document.querySelector('.category-selector');
      const menuToggle = document.querySelector('.menu-toggle');
      const navBar = document.querySelector('.nav-bar');
      const pages = document.querySelector('.pages');

      if (menuToggle && navBar) {
        menuToggle.addEventListener('click', () => {
          navBar.classList.toggle('active');
          menuToggle.classList.toggle('active');
          pages.classList.toggle('hardhidden');
        });

        navBar.addEventListener('click', event => {
          if (event.target === categorySelector) {
            menuToggle.classList.remove('active');
            navBar.classList.remove('active');
            pages.classList.remove('hardhidden');
          }
        });
      }

      const bigCategoriesnav = document.querySelectorAll('#notexist .big-category');

      bigCategoriesnav.forEach(category => {
        category.addEventListener('click', function(e) {
          const submenu2 = category.querySelector(".submenu2");
          if (submenu2 && window.innerWidth <= 1365 && !e.target.matches('.submenu2 a')) {
            e.preventDefault();
          }

          bigCategoriesnav.forEach(otherCategory => {
            if (otherCategory !== category) {
              otherCategory.classList.remove('active');
            }
          });
          this.classList.toggle('active');
        });
      });

      const boxContainerNav = document.querySelector('#notexist');
      if (boxContainerNav) {
        boxContainerNav.addEventListener("click", e => {
          const targetBox = e.target.closest(".category-box");

          if (targetBox) {
            const parentListItem = targetBox.closest("div.category");
            const submenu = parentListItem.querySelector(".submenu");

            const isTargetBoxNewest = targetBox.classList.contains("newest");

            if (!isTargetBoxNewest && window.innerWidth <= 1365) {
              e.preventDefault();
            }

            document.querySelectorAll(".category-box").forEach(box => {
              if (box !== targetBox) {
                box.classList.remove("current");
                const siblingSubmenu = box.closest("div.category").querySelector(".submenu");
                if (siblingSubmenu) {
                  siblingSubmenu.classList.remove("current");
                }
              }
            });
            boxContainerNav.classList.remove("current");

            targetBox.classList.toggle("current");

            const isActive = Array.from(document.querySelectorAll(".category-box")).some(box =>
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

      if (languageTag === 'en' || languageTag === 'pl') {
        applyTranslations(document.body, languageTag, {});
        translateURLs2(document.body, languageTag);
      } else {
        const translationFile = `/code-parts/category-translations/${languageTag}.json`;

        fetch(translationFile)
          .then(response => response.json())
          .then(translations => {
            applyTranslations(document.body, languageTag, translations);
            translateURLs2(document.body, languageTag);
          });
      }
    });
});

function loadAndApplyTranslations(languageTag) {
  const cacheKey = `translations_${languageTag}`;
  let translations = JSON.parse(localStorage.getItem(cacheKey));

  if (translations || (languageTag === 'en' || languageTag === 'pl')) {
      applyTranslations(document.body, languageTag, translations);
      translateURLs2(document.body, languageTag);
  } else {
      const translationFile = `/code-parts/category-translations/${languageTag}.json`;

      fetch(translationFile)
          .then(response => response.json())
          .then(data => {
              localStorage.setItem(cacheKey, JSON.stringify(data));
              applyTranslations(document.body, languageTag, data);
              translateURLs2(document.body, languageTag);
          });
  }
}

function applyTranslations(element, languageTag, translations) {
  translateElements(element, languageTag, translations);

  const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                      translateElements(node, languageTag, translations);
                  }
              });
          }
      });
  });

  observer.observe(element, { childList: true, subtree: true });
}

function translateElements(element, languageTag, translations) {
  const elements = element.querySelectorAll('.category-box-content span, .category .submenu li a, .category .submenu li .nonredir');
  
  elements.forEach(el => {
    const text = el.textContent.trim();
    
    if (languageTag === 'tr') {
      const lowercaseText = text.toLocaleLowerCase('tr-TR');
      const translatedText = translations[lowercaseText] || translations[text];

      if (translatedText && !el.classList.contains('translated')) {
        el.innerHTML = translatedText;
        el.classList.add('translated');
      }
    } else if (languageTag === 'en' || languageTag === 'pl') {
      el.classList.add('translated');
    } else if (translations[text]) {
      if (translations.hasOwnProperty(text)) {
        if (!el.classList.contains('translated')) {
            if (!el.classList.contains('translated')) {
              el.innerHTML = translations[text];
              el.classList.add('translated');
            }
        }
      }
    }
  });
}

function translateURLs2(parentElement, languageTag) {
  if (!parentElement || !languageTag || languageTag.length !== 2) {
    return;
  }
  
  const links = parentElement.querySelectorAll('.category a[href]');
  const supportedLanguages = ["hi", "tr", "pt", "es", "ru"];
  
  if (!supportedLanguages.includes(languageTag) || languageTag === 'en') {
    return;
  }

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const url = new URL(href, window.location.href);
    let path = url.pathname;
    const queryString = url.search;

    if (path === '/') {
      path = `/${languageTag}`;
    } else if (path.startsWith('/topic')) {
      if (languageTag === 'ru' && !path.startsWith('/ru/topic')) {
        path = `/ru${path}`;
      }
    } else {
      const pathSegments = path.split('/').filter(segment => segment);
      if (pathSegments.length === 0 || pathSegments[0] !== languageTag) {
        if (!path.startsWith(`/${languageTag}/`)) {
          path = `/${languageTag}${path}`;
        }
      }
    }

    link.setAttribute('href', url.origin + path + queryString);
  });
}


function loadCategoryContent(category) {
  const link = category.querySelector('.category-box');
  const href = link.getAttribute('href');

  const fileMap = {
    '/cs2': '/code-parts/category-import/csgo.html',
    '/rust': '/code-parts/category-import/rust.html',
    '/crypto': '/code-parts/category-import/crypto.html',
    '/freebies': '/code-parts/category-import/freebies.html',
    '/earning': '/code-parts/category-import/earning.html',
    '/dota': '/code-parts/category-import/dota.html',
    '/steam/levelup': '/code-parts/category-import/steam.html',
    '/newest': ''
  };

  const htmlFile = fileMap[href] || '';

  if (htmlFile) {
    fetch(htmlFile)
      .then(response => response.text())
      .then(data => {
        category.insertAdjacentHTML('beforeend', data);
        loadAndApplyTranslations(document.documentElement.lang || 'en');
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.category').forEach(category => {
      loadCategoryContent(category);
  });

  loadAndApplyTranslations(languageTag);
});


document.addEventListener("DOMContentLoaded", function () {
  if (
    !window.location.pathname.includes("/skins/") &&
    !window.location.pathname.includes("/items/") &&
    !window.location.pathname.includes("/cases/") &&
    !window.location.pathname.includes("/collections/") &&
    !window.location.pathname.includes("/sticker-crafts/") &&
    !window.location.pathname.includes("/reviews") &&
    !window.location.pathname.includes("/mirrors") &&
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us")
  ) {
    const boxContainer = document.querySelector(".category-selector");
    const pages = document.querySelector(".pages");
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
    prevButtonContainer.innerHTML = '<i class="officon chevron left"></i>';
    nextButtonContainer.classList.add("controls-button");
    nextButtonContainer.setAttribute("aria-label", "Next Category");
    nextButtonContainer.innerHTML = '<i class="officon chevron right"></i>';

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
      const bigCategoryLink = e.target.closest(".big-category a");
      const submenu2 = e.target.closest(".submenu2");

      if (submenu2) {
          return;
      }

      if (targetBox) {
          const parentListItem = targetBox.closest(".category");
          const submenu = parentListItem.querySelector(".submenu");

          const isTargetBoxNewest = targetBox.classList.contains("newest");

          if (!isTargetBoxNewest && window.innerWidth <= 1365) {
              e.preventDefault();
          }

          const allTargetBoxes = document.querySelectorAll(".category-box");
          allTargetBoxes.forEach((box) => {
              if (box !== targetBox) {
                  box.classList.remove("current");
                  const parentListItem = box.closest(".category");
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
              pages.classList.add("hardplaced");
          }

          if (submenu) {
              submenu.classList.toggle("current");
              centerSubmenu(submenu);
          }
      }

      if (bigCategoryLink) {
        const bigCategory = bigCategoryLink.closest(".big-category");
        const hasSubmenu2 = bigCategory.querySelector(".submenu2");
    
        if (hasSubmenu2 && window.innerWidth <= 1365) {
            e.preventDefault();
        }
    
        const isActive = bigCategory.classList.contains("active");
    
        const bigCategories = document.querySelectorAll(".big-category.active");
        bigCategories.forEach((item) => {
            item.classList.remove("active");
            const submenu2 = item.querySelector(".submenu2");
            if (submenu2) {
                submenu2.classList.remove("current");
            }
        });
    
        if (!isActive) {
            bigCategory.classList.add("active");
            const submenu2 = bigCategory.querySelector(".submenu2");
            if (submenu2) {
                submenu2.classList.add("current");
            }
        }
    }
    

      if (e.target.closest(".submenu2 a")) {
          return;
      }
  });
  
  var categorySelector = document.querySelector('.category-selector');
    categorySelector.addEventListener('click', function(event) {
        if (event.target === categorySelector) {
            const boxescurrent = boxContainer.querySelectorAll('.category-box.current');
            const submenucurrent = boxContainer.querySelectorAll('.submenu.current');
            boxContainer.classList.remove('current');
            pages.classList.remove("hardplaced");

            boxescurrent.forEach(function(box) {
                box.classList.remove('current');
            });

            submenucurrent.forEach(function(submenu) {
                submenu.classList.remove('current');
            });

            const activeBigCategories = document.querySelectorAll('.big-category.active');
            activeBigCategories.forEach((item) => {
                item.classList.remove('active');
                const submenu2 = item.querySelector(".submenu2");
                if (submenu2) {
                    submenu2.classList.remove('current');
                }
            });
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
      startY = touch.pageY;
  });
  
  boxContainer.addEventListener("touchmove", (e) => {
      if (!isMouseDown) return;
  
      const touch = e.touches[0];
      const x = touch.pageX - boxContainer.offsetLeft;
      const y = touch.pageY;
  
      const horizontalMove = Math.abs(x - startX);
      const verticalMove = Math.abs(y - startY);
  
      if (horizontalMove > verticalMove) {
          const walk = (x - startX) * 1.2;
          const newScrollLeft = scrollLeft - walk;
          boxContainer.scrollLeft = newScrollLeft;
          buttonScrollPosition = newScrollLeft;
      }
  });
  
  boxContainer.addEventListener("touchend", () => {
      isMouseDown = false;
  });
  

  var categorySelector = document.querySelector("div.category-selector");
  var categoryElements = Array.from(
    categorySelector.querySelectorAll("div.category-selector > div.category")
  );
  
  categoryElements.sort(function (a, b) {
    var aCategoryBox = a.querySelector("a.category-box, div.category-box");
    var bCategoryBox = b.querySelector("a.category-box, div.category-box");
  
    var aWeight = (aCategoryBox.classList.contains("active") ? -2 : 0) +
                  (aCategoryBox.classList.contains("last") ? 1 : 0);
    var bWeight = (bCategoryBox.classList.contains("active") ? -2 : 0) +
                  (bCategoryBox.classList.contains("last") ? 1 : 0);
  
    if (aWeight !== bWeight) {
      return aWeight - bWeight;
    }
  
    return Math.random() - 0.5;
  });
  
  categorySelector.innerHTML = "";
  
  categoryElements.forEach(function (element) {
    categorySelector.appendChild(element);
  });
  
  

    buttonsContainer.scrollLeft = buttonScrollPosition;

    function centerSubmenu(submenu) {
      const screenWidth = window.innerWidth;
      const submenuWidth = submenu.offsetWidth;
      const scrollLeft = boxContainer.scrollLeft;

      const offsetX = (screenWidth - submenuWidth) / 2 + scrollLeft;
      submenu.style.left = `${offsetX}px`;
    }
  }
});

$(document).ready(function(){
  var res = $(window).width();

  $('.main-mode-selection').slick({
    slidesToShow: res < 600 ? 2 : 4,
    slidesToScroll: 1,
    autoplay: true,
    infinite: true,
    speed: 450,
    autoplaySpeed: 5500,
    pauseOnHover: true,
    prevArrow: '<button aria-label="Prev Slide" class="prev-button controls-button"><i class="officon chevron left"></i></button>',
    nextArrow: '<button aria-label="Next Slide" class="next-button controls-button"><i class="officon chevron right"></i></button>',
    dots: false
  });
  const modesslider = document.querySelector('.main-mode-selection');
  updateURLs(modesslider);
});
