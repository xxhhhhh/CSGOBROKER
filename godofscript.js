const StorageHelper = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },

  getJSON: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  setJSON: (key, obj) => {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch {}
  },

  setWithExpiry: (key, value, durationMs) => {
    const now = Date.now();
    const data = { value, expiry: now + durationMs };
    StorageHelper.setJSON(key, data);
  },

  getWithExpiry: (key) => {
    const item = StorageHelper.getJSON(key);
    if (!item || Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },

  initVersion: ({ versionKey = 'version', currentVersion }) => {
    const savedVersion = localStorage.getItem(versionKey);
    if (savedVersion !== currentVersion) {
      localStorage.clear();
      localStorage.setItem(versionKey, currentVersion);
    }
  }
};

StorageHelper.initVersion({ currentVersion: '1.21' });

function isRuPage(pathname) {
  return pathname.startsWith('/ru/') || pathname === '/ru' || pathname === '/ru.html';
}

/**
 * Копирует текст в буфер обмена. Показывает визуальный отклик через showCopied.
 * @param {string|Element} source - Строка или DOM-узел, из которого берётся текст.
 * @param {Element} copyButton - Кнопка-источник для showCopied.
 */
function copyToClipboard(source, copyButton) {
  const text = typeof source === "string" ? source : (source?.textContent || "").trim();
  if (!text) return;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard
      .writeText(text)
      .then(() => showCopied(copyButton))
      .catch(() => {
        const tempInput = document.createElement("textarea");
        tempInput.value = text;
        tempInput.style.position = "fixed";
        tempInput.style.opacity = "0";
        document.body.appendChild(tempInput);
        tempInput.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(tempInput);
        showCopied(copyButton);
      });
  } else {
    const tempInput = document.createElement("input");
    document.body.appendChild(tempInput);
    tempInput.value = text;
    tempInput.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(tempInput);
    showCopied(copyButton);
  }
}

function showCopied(copyButton) {
  const title = document.createElement("div");
  title.className = "copied-title";
  title.textContent = (typeof languageTag !== "undefined" && languageTag === "ru") ? "Скопировано" : "Copied";
  copyButton.appendChild(title);
  copyButton.classList.add("icon-changed");

  title.style.display = "none";
  $(title).fadeIn(150, function () {
    $(this).delay(400).fadeOut(150, function () {
      $(this).remove();
    });
  });

  setTimeout(() => copyButton.classList.remove("icon-changed"), 800);
}

(function () {
  function getTextFromTarget(btn) {
    const explicit = btn.getAttribute("data-copy-text");
    if (explicit) return explicit;

    const codeAttr = btn.getAttribute("code") || btn.getAttribute("data-code");
    if (codeAttr) return String(codeAttr);

    const targetSel = btn.getAttribute("data-copy-target");
    if (targetSel) {
      const el = document.querySelector(targetSel);
      if (el) {
        const val = "value" in el ? el.value : (el.textContent || "");
        const trimmed = (val ?? "").toString().trim();
        if (trimmed) return trimmed;
      }
    }

    const prev = btn.previousElementSibling;
    if (prev) {
      if (prev.tagName === "CODE") return prev.textContent.trim();
      if (prev.tagName === "PRE") {
        const innerCode = prev.querySelector("code");
        if (innerCode) return innerCode.textContent.trim();
      }
    }

    const siteCode = document.getElementById("site-code");
    if (siteCode) {
      const sc = (siteCode.value ?? siteCode.textContent ?? "").toString().trim();
      if (sc) return sc;
    }

    return "";
  }

  function onClick(e) {
    const btn = e.target.closest("[data-copy], .copy, .site-promo-copy");
    if (!btn) return;

    e.preventDefault();

    const text = getTextFromTarget(btn);
    if (!text) return;

    copyToClipboard(text, btn);
  }

  document.addEventListener("click", onClick, { passive: false });
})();

  $(document).ready(function() {
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
  });

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');
let currentTheme = (StorageHelper.getJSON('theme_settings') || {}).theme || getSystemPreferredTheme();

applyTheme(currentTheme, false);

window.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.classList.contains('transitions-disabled')) {
    replaceTransitionClass();
  }
});

function getSystemPreferredTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function replaceTransitionClass() {
  const html = document.documentElement;

  setTimeout(() => {
    html.classList.remove('transitions-disabled');
    html.classList.add('transitions-enabled');

    setTimeout(() => {
      html.classList.remove('transitions-enabled');
    }, 200);
  }, 100);
}

function temporarilyDisableTransitions() {
  const html = document.documentElement;

  html.classList.remove('transitions-enabled');
  html.classList.add('transitions-disabled');

  replaceTransitionClass();
}

function applyTheme(theme, withTransition = true) {
  if (withTransition) temporarilyDisableTransitions();

  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  StorageHelper.setJSON('theme_settings', { ...(StorageHelper.getJSON('theme_settings') || {}), theme });
  localStorage.setItem('theme', theme);

  const link = document.getElementById('theme-style');

  if (theme === 'light') {
    if (link) { link.href = '/style_light.css'; link.disabled = false; }
    themeIcon.classList.replace('lightbulb-off', 'lightbulb-on');
  } else {
    if (link) { link.disabled = true; link.href = ''; }
    themeIcon.classList.replace('lightbulb-on', 'lightbulb-off');
  }
}

themeToggleBtn.addEventListener('click', () => {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme, true);
});

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
  
    if (!languageTag || languageTag === 'en' || languageTag === 'pl') {
      return;
    }
  
    links.forEach(link => {
      if (link.closest('div.instruction') || link.closest('div.instruction-mirrors') || link.closest('div.site-attention')) {
        return;
      }
  
      if ((languageTag === 'tr' || languageTag === 'es') && link.classList.contains('mirror-redirect')) {
        return;
      }

      if (languageTag !== 'ru' && link.classList.contains('mirror-visit')) {
        return;
      }
  
      let href = link.getAttribute('href');

      if (/^(https?:|mailto:|tel:)/i.test(href)) return;

      if (href.includes('/topic') && languageTag !== 'ru') {
        return;
      }
  
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
        if (languageTag === 'pt' || languageTag === 'hi') {
          if (!link.classList.contains('review-button') && !link.classList.contains('boxtitle') && !link.closest('.box')) {
            link.setAttribute('href', href);
          }
        } else {
          link.setAttribute('href', href);
        }
      }
      
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Googlebot')) {
      function replaceDomain(url) {
        return url.replace('csgobroker.cc', 'csgobroker.me');
      }

      const elements = document.querySelectorAll(
        'link[rel="canonical"], link[rel="alternate"], meta[property="og:url"]'
      );

      elements.forEach(element => {
        let href = element.getAttribute('href');
        if (href) {
          element.setAttribute('href', replaceDomain(href));
        }
      });

      const metaElements = document.querySelectorAll('meta[property="og:url"]');
      metaElements.forEach(element => {
        let content = element.getAttribute('content');
        if (content) {
          element.setAttribute('content', replaceDomain(content));
        }
      });
    }
  });

  (function () {
    const userAgent = navigator.userAgent;
    if (!userAgent.includes('Googlebot')) return;

    function replaceDomainInJson(json) {
      if (typeof json === 'string') {
        return json.replace('csgobroker.cc', 'csgobroker.me');
      } else if (Array.isArray(json)) {
        return json.map(replaceDomainInJson);
      } else if (typeof json === 'object' && json !== null) {
        const newObj = {};
        for (let key in json) {
          newObj[key] = replaceDomainInJson(json[key]);
        }
        return newObj;
      }
      return json;
    }

    const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
    ldJsonScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        const updatedData = replaceDomainInJson(data);
        script.textContent = JSON.stringify(updatedData);
      } catch (e) {
      }
    });
  })();

  

  const path = window.location.pathname;
  const excludePaths = [
      "/topic",
      "/reviews/",
      "/mirrors/",
      "/privacy-policy",
      "/terms-of-service",
      "/contact-us"
  ];
  
  const isExcluded = excludePaths.some(excludedPath => path.includes(excludedPath));
  const isErrorPage = document.getElementById('error-404');
  
  if (languageTag === 'ru' && !isExcluded && !isErrorPage) {
      updateURLs(sitesList);
  }
  
  if (
    !isErrorPage &&
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

    function getLocalizedSwitchText(lang) {
      var languageName = getLanguageName(lang);
      switch (currentLanguage) {
          case "en": return "Switch language to " + languageName;
          case "ru": return "Сменить язык на " + languageName;
          case "pt": return "Mudar idioma para " + languageName;
          case "es": return "Cambiar idioma a " + languageName;
          case "tr": return "Dili değiştir " + languageName;
          case "hi": return "भाषा बदलें " + languageName;
          default: return "Switch language to " + languageName;
      }
  }
  
  function createLanguageListItem(lang, path) {
      var ariaLabelText = getLocalizedSwitchText(lang);
      return `
          <li>
              <a href="${path}" 
                 class="lang-switch lang-${lang}" 
                 data-lang="${lang}" 
                 aria-label="${ariaLabelText}">
                  <i class="flagbox"></i>
              </a>
          </li>`;
  }
    
    function checkAndAddLanguage(lang) {
        const path = lang === "en"
            ? window.location.pathname.replace(/^\/[a-z]{2}\//, "/")
            : "/" + lang + window.location.pathname.replace(/^\/[a-z]{2}\//, "/");

        fetch(path, { method: 'HEAD' }).then(response => {
            if (response.ok && currentLanguage !== lang) {
                langMenuDiv.querySelector("ul").innerHTML += createLanguageListItem(lang, path);
            }
        });
    }
    
    var newContent = `
        <div class="selected-lang">
            ${getLanguageName(currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1).toLowerCase())}
        </div>
        <ul></ul>`;
    langMenuDiv.innerHTML = newContent;
    
    supportedLanguages.forEach(function(lang) {
        checkAndAddLanguage(lang);
    });
    
  }

  if (
    window.location.pathname.includes("/mirrors/") ||
    window.location.pathname.includes("/reviews/")
  ) {
    document.addEventListener("DOMContentLoaded", () => {
      const langMenuDiv = document.querySelector(".lang-menu");
      const basePath = "/code-parts/site-infos";
      const currentPath = window.location.pathname;
    
      if (!langMenuDiv) return;
    
      function getLanguageName(lang) {
        switch (lang) {
          case "en": return "English";
          case "ru": return "Русский";
          case "es": return "Español";
          case "tr": return "Türkçe";
          case "pl": return "Polski";
          default: return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
        }
      }
    
      function getLocalizedSwitchText(lang) {
        const languageName = getLanguageName(lang);
        switch (languageTag) {
          case "en": return "Switch language to " + languageName;
          case "ru": return "Сменить язык на " + languageName;
          case "es": return "Cambiar idioma a " + languageName;
          case "tr": return "Dili değiştir " + languageName;
          case "pl": return "Zmień język na " + languageName;
          default: return "Switch language to " + languageName;
        }
      }
    
      async function fetchSiteLanguages() {
        const siteKey = currentPath.split("/").pop().replace(".html", "") || "index";
        const jsonFilePath = `${basePath}/${siteKey}.json`;
    
        try {
          const response = await fetch(jsonFilePath);
          if (!response.ok) return [];
          const siteInfo = await response.json();
          let languages = siteInfo.languages
            ? siteInfo.languages.split(",").map((lang) => lang.trim())
            : [];
    
          if (currentPath.includes("/mirrors/")) {
            languages = languages.filter((lang) => ["ru", "en"].includes(lang));
          }
    
          return languages;
        } catch {
          return [];
        }
      }
    
      async function populateLangList() {
        const languages = await fetchSiteLanguages();
    
        if (languages.length === 0) return;
    
        const existingLangList = langMenuDiv.querySelector("ul");
        if (existingLangList) existingLangList.remove();
    
        const langList = document.createElement("ul");
        langMenuDiv.appendChild(langList);
    
        const languageOrder = ["en", "ru", "es", "tr", "pl"];
        const sortedLanguages = languages.sort((a, b) => {
          return languageOrder.indexOf(a) - languageOrder.indexOf(b);
        });
    
        sortedLanguages.forEach((lang) => {
          if (lang === languageTag) return;
    
          const listItem = document.createElement("li");
          const switchEl = document.createElement("a");
    
          switchEl.classList.add("lang-switch", `lang-${lang}`);
          switchEl.dataset.lang = lang;
    
          const path =
            lang === "en"
              ? currentPath.replace(/^\/[a-z]{2}\//, "/")
              : `/${lang}${currentPath.replace(/^\/[a-z]{2}\//, "/")}`;
    
          switchEl.href = path;
    
          switchEl.setAttribute("aria-label", getLocalizedSwitchText(lang));
    
          const flagBox = document.createElement("i");
          flagBox.classList.add("flagbox");
          switchEl.appendChild(flagBox);
    
          listItem.appendChild(switchEl);
          langList.appendChild(listItem);
        });
      }
    
      populateLangList();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const existingLangSwitches = document.querySelectorAll(".lang-switch");
  
    function getLanguageName(lang) {
      switch (lang) {
        case "en": return "English";
        case "ru": return "Русский";
        case "es": return "Español";
        case "tr": return "Türkçe";
        case "pt": return "Português";
        case "hi": return "हिन्दी";
        default: return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
      }
    }
  
    function getLocalizedSwitchText(lang) {
      const languageName = getLanguageName(lang);
      switch (languageTag) {
        case "en": return "Switch language to " + languageName;
        case "ru": return "Сменить язык на " + languageName;
        case "es": return "Cambiar idioma a " + languageName;
        case "tr": return "Dili değiştir " + languageName;
        case "pt": return "Mudar idioma para " + languageName;
        case "hi": return "भाषा बदलें " + languageName;
        default: return "Switch language to " + languageName;
      }
    }
  
    existingLangSwitches.forEach((switchEl) => {
      const lang = switchEl.dataset.lang;
  
      if (!lang || lang === languageTag) return;
  
      const ariaLabelText = getLocalizedSwitchText(lang);
      switchEl.setAttribute("aria-label", ariaLabelText);
    });
  });

  const fallbackLang = 'en';
  
if (supportedLanguages.includes(languageTag)) {
  const cacheKey = 'infobox_translations';
  const cacheExpiryKey = `${cacheKey}_expiry`;
  const maxCacheAge = 24 * 60 * 60 * 1000;

  const cachedDataRaw = StorageHelper.get(cacheKey);
  const cachedExpiry = parseInt(StorageHelper.get(cacheExpiryKey), 10);

  const insertInfobox = (texts) => {
    const html = `
      <div class="main-infobox">
        <div class="main-infobox-mascotte"></div>
        <div class="main-infobox-content">
          <div class="main-infobox-content-text">
            <div class="main-infobox-content-block">
              <p>${texts.p1}</p>
              <p>${texts.p2}</p>
            </div>
          </div>
        </div>
        <div class="main-infobox-content second">
          <div class="main-infobox-content-text">
            <div class="main-infobox-content-block">
              <p>${texts.p3}</p>
              <p>${texts.p4}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const criteriaDescriptions = document.querySelector('.criteria-descriptions');
    if (window.location.pathname.includes('/reviews/')) {
      const boxReview = document.querySelector('.boxreview');
      if (boxReview) {
        boxReview.insertAdjacentHTML('beforeend', html);
    } else if (criteriaDescriptions) {
      criteriaDescriptions.insertAdjacentHTML('afterend', html);
      }
    } else {
      const insertionPoint = document.querySelector('.boxes-holder');
      if (insertionPoint) {
        insertionPoint.insertAdjacentHTML('afterend', html);
      }
    }
  };

  const fetchAndInsert = () => {
    fetch('/code-parts/micro-parts/main-infobox/infobox-translations.json')
      .then(response => response.json())
      .then(allTranslations => {
        StorageHelper.set(cacheKey, JSON.stringify(allTranslations));
        StorageHelper.set(cacheExpiryKey, (Date.now() + maxCacheAge).toString());

        const texts = allTranslations[languageTag] || allTranslations[fallbackLang];
        insertInfobox(texts);
      })
      .catch(err => console.error('Failed to fetch infobox translations:', err));
  };

  if (cachedDataRaw && cachedExpiry && Date.now() < cachedExpiry) {
    try {
      const allTranslations = JSON.parse(cachedDataRaw);
      const texts = allTranslations[languageTag] || allTranslations[fallbackLang];
      insertInfobox(texts);
    } catch (e) {
      fetchAndInsert();
    }
  } else {
    fetchAndInsert();
  }
}

  

$(document).ready(function(){
  $('.screentable .screens').slick({
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
    const isExcludedPath = excludedPaths.some(path => pathname.includes(path));

    let buttonsContainer = document.querySelector('.buttons-container-page');
    let parentElement = document.querySelector('.ssiodox');
    
    if (!buttonsContainer) {
      buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'buttons-container-page';
    
      if (parentElement) {
        parentElement.appendChild(buttonsContainer);
      } else {
      }
    }
    
    if (isRuPage && !isExcludedPath && !document.querySelector('#button-route-filter')) {
      const routeButtonContainer = document.createElement('div');
      routeButtonContainer.className = 'settings-menu';
      routeButtonContainer.innerHTML =
        '<div class="settings-button" id="button-route-filter" data-title="Скрыть сайты с Ограниченным Доступом"><i id="globe-icon" class="officon route-shield"></i></div>';
    
      buttonsContainer.appendChild(routeButtonContainer);
    
      const routeIcon = document.getElementById('globe-icon');
    
      function toggleRouteBlocks() {
        const routeBlocks = document.querySelectorAll('.box');
        routeBlocks.forEach(block => {
          if (block.querySelector('.route')) {
            block.classList.toggle('hidden-route');
          }
        });
      }
    
      function initializeRouteState() {
        const buttonState = StorageHelper.get('routeButtonState');
        if (buttonState === 'hidden') {
          toggleRouteBlocks();
          routeIcon.classList.replace('route-shield', 'route-shield-slash');
        }
    
        const buttonTitle = StorageHelper.get('routeButtonTitle');
        if (buttonTitle) {
          document.getElementById('button-route-filter').dataset.title = buttonTitle;
        }
      }
    
      const observer = new MutationObserver(() => {
        const buttonState = StorageHelper.get('routeButtonState');
        if (buttonState === 'hidden') {
          const routeBlocks = document.querySelectorAll('.box');
          routeBlocks.forEach(block => {
            if (block.querySelector('.route')) {
              block.classList.add('hidden-route');
            }
          });
        }
      });
    
      observer.observe(document.body, { childList: true, subtree: true });
    
      document.getElementById('button-route-filter').addEventListener('click', function () {
        toggleRouteBlocks();
    
        const currentState = StorageHelper.get('routeButtonState') || 'visible';
        const newState = currentState === 'hidden' ? 'visible' : 'hidden';
        StorageHelper.set('routeButtonState', newState);
    
        routeIcon.classList.toggle('route-shield');
        routeIcon.classList.toggle('route-shield-slash');
    
        const button = document.getElementById('button-route-filter');
        button.dataset.title = routeIcon.classList.contains('route-shield') ?
          'Скрыть сайты с Ограниченным Доступом' : 'Показать сайты с Ограниченным Доступом';
    
        StorageHelper.set('routeButtonTitle', button.dataset.title);
      });
    
      initializeRouteState();
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
let fuse = null;

const CACHE_KEY = 'search_data';
const CACHE_DURATION_MS = 1000 * 60 * 60;

function loadCombinedSearchData() {
  const cached = StorageHelper.get(CACHE_KEY);
  const now = Date.now();

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const { configData, translationData, expiry } = parsed;

      if (expiry && now < expiry) {
        return Promise.resolve({ configData, translationData });
      }
    } catch (e) {
      console.warn('Ошибка чтения кэша:', e);
    }
  }

  return Promise.all([
    fetch('/code-parts/search-config/config.json').then(res => res.json()),
    fetch('/code-parts/search-config/translations.json').then(res => res.json())
  ]).then(([configData, translationData]) => {
    const expiry = now + CACHE_DURATION_MS;
    const cacheObject = { configData, translationData, expiry };
    StorageHelper.set(CACHE_KEY, JSON.stringify(cacheObject));
    return { configData, translationData };
  });
}

function prepareFuseData() {
  const list = sites.map(path => {
    const trans = siteTranslations[path] || {};
    return {
      path,
      label: trans.og || trans.en || trans.ru || path,
      en: trans.en || '',
      ru: trans.ru || '',
      og: trans.og || '',
      keywords: (trans.keywords || []).join(' '),
      icon: trans.icon || ''
    };
  });

  fuse = new Fuse(list, {
    keys: ['label', 'en', 'ru', 'og', 'keywords'],
    threshold: 0.4,
    minMatchCharLength: 2,
    ignoreLocation: true
  });
}

loadCombinedSearchData().then(({ configData, translationData }) => {
  sites = configData.sites;
  siteTranslations = translationData;
  prepareFuseData();
});

function getPathClass(path) {
  const pathLower = path.toLowerCase();

  const isSkins = /(trade-skins|sell-skins|trade-items|sell-items|buy-skins|buy-items|instant-sell|marketplaces)(\/|$)/.test(pathLower);
  if (isSkins) return 'skins';

  if (/topic(\/|$)/.test(pathLower)) return 'topic';
  if (pathLower.includes('/steam/')) return 'steam';
  if (pathLower.includes('/reviews/')) return 'review';
  if (/earning(\/|$)/.test(pathLower)) return 'earning';

  return 'gambling';
}

function shouldPrefixPath(path, language) {
  const isTopic = /\/topic(\/|$)/.test(path);
  const isMirrors = /\/mirrors\//.test(path);
  const isReviews = /\/reviews\//.test(path);

  if (isTopic || isMirrors) return language === 'ru';
  if (isReviews) return ['ru', 'es', 'tr'].includes(language);

  return ['ru', 'es', 'tr', 'pt', 'hi'].includes(language);
}

function createSiteItem(path) {
  const trans = siteTranslations[path] || {};
  const label = trans.og || (languageTag === 'ru' ? trans.ru || trans.en : trans.en || trans.ru) || path;
  const icon = trans.icon;

  const li = document.createElement('li');
  li.className = `site-item show ${getPathClass(path)}`;

  const link = document.createElement('a');
  link.href = shouldPrefixPath(path, languageTag) ? `/${languageTag}${path}` : path;

  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = '';
    img.className = 'site-icon';
    link.appendChild(img);
  }

  link.appendChild(document.createTextNode(label));
  li.appendChild(link);
  return li;
}

function handleSearchInput() {
  const searchTerm = searchInput.value.toLowerCase();
  siteList.innerHTML = '';

  const closeButton = document.querySelector('#search-form .close-button');
  if (searchTerm === '') {
    if (closeButton) closeButton.classList.remove('visible');
    siteList.classList.remove('show');
    siteList.classList.add('hidden');
    return;
  } else {
    if (closeButton) closeButton.classList.add('visible');
  }

  const fragment = document.createDocumentFragment();
  const results = fuse.search(searchTerm, { limit: 50 });

  if (results.length > 0) {
    results.forEach(({ item }) => {
      const li = createSiteItem(item.path);
      fragment.appendChild(li);
    });
    siteList.classList.remove('hidden');
    siteList.classList.add('show');
    siteList.appendChild(fragment);
  } else {
    siteList.classList.remove('show');
    siteList.classList.add('hidden');
  }
}

searchInput.addEventListener('input', handleSearchInput);

document.addEventListener('DOMContentLoaded', () => {
  const paymentForm = document.getElementById('search-form');

  let closeButton = paymentForm.querySelector('.close-button');
  if (!closeButton) {
    closeButton = document.createElement('div');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '<i class="officon cross"></i>';
    paymentForm.appendChild(closeButton);
  }

  closeButton.addEventListener('click', () => {
    searchInput.value = '';
    closeButton.classList.remove('visible');
    siteList.innerHTML = '';
    siteList.classList.remove('show');
    siteList.classList.add('hidden');
    searchInput.focus();
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value !== '') {
      closeButton.classList.add('visible');
      siteList.classList.remove('hidden');
      siteList.classList.add('show');
    } else {
      closeButton.classList.remove('visible');
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
    }
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      siteList.classList.remove('show');
      siteList.classList.add('hidden');
    }, 150);
  });

  const searchEnabler = document.querySelector('.search-enabler');
  const searchContainer = document.querySelector('.search-container');

  if (searchEnabler) {
    const activateSearchUI = () => {
      searchInput.classList.add('active');
      searchEnabler.classList.add('disabled');
      searchContainer.classList.add('expanded');
    };

    searchEnabler.addEventListener('click', activateSearchUI);

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('s');
    if (query) {
      activateSearchUI();
      searchInput.value = query;
      setTimeout(() => {
        searchInput.dispatchEvent(new Event('input'));
      }, 50);
    }
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

function addStarRating(boxId, rating) {
  const boxElement = document.getElementById(boxId);
  if (boxElement) {
    const starRatingHTML = `
      <div class="rating-case-single">
        <div class="star_rating officon"></div>
        <div class="rating-summ">${rating.toFixed(2)}</div>
      </div>
    `;
    const logobgElement = boxElement.querySelector('.logobg');
    if (logobgElement) {
      logobgElement.innerHTML += starRatingHTML;
    }
  }
}

function handleRouteDisplay(boxElements) {
  const requiredRoute = window.requiredRoute || [];
  const maybeRoute = window.maybeRoute || [];

  const routeMessageDiv = document.createElement('div');
  routeMessageDiv.className = 'route';
  routeMessageDiv.textContent = 'Доступ ограничен';

  const routeSemiMessageDiv = document.createElement('div');
  routeSemiMessageDiv.className = 'route-semi';

  const routeMessageIcon = document.createElement('div');
  routeMessageIcon.className = 'officon globe';
  routeSemiMessageDiv.appendChild(routeMessageIcon);

  boxElements.forEach(boxElement => {
    const boxId = boxElement.id;

    if (requiredRoute.includes(boxId)) {
      if (boxElement.closest('.boxes-holder-section')) {
        const clonedDiv = routeSemiMessageDiv.cloneNode(true);
        boxElement.appendChild(clonedDiv);
      } else {
        const logobgElement = boxElement.querySelector('.logobg');
        if (logobgElement) {
          const clonedDiv = routeMessageDiv.cloneNode(true);
          logobgElement.appendChild(clonedDiv);
        }
      }
    } else if (maybeRoute.includes(boxId)) {
      if (boxElement.closest('.boxes-holder-section')) {
        const clonedDiv = routeSemiMessageDiv.cloneNode(true);
        boxElement.appendChild(clonedDiv);
      } else {
        const logobgElement = boxElement.querySelector('.logobg');
        if (logobgElement) {
          const clonedDiv = routeSemiMessageDiv.cloneNode(true);
          logobgElement.appendChild(clonedDiv);
        }
      }
    }
  });
}

function renderData() {
  const boxesHolder = document.querySelector(
    ".boxes-holder, .sitealternatesboxes"
  );
  if (boxesHolder && window.ratings) {
    for (const boxId in window.ratings) {
      addStarRating(boxId, window.ratings[boxId]);
    }
  }

  if (
    window.location.pathname.startsWith("/ru/") ||
    window.location.pathname === "/ru" ||
    window.location.pathname === "/ru.html"
  ) {
    const boxElements = document.querySelectorAll(".box");
    handleRouteDisplay(boxElements);
  }
}


renderData();

const cachedSettings = StorageHelper.getWithExpiry('sites_info');

if (cachedSettings) {
  useSettings(cachedSettings);
} else {
  fetch('/code-parts/sites-settings.json')
    .then(response => response.json())
    .then(settings => {
      StorageHelper.setWithExpiry('sites_info', settings, 1000 * 60 * 60); // 1 час
      useSettings(settings);
    });
}

function useSettings(settings) {
  window.ratings = settings.ratings;
  window.requiredRoute = settings.RequiredRoute;
  window.maybeRoute = settings.MaybeRoute;

  const ratings = window.ratings;
  const requiredRoute = window.requiredRoute;
  const maybeRoute = window.maybeRoute;

  renderData();
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
  function createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  }

  const lang = typeof languageTag !== 'undefined' ? languageTag : 'en';
  const cacheKey = 'newest_boxes_json';
  const cacheDuration = 12 * 60 * 60 * 1000; // 12h

  const titles = {
    ru: 'Недавно Добавленные',
    tr: 'Yeni Eklenenler',
    pt: 'Recentemente Adicionados',
    es: 'Recientemente Añadidos',
    hi: 'हाल ही में जोड़ा गया',
  };

  const moreText = lang === 'ru' ? 'Больше' : 'More';
  const moreHref = lang === 'ru' ? '/ru/newest' : '/newest';

  const buildBox = (entry) => {
  const reviewHref = lang === 'ru' ? `/ru${entry.reviewHref}` : entry.reviewHref;
  const visitHref = entry.visitHref;
  const bonus = lang === 'ru' ? entry.bonus_ru : entry.bonus;
  const alt = lang === 'ru' ? `Логотип ${entry.site}` : `${entry.site} logo`;
  const labelReview = lang === 'ru' ? `Читать Обзор ${entry.site}` : `Read Review ${entry.site}`;
  const labelVisit = lang === 'ru' ? `Перейти на ${entry.site}` : `Visit ${entry.site}`;

  const box = document.createElement('div');
  box.className = 'box';
  box.id = entry.site;

  const bonusHTML = bonus ? `<div class="best">${bonus}</div>` : '';

  box.innerHTML = `
    <div class="logobg">
      <a href="${reviewHref}"><img src="${entry.logoSrc}" loading="lazy" draggable="false" alt="${alt}"></a>
      ${bonusHTML}
    </div>
    <div class="content">
      <a href="${reviewHref}" class="review-button" aria-label="${labelReview}"></a>
      <a href="${visitHref}" aria-label="${labelVisit}" target="_blank" rel="noopener" class="review-button visit"></a>
    </div>
  `;

  return box;
  };



  const applyBoxes = (json) => {
    const newestBoxesDiv = createElement('div', 'newest-boxes');
    if (lang === 'ru') newestBoxesDiv.classList.add('lang-ru');
    const newestBoxesTitleDiv = createElement('div', 'newest-boxes-title');
    const newestBoxesIconDiv = createElement('div', 'singlemod-icon officon newest');
    const newestBoxesTitleBoxDiv = createElement('div', 'newest-boxes-title-box');

    const titleSpan = document.createElement('span');
    titleSpan.textContent = titles[lang] || 'Recently Added';

    const newestBoxesMoreLink = createElement('a', 'newest-boxes-more');
    newestBoxesMoreLink.href = moreHref;
    newestBoxesMoreLink.textContent = moreText;

    newestBoxesTitleBoxDiv.append(newestBoxesIconDiv, titleSpan);
    newestBoxesTitleDiv.appendChild(newestBoxesTitleBoxDiv);
    newestBoxesTitleDiv.appendChild(newestBoxesMoreLink);
    newestBoxesDiv.appendChild(newestBoxesTitleDiv);

    json.forEach(entry => {
      newestBoxesDiv.appendChild(buildBox(entry));
    });

    const sliderContainer = document.querySelector('.slider-container');
    const insertBeforeElement = sliderContainer ? sliderContainer.nextSibling : document.querySelector('footer');
    insertBeforeElement.parentNode.insertBefore(newestBoxesDiv, insertBeforeElement);
  };

  const cached = StorageHelper.getWithExpiry(cacheKey);
  if (cached) {
    applyBoxes(cached);
  } else {
    const jsonPath = '/code-parts/newest-boxes.json';

    fetch(jsonPath)
      .then((res) => res.json())
      .then((json) => {
        StorageHelper.setWithExpiry(cacheKey, json, cacheDuration);
        applyBoxes(json);
      })
      .catch(console.error);
  }
}



function forcemodsboxes() {
  const importedMods = {};
  const url = cleanUrl(window.location.href);
  const pageType = getPageType(url);
  const isMulti = isMultiBoxPage(url);

  loadModsJSON().then((modsData) => {
    const boxesToLoad = getBoxesToLoad(pageType, isMulti, url);
    boxesToLoad.forEach(box => loadBox(box, modsData));
  });

  // --------- HELPERS ---------

  function getBoxesToLoad(type, isMulti, url) {
    const multiBoxes = {
      csgo: ["csgo-skins", "csgo"],
      rust: ["rust-skins", "rust"],
      dota: ["dota-items", "dota"]
    };

    const singleBoxes = {
      csgo: ["csgo"],
      rust: ["rust"],
      dota: ["dota"],
      tf2: ["tf2-items"],
      freebies: ["freebies"],
      crypto: ["crypto"]
    };

    if (multiBoxes[type] && isMulti) return multiBoxes[type];
    if (singleBoxes[type]) return singleBoxes[type];

    // fallback logic
    if (url.includes("/csgo/") || url.endsWith("/cs2") || url.endsWith("/cs2.html") || url.endsWith("/") || url.endsWith("index.html")) {
      return ["csgo"];
    } else if (url.includes("/rust/") || url.endsWith("/rust")) {
      return ["rust"];
    } else if (url.includes("/dota/") || url.endsWith("/dota")) {
      return ["dota"];
    }

    return [];
  }

  function loadBox(boxId, modsData) {
    if (importedMods[boxId] || !modsData[boxId]) return;

    const container = document.querySelector(".boxes-holder");
    insertModsBox(container, boxId, modsData[boxId]);
    importedMods[boxId] = true;
  }

  function insertModsBox(container, boxId, boxData) {
    const items = Array.isArray(boxData.items) ? boxData.items : boxData;
    if (!Array.isArray(items)) return;

    const box = document.createElement("div");
    box.className = "mods-box";
    box.dataset.boxId = boxId;
    if (boxData.horizontal) box.classList.add("skins-box");

    const main = document.createElement("div");
    main.className = "mods-main-box";

    items.forEach((item) => {
      const itemBox = document.createElement("div");
      itemBox.className = "singlemod-box";
      const a = document.createElement("a");
      a.className = "singlemod-select";
      a.href = item.href;

      if (item.img) {
        const img = document.createElement("img");
        img.src = item.img.src;
        img.alt = item.img.alt;
        a.appendChild(img);
      } else if (item.icon) {
        const icon = document.createElement("div");
        icon.className = `singlemod-icon officon ${item.icon}`;
        a.appendChild(icon);
      }

      if (boxData.horizontal) {
        const span = document.createElement("span");
        span.textContent = item.title;
        a.appendChild(span);
      } else {
        itemBox.dataset.title = item.title;
      }

      itemBox.appendChild(a);
      main.appendChild(itemBox);
    });

    box.appendChild(main);

    const existing = container.querySelector(`[data-box-id="${boxId}"]`);
    existing ? container.replaceChild(box, existing) : container.prepend(box);

    const lang = extractLanguageTagFromHTML();
    if (lang && ["ru", "tr", "pt", "hi", "es"].includes(lang)) {
      box.querySelectorAll(".singlemod-box").forEach(el => translateElement(el, lang));
    }

    setTimeout(() => {
      box.querySelectorAll(".singlemod-box").forEach(el => {
        const link = el.querySelector("a").href;
        if (cleanUrl(window.location.href).includes(link)) {
          el.classList.add("active");
        }
      });
    });

    updateURLs(box);
  }

  function cleanUrl(url) {
    return url.split("?")[0].toLowerCase();
  }

  function getPageType(url) {
    const types = ["csgo", "rust", "dota", "tf2", "freebies", "crypto"];
    return types.find(type =>
      url.includes(`/${type}/`) || url.endsWith(`/${type}`) || url.endsWith(`/${type}.html`)
    ) || "other";
  }

  function isMultiBoxPage(url) {
    const patterns = [
      "buy-skins",  "buy-items", "sell-items", "trade-items",
      "sell-skins", "trade-skins", "instant-sell", "marketplaces"
    ];
    const u = cleanUrl(url);
    return patterns.some(p => u.endsWith(`/${p}`) || u.endsWith(`/${p}.html`));
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
        ru: "Быстрая Продажа",
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
      "Bonuses to Sale": {
        ru: "Бонусы к Продаже",
        tr: "Satışa Ek Bonuslar",
        pt: "Bônus na Venda",
        hi: "बिक्री के लिए बोनस",
        es: "Bonos para la Venta",
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
      Slots: {
        ru: "",
        tr: "Kumarhane",
        pt: "Cassino",
        hi: "कैसिनो",
        es: "Slots",
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

    let textElement = element.querySelector(".singlemod-select span");

    if (!textElement) {
      const dataTitle = element.getAttribute("data-title");
      if (dataTitle) {
        textElement = {
          nodeType: Node.TEXT_NODE,
          textContent: dataTitle,
          update: (text) => element.setAttribute("data-title", text)
        };
      }
    }
    
    
    if (textElement && typeof textElement.textContent === "string") {
      const text = textElement.textContent.trim();
    
      const normalizeText = (text, lang) => {
        return lang === "tr" ? text.toLocaleLowerCase("tr-TR") : text.toLowerCase();
      };
    
      const key = Object.keys(translations).find(
        (key) =>
          normalizeText(key, languageTag) === normalizeText(text, languageTag)
      );
    
      if (key && translations[key][languageTag]) {
        if (textElement.update) {
          textElement.update(translations[key][languageTag]);
        } else {
          textElement.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent = translations[key][languageTag];
            }
          });
        }
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
    { href: '/rust', src: '/img/best-rust-sites-slide-2024.png', label: 'Best Rust Sites' },
    { href: '/earning/offerwalls', src: '/img/earn-skins-slider-2024.png', label: 'Best Offerwall Sites' }
  ];

  if (languageTag === 'ru') {
    sliderItems = [
      { href: '/ru', src: '/img/best-gambling-sites-slide-2024-ru.png', label: 'Лучшие Гемблинг Сайты CS2' },
      { href: '/ru/rust', src: '/img/best-rust-sites-slide-2024-ru.png', label: 'Лучшие Сайты Rust' },
      { href: '/ru/earning/offerwalls', src: '/img/earn-skins-slider-2024-ru.png', label: 'Лучшие Сайты с Заданиями' }
    ];
  }

  var sliderContainer = $('<div class="slider-container"></div>');
  sliderItems.forEach(function(item) {
    sliderContainer.append(createSliderItem(item.href, item.src, item.label));
  });

  if ($('.boxes-holder').length > 0) {
    var mainInfobox = $('.main-infobox');
    sliderContainer.insertAfter(mainInfobox);
  } else if ($('.main-infobox').length > 0) {
    var mainInfobox = $('.main-infobox');
    sliderContainer.insertBefore(mainInfobox);
} else if (path.includes('/reviews/') || path.includes('/mirrors/')) {
    var boxReview = $('.boxreview');
    boxReview.append(sliderContainer);
}  else if (path.includes('/topic/') && $('.topicpage').length > 0) {
    var boxTopic = $('.topicpage');
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

/* eslint-disable */
(function(){
  const path = window.location.pathname;

  // REVIEW PAGE: навешиваем клики на уже сгенерированный оффлайн-блок
  if (path.includes('/reviews/')) {
    function highlight(targetEl){
      if (!targetEl) return;
      targetEl.classList.remove('navmark');
      void targetEl.offsetWidth;
      targetEl.classList.add('navmark');
      targetEl.addEventListener('animationend', function h(){ targetEl.classList.remove('navmark'); targetEl.removeEventListener('animationend', h); });
    }
    function scrollToEl(el, offset){
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top - (offset||150);
      window.scrollTo({ top, behavior:'smooth' });
    }

    // rating click → прокрутка к .ratingsumm (без cursor: pointer)
    (function bindRating(){
      const ratingTrigger = document.querySelector('.box.main .rating');
      const ratingTarget  = document.querySelector('.ratingsumm');
      if (!ratingTrigger || !ratingTarget) return;
      ratingTrigger.addEventListener('click', ()=>{ scrollToEl(ratingTarget, 200); highlight(ratingTarget); });
    })();

    // nav-review clicks
    const nav = document.querySelector('.box-extra-links .nav-review');
    if (nav){
      const lis = Array.from(nav.querySelectorAll('li'));
      lis.forEach(li=>{
        li.addEventListener('click', ()=>{
          const sel = li.getAttribute('data-target');
          const el  = sel ? document.querySelector(sel) : null;
          if (el){ scrollToEl(el, 150); }
          if (sel==='.smallreview') highlight(document.querySelector('.smallreview'));
          else if (sel==='.instruction') highlight(document.querySelector('.instruction'));
          else if (el) highlight(el);

          if (sel==='.sitedetails'){
            document.querySelectorAll('.sitedetails .sitepros').forEach(sp=>sp.classList.toggle('active'));
            if (window.innerWidth >= 1365){
              const parent = document.querySelector('.sitedetails');
              if (parent){
                let max=0;
                parent.querySelectorAll('.sitepros .methodlist').forEach(m=>{ max = Math.max(max, m.offsetHeight || 0); });
                const one = parent.querySelector('.sitepros');
                const total = (one ? one.offsetHeight : 0) + max;
                const cur = parseInt(window.getComputedStyle(parent).height) || 0;
                if (parent.querySelectorAll('.sitepros.active').length){ if (cur < total) parent.style.height = total+'px'; }
                else { parent.style.height = ''; }
              }
            }
          }
        });
      });

      // подсветка активного пункта при скролле
      function highlightCurrent(){
        const threshold = 300;
        let current = -1;
        lis.forEach((li, idx)=>{
          const sel = li.getAttribute('data-target');
          const el  = sel ? document.querySelector(sel) : null;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.top - threshold <= 0) current = idx;
        });
        if (current === -1) current = 0;
        lis.forEach((li,i)=> li.classList.toggle('current', i===current));
      }
      highlightCurrent();
      window.addEventListener('scroll', highlightCurrent);
      window.addEventListener('resize', highlightCurrent);
    }

  // TOPIC PAGE: оставляем кликабельность как была
  } else if (path.includes('/topic/')) {
    const navReview = document.querySelector('.nav-review.blog');
    if (!navReview) return;

    const navItems = navReview.querySelectorAll('li');
    const textColInfos = document.querySelectorAll('.text-col-info');
    if (navItems.length !== textColInfos.length) return;

    const threshold = 220;
    navItems.forEach((li, index) => {
      const targetElement = textColInfos[index];
      li.addEventListener('click', () => {
        const rect = targetElement.getBoundingClientRect();
        const offsetTop = window.scrollY + rect.top - 150;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        targetElement.classList.remove('navmark'); void targetElement.offsetWidth;
        targetElement.classList.add('navmark');
        targetElement.addEventListener('animationend', function handler() {
          targetElement.classList.remove('navmark');
          targetElement.removeEventListener('animationend', handler);
        });
      });
    });

    function highlightTopicSection() {
      let currentIndex = -1;
      textColInfos.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top - threshold <= 0) currentIndex = index;
      });
      if (currentIndex === -1) currentIndex = 0;
      navItems.forEach((li, index) => { li.classList.toggle('current', index === currentIndex); });
    }
    highlightTopicSection();
    window.addEventListener('scroll', highlightTopicSection);
    window.addEventListener('resize', highlightTopicSection);
  }
})();

const boxes = Array.from(document.querySelectorAll('.box:not(.main)'));

boxes.forEach((box) => {
  const logoLink = box.querySelector('.logobg a[href]');
  if (!logoLink) return;

  const href = logoLink.getAttribute('href');
  const h4 = box.querySelector('.content h4:first-child');
  if (!h4) return;

  // Если в h4 уже есть ссылка — выходим, чтобы не делать вложенные <a>
  if (h4.querySelector('a')) return;

  const a = document.createElement('a');
  a.href = href;
  a.classList.add('boxtitle');

  // Переносим ВСЁ текущее содержимое h4 внутрь ссылки (сохраняет разметку/иконки и т.п.)
  while (h4.firstChild) {
    a.appendChild(h4.firstChild);
  }

  h4.appendChild(a);
});


const categorySelector = document.querySelector('.category-selector');
const categoryContentURL = '/code-parts/category-import/category-contents.json';
const builderURL = '/code-parts/category-import/category-builder.json';
let cachedCategoryContent = null;
let pendingCategories = [];

function loadAndApplyTranslations(languageTag) {
  const cacheKey = `category_translations`;
  const cachedTranslations = JSON.parse(StorageHelper.get(cacheKey));

  if (cachedTranslations) {
    const translations = cachedTranslations[languageTag];
    applyTranslations(document.body, languageTag, translations);
    updateURLs(categorySelector);
  } else {
    fetch(`/code-parts/category-import/category-translations.json`)
      .then(res => res.json())
      .then(allTranslations => {
        StorageHelper.set(cacheKey, JSON.stringify(allTranslations));
        const translations = allTranslations[languageTag];
        applyTranslations(document.body, languageTag, translations);
        updateURLs(categorySelector);
      });
  }
}


function applyTranslations(element, languageTag, translations) {
  translateElements(element, languageTag, translations);

  new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateElements(node, languageTag, translations);
        }
      });
    });
  }).observe(element, { childList: true, subtree: true });
}

function translateElements(element, languageTag, translations) {
  if (!translations) return;

  element.querySelectorAll('.category-box-content span, .category .submenu li a, .category .submenu li .nonredir').forEach(el => {
    const text = el.textContent.trim();
    if (el.classList.contains('translated')) return;

    if (languageTag === 'tr') {
      const key = text.toLocaleLowerCase('tr-TR');
      el.innerHTML = translations[key] || translations[text] || text;
    } else if (languageTag !== 'en' && languageTag !== 'pl' && translations[text]) {
      el.innerHTML = translations[text];
    }
    el.classList.add('translated');
  });
}


function createCategoryStructureFromBuilder(data) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('category-selector');
  wrapper.id = 'notexist';

  data.categories.forEach(cat => {
    const category = document.createElement('div');
    category.classList.add('category');

    const box = document.createElement('a');
    box.classList.add('category-box');
    box.href = cat.href;
    cat.classes?.forEach(cls => box.classList.add(cls));

    const logo = document.createElement('div');
    logo.classList.add('category-box-logo');
    logo.innerHTML = `<img src="${cat.logo}" alt="${cat.label}">`;

    const content = document.createElement('div');
    content.classList.add('category-box-content');
    content.innerHTML = `<span>${cat.label}</span>`;

    box.append(logo, content);
    category.appendChild(box);
    wrapper.appendChild(category);
  });

  setupCategorySelectorLogic(wrapper);
  return wrapper;
}

function setupCategorySelectorLogic(boxContainer) {
  const pages = document.querySelector('.pages');

  boxContainer.addEventListener("click", e => {
    const targetBox = e.target.closest(".category-box");
    const bigLink = e.target.closest(".big-category a");

    if (e.target.closest(".submenu2 a")) {
      return;
    }

    if (targetBox) {
      const category = targetBox.closest(".category");
      const submenu = category.querySelector(".submenu");
      const isNewest = targetBox.classList.contains("newest");

      if (!isNewest && window.innerWidth <= 1365) e.preventDefault();

      boxContainer.querySelectorAll(".category-box").forEach(box => {
        if (box !== targetBox) {
          box.classList.remove("current");
          box.closest(".category")?.querySelector(".submenu")?.classList.remove("current");
        }
      });

      targetBox.classList.toggle("current");
      const anyActive = [...boxContainer.querySelectorAll(".category-box")].some(b => b.classList.contains("current"));
      boxContainer.classList.toggle("current", anyActive);
      pages?.classList.toggle("hardplaced", anyActive);
      if (submenu && window.innerWidth <= 1365) submenu.classList.toggle("current");
    }

    if (bigLink) {
      const bigCategory = bigLink.closest(".big-category");
      const submenu2 = bigCategory.querySelector(".submenu2");
      const isActive = bigCategory.classList.contains("active");

      if (submenu2 && window.innerWidth <= 1365) e.preventDefault();

      boxContainer.querySelectorAll(".big-category.active").forEach(el => {
        el.classList.remove("active");
        el.querySelector(".submenu2")?.classList.remove("current");
      });

      if (!isActive) {
        bigCategory.classList.add("active");
        submenu2?.classList.add("current");
      }
    }

    if (e.target === boxContainer) {
      const navBar = document.querySelector('.nav-bar');
      const menuToggle = document.querySelector('.menu-toggle');
      const pages = document.querySelector('.pages');
      navBar.classList.remove('active');
      menuToggle.classList.remove('active');
      pages?.classList.remove('hardhidden');
    }
  });
}

function insertNotExistSelector(builderData) {
  const ssiodox = document.querySelector('.ssiodox');
  if (!ssiodox) return;

  const navBar = document.createElement('div');
  navBar.className = 'nav-bar';

  const centralizer = document.createElement('div');
  centralizer.className = 'category-centralizer nav';

  const selector = createCategoryStructureFromBuilder(builderData);
  centralizer.appendChild(selector);
  navBar.appendChild(centralizer);
  ssiodox.appendChild(navBar);

  setTimeout(() => updateURLs(selector), 250);

  document.querySelectorAll('#notexist .category').forEach(loadCategoryContent);
}

function loadSecondarySelector() {
  fetch(builderURL)
    .then(res => res.json())
    .then(insertNotExistSelector)
    .catch(err => console.error('Failed to load category builder:', err));
}

function loadCategoryContent(category) {
  const link = category.querySelector('.category-box');
  const href = link?.getAttribute('href');
  if (!href) return;

  const categoryKey = href.replace(/^\/+/, '').split('/')[0];

  const insertCategoryContent = (data) => {
    const catData = data.categories?.[categoryKey];
    if (!catData?.items) return;
    category.insertAdjacentHTML('beforeend', generateCategoryHTML(catData.items));
    loadAndApplyTranslations(languageTag);
  };

  if (cachedCategoryContent) {
    insertCategoryContent(cachedCategoryContent);
  } else {
    pendingCategories.push({ insertCategoryContent });

    if (pendingCategories.length === 1) {
      fetch(categoryContentURL)
        .then(res => res.json())
        .then(data => {
          cachedCategoryContent = data;
          pendingCategories.forEach(({ insertCategoryContent }) => insertCategoryContent(data));
          pendingCategories = [];
        })
        .catch(err => {
          console.error('Failed to load category content:', err);
          pendingCategories = [];
        });
    }
  }
}

function generateCategoryHTML(items) {
  return `
    <ul class="submenu">
      ${items.map(item => `
        <li class="big-category">
          <a href="${item.url}">${item.title}</a>
          ${item.children ? `
            <ul class="submenu2">
              ${item.children.map(child => `<li><a href="${child.url}">${child.title}</a></li>`).join('')}
            </ul>
          ` : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector(".menu-toggle")?.addEventListener("click", () => {
    const navBar = document.querySelector(".nav-bar");
    const pages = document.querySelector(".pages");
    navBar.classList.toggle("active");
    document.querySelector(".menu-toggle").classList.toggle("active");
    pages?.classList.toggle("hardhidden", navBar.classList.contains("active"));
  });

  loadSecondarySelector();
  document.querySelectorAll('.category').forEach(loadCategoryContent);
  loadAndApplyTranslations(languageTag);
});


document.addEventListener("DOMContentLoaded", function () {
  if (
    !window.location.pathname.includes("/skins/") &&
    !window.location.pathname.includes("/items/") &&
    !window.location.pathname.includes("/cases/") &&
    !window.location.pathname.includes("/stickers/") &&
    !window.location.pathname.includes("/collections/") &&
    !window.location.pathname.includes("/guides/") &&
    !window.location.pathname.includes("/sticker-crafts/") &&
    !window.location.pathname.includes("/reviews") &&
    !window.location.pathname.includes("/mirrors") &&
    !window.location.pathname.includes("/privacy-policy") &&
    !window.location.pathname.includes("/terms-of-service") &&
    !window.location.pathname.includes("/contact-us") &&
    !isErrorPage
    
  ) {
    const boxContainer = document.querySelector(".category-selector");
    const pages = document.querySelector(".pages");
    const SpaceboxContainer = document.querySelector(".spaceblock");
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

          if (submenu && window.innerWidth <= 1365) {
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
  
    var aWeight = (aCategoryBox.classList.contains("active") || aCategoryBox.classList.contains("locked") ? -2 : 0) +
    (aCategoryBox.classList.contains("last") ? 1 : 0);
    var bWeight = (bCategoryBox.classList.contains("active") || bCategoryBox.classList.contains("locked") ? -2 : 0) +
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

$(document).ready(function() {
  if ($('.main-mode-selection').length && !$('.main-mode-selection').hasClass('slick-slider')) {

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
  }

  $('.boxes-holder').each(function() {
    const $boxesHolder = $(this);
    const $boxes = $boxesHolder.children('.box');
  
    if (!$boxesHolder.closest('.main-page').length && $boxes.length >= 12) {
      const importPath = languageTag === 'ru' 
        ? '/code-parts/micro-parts/main-mode-import-ru.html'
        : '/code-parts/micro-parts/main-mode-import.html';
  
      $.get(importPath, function(data) {
        const $importedContent = $(data);
        $boxes.eq(11).after($importedContent);
  
        if (!$importedContent.hasClass('slick-slider')) {
          const res = $(window).width();
          $importedContent.slick({
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
        }
      });
    }
  });
  
});

window.initPayments = function () {
  const basePath = "/code-parts/site-infos";
  const boxesHolder = document.querySelector(".boxes-holder");
  const paymentsButton = document.querySelector(".payments-button");

  if (!paymentsButton || !boxesHolder) return;

  const boxes = Array.from(boxesHolder.querySelectorAll(".box"));

  let depositList, withdrawalList, depositInput, withdrawalInput;
  let paymentContainersLoaded = false;

  const originalOrder = boxes.slice();

  function loadPaymentMethods(filePath) {
    return fetch(filePath).then(res => res.json());
  }

  function transformLinkToDiv(htmlString) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString.trim();
    const link = tempDiv.querySelector("a");
    if (!link) return htmlString;

    const aria = link.getAttribute("aria-label") || "";
    const className = link.className || "";
    const div = document.createElement("div");
    div.className = `payment-method ${className}`;
    div.textContent = aria;
    return div.outerHTML;
  }

  function addMethodWithoutDuplicates(arr, set, html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html.trim();
    const link = tempDiv.querySelector("a");
    if (!link) return;

    const label = link.getAttribute("aria-label") || "";
    if (!set.has(label)) {
      arr.push(html);
      set.add(label);
    }
  }

  function populatePaymentList(container, list) {
    container.innerHTML = "";
    list.forEach(html => container.insertAdjacentHTML("beforeend", transformLinkToDiv(html)));
  }

  function reorderBoxesToFront() {
    const visible = boxes.filter(box => !box.classList.contains("hidden-deposit") && !box.classList.contains("hidden-withdrawal"));
    const sortedVisible = originalOrder.filter(b => visible.includes(b));
    const hidden = originalOrder.filter(b => !visible.includes(b));
    [...sortedVisible, ...hidden].forEach(box => boxesHolder.appendChild(box));
  }

  function restoreOriginalBoxOrder() {
    originalOrder.forEach(box => boxesHolder.appendChild(box));
  }

  function allFiltersCleared() {
    return boxes.every(box => !box.classList.contains("hidden-deposit") && !box.classList.contains("hidden-withdrawal"));
  }

  function animateBoxesSequentially(visibleBoxes) {
    visibleBoxes.forEach((box, index) => {
      const delay = (index + 1) * 0.15;
      box.style.animationDelay = `${delay}s`;
      box.classList.add("animate-in");
      box.addEventListener("animationend", () => {
        box.classList.remove("animate-in");
        box.style.animationDelay = "";
        box.classList.remove("was-hidden");
      }, { once: true });
    });
  }

  function clearFilter(input, hiddenClass) {
    input.value = "";
    const visibleBoxes = [];
    boxes.forEach(box => {
      if (box.classList.contains(hiddenClass)) {
        box.classList.remove(hiddenClass);
        if (!box.classList.contains("hidden-deposit") && !box.classList.contains("hidden-withdrawal")) {
          box.classList.add("was-hidden");
          visibleBoxes.push(box);
        }
      }
    });
    animateBoxesSequentially(visibleBoxes);
    if (allFiltersCleared()) restoreOriginalBoxOrder();
    else reorderBoxesToFront();
    const closeButton = input.closest("form").querySelector(".payment-close-button");
    checkCloseButtonVisibility(closeButton, input, hiddenClass);
    input.closest("form").querySelector(".selected")?.classList.remove("selected");
  }

  function filterBoxesByMethod(method, type) {
    const methodLC = method.toLowerCase();
    const hiddenClass = type === "deposit" ? "hidden-deposit" : "hidden-withdrawal";

    const promises = boxes.map(box => {
      const link = box.querySelector(".logobg a");
      if (!link) return Promise.resolve();
      const path = link.getAttribute("href").split("/").pop();
      const filePath = `${basePath}/${path}.json`;
      return fetch(filePath)
        .then(res => res.json())
        .then(data => {
          const methods = (type === "deposit" ? data.firstMethodContent : data.secondMethodContent) || [];
          const hasMethod = methods.some(html => {
            const temp = document.createElement("div");
            temp.innerHTML = html.trim();
            const a = temp.querySelector("a");
            return a && a.getAttribute("aria-label").toLowerCase() === methodLC;
          });
          if (hasMethod) {
            box.classList.remove(hiddenClass);
            if (!box.classList.contains("hidden-deposit") && !box.classList.contains("hidden-withdrawal")) {
              box.classList.add("was-hidden");
            }
          } else {
            box.classList.add(hiddenClass);
          }
        });
    });

    Promise.all(promises).then(() => {
      const reveal = boxes.filter(b => b.classList.contains("was-hidden") && !b.classList.contains("hidden-deposit") && !b.classList.contains("hidden-withdrawal"));
      animateBoxesSequentially(reveal);
      if (allFiltersCleared()) restoreOriginalBoxOrder();
      else reorderBoxesToFront();
    });
  }

  function checkCloseButtonVisibility(btn, input, hiddenClass) {
    const hasFilter = input.value !== "" || Array.from(boxes).some(b => b.classList.contains(hiddenClass));
    btn.classList.toggle("visible", hasFilter);
  }

  const paymentsBlock = document.createElement("div");
  paymentsBlock.className = "payments-block";

  const block1 = document.createElement("div");
  block1.className = "payments-block-separate";
  block1.appendChild(paymentsButton);

  const block2 = document.createElement("div");
  block2.className = "payments-block-separate";
  paymentsBlock.append(block1, block2);
  boxesHolder.insertBefore(paymentsBlock, boxesHolder.firstChild);

  const depositContainer = document.createElement("div");
  depositContainer.className = "payment-container";
  depositContainer.innerHTML = `
    <form id="payment-form">
      <input type="text" id="filter-input" autocomplete="off" readonly>
      <div class="methodlist payment-list"></div>
      <div class="payment-close-button"><i class="officon cross"></i></div>
    </form>`;

  const withdrawalContainer = document.createElement("div");
  withdrawalContainer.className = "payment-container";
  withdrawalContainer.innerHTML = `
    <form id="withdrawal-form">
      <input type="text" id="withdrawal-filter-input" autocomplete="off" readonly>
      <div class="methodlist payment-list" id="withdrawal-payment-list"></div>
      <div class="payment-close-button"><i class="officon cross"></i></div>
    </form>`;

  block2.append(depositContainer, withdrawalContainer);

  depositList = depositContainer.querySelector(".payment-list");
  depositInput = depositContainer.querySelector("#filter-input");
  withdrawalList = withdrawalContainer.querySelector(".payment-list");
  withdrawalInput = withdrawalContainer.querySelector("#withdrawal-filter-input");

  const translations = {
    deposit: { en: "Deposit", ru: "Пополнение" },
    withdraw: { en: "Withdraw", ru: "Вывод" }
  };

  function getTranslation(key) {
    return translations[key][languageTag] || translations[key].en;
  }

  function applyTranslations() {
    depositInput.setAttribute("placeholder", getTranslation("deposit"));
    withdrawalInput.setAttribute("placeholder", getTranslation("withdraw"));
  }

  applyTranslations();

  paymentsButton.addEventListener("click", () => {
    paymentsBlock.classList.toggle("visible");
    if (!paymentContainersLoaded) {
      setupInputClickEvents();
      setupCloseButtons();
      loadPaymentMethodsOnDemand(depositList, withdrawalList);
      paymentContainersLoaded = true;
    }
  });

  function setupInputClickEvents() {
    depositInput.addEventListener("click", e => {
      e.stopPropagation();
      hideAllPaymentLists();
      depositList.classList.toggle("visible");
      depositInput.classList.toggle("active");
    });
    withdrawalInput.addEventListener("click", e => {
      e.stopPropagation();
      hideAllPaymentLists();
      withdrawalList.classList.toggle("visible");
      withdrawalInput.classList.toggle("active");
    });
  }

  function hideAllPaymentLists() {
    depositList.classList.remove("visible");
    withdrawalList.classList.remove("visible");
    depositInput.classList.remove("active");
    withdrawalInput.classList.remove("active");
  }

  function setupCloseButtons() {
    document.querySelector("#payment-form .payment-close-button")?.addEventListener("click", () => clearFilter(depositInput, "hidden-deposit"));
    document.querySelector("#withdrawal-form .payment-close-button")?.addEventListener("click", () => clearFilter(withdrawalInput, "hidden-withdrawal"));
  }

  function loadPaymentMethodsOnDemand(depositList, withdrawalList) {
    let depArr = [], withArr = [], depSet = new Set(), withSet = new Set();

    boxes.forEach(box => {
      const link = box.querySelector(".logobg a");
      if (!link) return;

      const path = link.getAttribute("href").split("/").pop();
      const filePath = `${basePath}/${path}.json`;

      loadPaymentMethods(filePath).then(data => {
        (data.firstMethodContent || []).forEach(html => addMethodWithoutDuplicates(depArr, depSet, html));
        (data.secondMethodContent || []).forEach(html => addMethodWithoutDuplicates(withArr, withSet, html));

        populatePaymentList(depositList, depArr);
        populatePaymentList(withdrawalList, withArr);
      });
    });
  }

  document.addEventListener("click", e => {
    if (e.target.classList.contains("payment-method")) {
      const method = e.target.textContent;
      const form = e.target.closest("form");
      const input = form.querySelector("input");
      input.value = method;
      form.querySelector(".payment-list").classList.remove("visible");
      form.querySelector(".selected")?.classList.remove("selected");
      e.target.classList.add("selected");

      const type = input.id.includes("withdrawal") ? "withdrawal" : "deposit";
      filterBoxesByMethod(method, type);
      const btn = form.querySelector(".payment-close-button");
      checkCloseButtonVisibility(btn, input, type === "withdrawal" ? "hidden-withdrawal" : "hidden-deposit");
    } else {
      hideAllPaymentLists();
    }
  });
};

if (typeof window.initPayments === "function") {
  window.initPayments();
}

(() => {
  const PARTICLE_COUNT = 45;
  const FRAME_INTERVAL = 1900 / 60;
  const BACKGROUNDS = [
    "url(/img/icons/main-modes/rust-logo.png)",
    "url(/img/icons/main-modes/cs2-logo.png)",
    "url(/img/icons/main-modes/dota2-logo.png)",
    "url(/img/icons/main-modes/freebies.png)",
    "url(/img/icons/main-modes/steam.png)"
  ];

  let particleflakes = [];
  let previousTime = performance.now();
  let resetPosition = false;
  let enableAnimations = false;

  const reduceMotionQuery = matchMedia("(prefers-reduced-motion)");
  let particles = StorageHelper.get("particles") !== "false";
  StorageHelper.set("particles", particles);

  const particleflakeContainer = document.querySelector("#particleflakeContainer");

  class Particleflake {
    constructor(element, speed, xPos, yPos) {
      this.element = element;
      this.speed = speed;
      this.xPos = xPos;
      this.yPos = yPos;
      this.scale = 1;
      this.counter = 0;
      this.sign = Math.random() < 0.5 ? 1 : -1;

      this.element.style.opacity = (0.1 + Math.random()) / 3;
    }

    update(delta, width, height) {
      this.counter += (this.speed / 5000) * delta;
      this.xPos += (this.sign * delta * this.speed * Math.cos(this.counter)) / 40;
      this.yPos += Math.sin(this.counter) / 40 + (this.speed * delta) / 30;
      this.scale = 0.5 + Math.abs((10 * Math.cos(this.counter)) / 20);

      this.element.style.transform = `translate3d(${Math.round(this.xPos)}px, ${Math.round(this.yPos)}px, 0) scale(${this.scale})`;

      if (this.yPos > height) {
        this.yPos = -50;
      }
    }
  }

  function init() {
    updateToggleIcon();
    setAccessibilityState();
    reduceMotionQuery.addListener(setAccessibilityState);

    document.querySelector("#particles-toggle").addEventListener("click", toggleParticles);

    if (enableAnimations && window.innerWidth > 1365) {
      window.addEventListener("DOMContentLoaded", generateParticleflakes);
      window.addEventListener("resize", handleResize);
    }
  }

  function setAccessibilityState() {
    enableAnimations = !reduceMotionQuery.matches && particles;
  }

  function getRandomPosition(offset, size) {
    return Math.round(-offset + Math.random() * (size + offset * 2));
  }

  function generateParticleflakes() {
    const template = document.querySelector(".particleflake");
    if (!template) return;

    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    particleflakeContainer.style.display = "block";

    // Remove existing
    particleflakes.forEach(p => p.element.remove());
    particleflakes = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const clone = template.cloneNode(true);
      clone.style.backgroundImage = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
      particleflakeContainer.appendChild(clone);

      const x = getRandomPosition(50, width);
      const y = getRandomPosition(50, height);
      const speed = 5 + Math.random() * 40;

      particleflakes.push(new Particleflake(clone, speed, x, y));
    }

    template.remove();
    requestAnimationFrame(animate);
  }

  function animate(currentTime) {
    const delta = (currentTime - previousTime) / FRAME_INTERVAL;
    previousTime = currentTime;

    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    if (enableAnimations) {
      for (const particle of particleflakes) {
        if (resetPosition) {
          particle.xPos = getRandomPosition(50, width);
          particle.yPos = getRandomPosition(50, height);
        } else {
          particle.update(delta, width, height);
        }
      }
    }

    resetPosition = false;
    requestAnimationFrame(animate);
  }

  function handleResize() {
    if (window.innerWidth <= 1365) {
      resetPosition = true;
    } else if (particles) {
      resetPosition = false;
    }
  }

  function toggleParticles() {
    particles = !particles;
    StorageHelper.set("particles", particles);
    updateToggleIcon();

    if (particles) {
      setAccessibilityState();

      if (!document.querySelector(".particleflake")) {
        const el = document.createElement("div");
        el.className = "particleflake";
        particleflakeContainer.appendChild(el);
      }

      if (enableAnimations) {
        generateParticleflakes();
        window.addEventListener("resize", handleResize);
      }
    } else {
      particleflakes.forEach(p => p.element.remove());
      particleflakes = [];
      window.removeEventListener("resize", handleResize);
    }
  }

  function updateToggleIcon() {
    const icon = document.querySelector("#particles-toggle .officon");
    icon.classList.toggle("effect-on", particles);
    icon.classList.toggle("effect-off", !particles);
  }

  init();
})();

function loadCachedData(key) {
  return StorageHelper.getJSON(key);
}

function saveToCache(key, data) {
  StorageHelper.setJSON(key, data);
}

function loadModsJSON() {
  const cacheKey = "mods_boxes";
  const cached = StorageHelper.getJSON(cacheKey);

  if (cached) {
    return Promise.resolve(cached);
  }

  return fetch("/code-parts/micro-parts/insert-mods-box.json")
    .then(res => res.json())
    .then(data => {
      StorageHelper.setJSON(cacheKey, data);
      return data;
    });
}

(() => {
  const header = document.querySelector('header');
  if (!header) return;

  const cfg = {
    upVelocityReveal: 0.6,  // px/ms — "резкость" апа (≈600 px/s)
    upDeltaReveal: 80,      // px — альт. порог рывка вверх
    ignoreDelta: 2,         // px — игнор шума
    minLockMs: 400,         // ms — защита от мгновенного скрытия
    hideAfter: () => headerH + 12
  };

  let headerH = header.offsetHeight;
  let lastY = Math.max(0, window.scrollY || 0);
  let lastT = performance.now();
  let ticking = false;
  let lockUntil = 0;
  let hidden = false;

  const hide = () => {
    if (!hidden) { header.classList.add('is-hidden'); hidden = true; }
  };
  const show = (lock = false) => {
    if (hidden) { header.classList.remove('is-hidden'); hidden = false; }
    if (lock) lockUntil = performance.now() + cfg.minLockMs; // почему: не прячем сразу после резкого апа
  };

  const update = () => {
    ticking = false;

    const now = performance.now();
    const y = Math.max(0, window.scrollY || 0);  // почему: iOS bounce
    const dy = y - lastY;
    const dt = Math.max(16, now - lastT);
    const v = dy / dt;

    headerH = header.offsetHeight;

    if (y <= 0) { show(false); lastY = y; lastT = now; return; }
    if (Math.abs(dy) <= cfg.ignoreDelta) { lastY = y; lastT = now; return; }

    const fastUp = dy < 0 && ((-v) >= cfg.upVelocityReveal || (-dy) >= cfg.upDeltaReveal);

    if (fastUp) {
      show(true);
    } else if (dy > 0 && y > cfg.hideAfter() && now >= lockUntil) {
      hide();
    } else if (dy < 0) {
      show(false);
    }

    lastY = y;
    lastT = now;
  };

  const onScroll = () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { headerH = header.offsetHeight; }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    // почему: при возврате на вкладку устраняем "рывок" из-за устаревших lastY/lastT
    lastY = Math.max(0, window.scrollY || 0);
    lastT = performance.now();
  });

  update();
})();

// function loadCachedData_sitesInfo() {
//   const cachedData = StorageHelper.getJSON('sites_info');
//   if (cachedData) {
//     try {
//       ratings = cachedData.ratings || {};
//       requiredRoute = cachedData.RequiredRoute || [];
//       maybeRoute = cachedData.MaybeRoute || [];
//     } catch (e) {
//       console.error('Ошибка при разборе sites_info:', e);
//     }
//   }
// }

// function saveToCache_sitesInfo(data) {
//   const fullData = {
//     ratings: data.ratings,
//     RequiredRoute: data.RequiredRoute,
//     MaybeRoute: data.MaybeRoute,
//     hash: data.hash
//   };
//   StorageHelper.setJSON('sites_info', fullData);
// }
