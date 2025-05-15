const StorageHelper = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },

  getJSON(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  setJSON(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch {}
  },

  setWithExpiry(key, value, durationMs) {
    const now = Date.now();
    const data = {
      value,
      expiry: now + durationMs,
    };
    this.setJSON(key, data);
  },

  getWithExpiry(key) {
    const item = this.getJSON(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },

  initVersion({ versionKey = 'version', currentVersion }) {
    const savedVersion = localStorage.getItem(versionKey);
    if (savedVersion !== currentVersion) {
      localStorage.clear();
      localStorage.setItem(versionKey, currentVersion);
    }
  },
};


StorageHelper.initVersion({ currentVersion: '1.06' });

function isRuPage(pathname) {
  return pathname.startsWith('/ru/') || pathname === '/ru' || pathname === '/ru.html';
}



function copyToClipboard(element, copyButton) {
  const text = element.textContent.trim();

  const $temp = $("<input>");
  $("body").append($temp);
  $temp.val(text).select();
  document.execCommand("copy");
  $temp.remove();

  const copiedMessage = (languageTag === 'ru') ? 'Скопировано' : 'Copied';
  const $title = $("<div class='copied-title'>" + copiedMessage + "</div>");
  const $copyButton = $(copyButton);

  $copyButton.append($title);
  $copyButton.addClass("icon-changed");

  $title.hide().fadeIn(150, function () {
      $(this).delay(400).fadeOut(150, function () {
          $(this).remove();
      });
  });

  setTimeout(function () {
      $copyButton.removeClass("icon-changed");
  }, 800);
}

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');
let currentTheme = (StorageHelper.getJSON('theme_settings') || {}).theme || getSystemPreferredTheme() || getSystemPreferredTheme();

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

  const link = document.getElementById('theme-style');

  if (theme === 'light') {
    if (link) {
      link.href = '/style_light.css';
      link.disabled = false;
    }
    themeIcon.classList.replace('lightbulb-off', 'lightbulb-on');
  } else {
    if (link) {
      link.disabled = true;
      link.href = '';
    }
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
  
  document.addEventListener("DOMContentLoaded", function () {
    const basePath = "/code-parts/site-infos";
  
    function computeHash(data) {
      return btoa(JSON.stringify(data));
    }
  
    const allDataCache = loadCachedData('sites_load') || { data: {}, hashes: {} };

    const jsonLoadPromises = {};

    function loadAllJsonData(filePath, callback) {
      const pageKey = filePath.split('/').pop().replace('.json', '');

      if (allDataCache.data[pageKey]) {
        callback(allDataCache.data[pageKey]);
      }

      if (!jsonLoadPromises[pageKey]) {
        jsonLoadPromises[pageKey] = fetch(filePath)
          .then(response => response.json())
          .then(data => {
            const newHash = computeHash(data);
            if (newHash !== allDataCache.hashes[pageKey]) {
              allDataCache.data[pageKey] = data;
              allDataCache.hashes[pageKey] = newHash;
              saveToCache('sites_load', allDataCache);
            }
            return data;
          });
      }

      jsonLoadPromises[pageKey].then(callback);
    }


    function modifyBox(box, mainMode) {
      const logobg = box.querySelector(".logobg");
      if (!logobg) return;

      // Удаляем уже существующий .main-mode, если есть
      const existingMainMode = logobg.querySelector(".main-mode");
      if (existingMainMode) existingMainMode.remove();

      const mainModeDiv = document.createElement("div");
      mainModeDiv.className = `main-mode ${mainMode} lang-${languageTag}`;
      mainModeDiv.innerHTML = `
        <div class="main-mode-box">
          <div class="main-mode-icon"></div>
        </div>
      `;

      logobg.appendChild(mainModeDiv);
    }

  
    function copyToClipboard_review(text, copyButton) {
      const tempInput = document.createElement("input");
      document.body.appendChild(tempInput);
      tempInput.value = text;
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
  
      const title = document.createElement("div");
      title.className = "copied-title";
      title.textContent = languageTag === "ru" ? "Скопировано" : "Copied";
  
      copyButton.appendChild(title);
      copyButton.classList.add("icon-changed");
  
      title.style.display = "none";
      $(title).fadeIn(150, function () {
        $(this).delay(400).fadeOut(150, function () {
          $(this).remove();
        });
      });
  
      setTimeout(function () {
        copyButton.classList.remove("icon-changed");
      }, 800);
    }
  
    function loadReviewSettings(callback) {
      fetch('/code-parts/review-settings.json')
        .then(response => response.json())
        .then(data => callback(data));
    }
  
    function addMirrorButton(box, pageKey, data) {
      const visitButton = box.querySelector(".box:not(.main) .content-buttons a.review-button.visit");
  
      const translations = {
        "checkMirrors": {
          "en": `Check Mirrors list of ${data.name}`,
          "ru": `Смотреть список Зеркал ${data.name}`,
        },
      };
  
      function getTranslation(key) {
        return translations[key][languageTag] || translations[key]['en'];
      }
  
      if (visitButton && data.mirror) {
        const mirrorButton = document.createElement("a");
        mirrorButton.href = `/mirrors/${pageKey}`;
        mirrorButton.className = "review-button mirror-visit";
        mirrorButton.setAttribute("aria-label", getTranslation("checkMirrors"));
        visitButton.insertAdjacentElement("afterend", mirrorButton);
      }
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
          "ru": `Читать Обзор ${data.name}`
        },
        "visitSite": {
          "en": `Visit ${data.name}`,
          "ru": `Перейти на ${data.name}`
        }
      };
  
      function getTranslation(key) {
        return translations[key][languageTag] || translations[key]['en'];
      }
  
      if (visitButton && data.link) {
        if (window.location.pathname.includes("/marketplaces") && data["marketplaces"]) {
          visitButton.href = data["marketplaces"];
        } else if (window.location.pathname.includes("/instant-sell") && data["instant-sell"]) {
          visitButton.href = data["instant-sell"];
        } else if (window.location.pathname.includes("/buy-skins") && data["buy-skins"]) {
          visitButton.href = data["buy-skins"];
        } else if (window.location.pathname.includes("/sell-skins") && data["sell-skins"]) {
          visitButton.href = data["sell-skins"];
        } else if ((window.location.pathname.includes("/ru/earning/earn-by-play") || window.location.pathname.includes("/ru/csgo/earn-by-play-csgo")) && data["earn-by-play"]) {
          visitButton.href = data["earn-by-play"];
        } else if (window.location.pathname.includes("/earn-by-play") && data["earn-by-play-en"]) {
          visitButton.href = data["earn-by-play-en"];
        } else {
          visitButton.href = data.link;
        }
        visitButton.setAttribute('aria-label', getTranslation('visitSite'));
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
  
      if (data.mirror) {
        addMirrorButton(box, pageKey, data);
      }
    }
  
    let currentPath = window.location.pathname;
  
    if (currentPath.includes("/reviews/") || currentPath.includes("/mirrors/")) {
      if (currentPath.endsWith(".html")) {
        currentPath = currentPath.slice(0, -5);
      }
  
      const pageKey = currentPath.split("/").pop();
      const mainJsonFilePath = `${basePath}/${pageKey}.json`;
  
      loadReviewSettings((reviewSettings) => {
        loadAllJsonData(mainJsonFilePath, (data) => {
          if (data.code) {
            const siteCodeElement = document.getElementById("site-code");
            if (siteCodeElement) {
              siteCodeElement.textContent = data.code;
            }
  
            const copyButtons = document.querySelectorAll(".copy");
            copyButtons.forEach((button) => {
              button.addEventListener("click", () =>
                copyToClipboard_review(data.code, button)
              );
            });
          }
  
          const mainBox = document.querySelector(".box.main");
          if (mainBox) {
            if (data["Main Mode"]) {
              modifyBox(mainBox, data["Main Mode"]);
            }
            updateReviewButtons(mainBox, data, pageKey, reviewSettings);
            updateURLs(reviewBox);
          }
        });
      });
    } else {
      const holderBoxes = document.querySelectorAll(".boxes-holder .box");
      holderBoxes.forEach((box) => {
        const logoLink = box.querySelector(".logobg a");
        if (logoLink) {
          const path = logoLink.getAttribute("href");
          const pageKey = path.split("/").pop();
          const jsonFilePath = `${basePath}/${pageKey}.json`;
  
          loadAllJsonData(jsonFilePath, (data) => {
            if (data.code) {
              const copyButtons = box.querySelectorAll(".copy");
              copyButtons.forEach((button) => {
                button.addEventListener("click", () =>
                  copyToClipboard_review(data.code, button)
                );
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
        case 'es':
            alternatesTitle = `Mejores Alternativas a ${mainSiteName}`;
            break;
        case 'pl':
            alternatesTitle = `Najlepsze alternatywy dla ${mainSiteName}`;
            break;
        default:
            alternatesTitle = `Best ${mainSiteName} Alternatives`;
    }

        siteAlternates = document.createElement('div');
        siteAlternates.className = 'sitealternates';
        siteAlternates.innerHTML = `
            <div class="alternates-title">${alternatesTitle}</div>
            <div class="sitealternatesboxes"></div>
        `;

        const ratingsumm = document.querySelector('.ratingsumm');
        if (ratingsumm) {
            ratingsumm.insertAdjacentElement('afterend', siteAlternates);
        } 
      else {
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
            } else if (languageTag === 'es' && altData.reward_es) {
                rewardText = altData.reward_es;
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
                    <a href='${altData.link}' aria-label="Visit WebSite" target="_blank" rel="noopener" class="review-button visit"></a>
                </div>
                </div>`;

            siteAlternatesBoxes.appendChild(altBox);
        });
    });

    Promise.all(alternatives.map(alt => loadPageData(`${altSitesPath}${alt}.json`)))
        .then(() => {
            for (let i = alternatives.length; i < 4; i++) {
                const emptyBox = document.createElement('div');
                emptyBox.className = 'box';
                siteAlternatesBoxes.appendChild(emptyBox);
            }
            for (var boxId in ratings) {
                addStarRating(boxId, ratings[boxId]);
            }
            updateURLs(siteAlternatesBoxes);
        });
}

function insertReviewLinks(codes, codeValue, codesBinding) {
  if (!codes || Object.keys(codes).length === 0 || !codeValue) return;

  let reviewLinksContainer = document.querySelector(".box-extra-links");

  if (!reviewLinksContainer) {
    reviewLinksContainer = document.createElement("div");
    reviewLinksContainer.className = "box-extra-links";

    const siteBlock = document.querySelector(".siteblock");
    const mainBox = siteBlock ? siteBlock.querySelector(".box.main") : null;

    if (mainBox && siteBlock) {
      mainBox.insertAdjacentElement("afterend", reviewLinksContainer);
    } else {
      return;
    }
  }

  const fragment = document.createDocumentFragment();
  const promoBoxes = [];
  let index = 1;

  Object.entries(codes).forEach(([codeName, codeDisplay]) => {
    const className = codesBinding[codeName] || "default-bonus";
    const counterClass = `counter-${index}`;
    const promoText = languageTag === "ru" ? "Промокод" : "Promo";

    const box = document.createElement("div");
    box.className = `promo-box extra-abox ${className} ${counterClass}`;

    box.innerHTML = `
      <div class="logobg">
        <span>${codeDisplay}</span>
      </div>
      <div class="content">
        <p>${promoText}</p>
        <code class="promo-code">${codeValue}</code>
        <button class="copy site-promo-copy" aria-label="Copy Code"></button>
      </div>
    `;

    fragment.appendChild(box);
    promoBoxes.push(box);
    index++;
  });

  reviewLinksContainer.appendChild(fragment);

  requestAnimationFrame(() => {
    setTimeout(() => {
      promoBoxes.forEach((box, i) => {
        setTimeout(() => {
          box.classList.add("show");
        }, i * 150); // постепенное появление
      });
    }, 50); // короткая задержка после первой отрисовки
  });
}


  
      Promise.all([
        loadPageData(jsonFilePath),
        StorageHelper.getJSON('reviews_preset') || Promise.all([
          loadPageData(filterSettingsPath),
          loadPageData(reviewSettingsPath),
          loadPageData(translationsPath)
        ]).then(([f, r, t]) => {
          const preset = { filter: f, review: r, translation: t };
          StorageHelper.setJSON('reviews_preset', preset);
          return preset;
        })
      ]).then(([pageData, reviewsPreset]) => {
        const filterSettings = reviewsPreset.filter;
        const reviewSettings = reviewsPreset.review;
        const translations = reviewsPreset.translation
      if (pageData && reviewSettings) {
          sortAndInsertContent(pageData.gamemodesContent, reviewSettings.gamemodesOrder, '.gamemodes .featuresbox .typesinside');
          insertFeatures(pageData.featuresContent, filterSettings, reviewSettings.featureOrder);
          insertReviewLinks(pageData.codes, pageData.code, reviewSettings.codesBinding || {});
  
          const sitedetailsContainer = document.querySelector('.sitedetails');
          if (sitedetailsContainer) {
              sitedetailsContainer.innerHTML = '';
          }

          if (pageData.code) {
            const copyButtons = document.querySelectorAll(".box-extra-links .copy");
            copyButtons.forEach((button) => {
                button.addEventListener("click", () => {
                    copyToClipboard(button.previousElementSibling, button);
                });
            });
        }
          
          if (pageData.firstMethodContent || pageData.secondMethodContent) {
              const sitedetails = document.createElement('div');
              sitedetails.classList.add('sitedetails');
              
              if (pageData.firstMethodContent) {
                  const depositMethods = document.createElement('div');
                  depositMethods.classList.add('sitepros');
                  depositMethods.innerHTML = `
                      <span>Deposit Methods</span>
                      <div class="methodlist" id="first"></div>
                  `;
                  sitedetails.appendChild(depositMethods);
              }
  
              if (pageData.secondMethodContent) {
                  const withdrawMethods = document.createElement('div');
                  withdrawMethods.classList.add('sitepros');
                  withdrawMethods.innerHTML = `
                      <span>Withdraw Methods</span>
                      <div class="methodlist" id="second"></div>
                  `;
                  sitedetails.appendChild(withdrawMethods);
              }
              
              const screenTable = document.querySelector('.screentable');
              if (screenTable) {
                  screenTable.insertAdjacentElement('afterend', sitedetails);
              }
              insertRatings(pageData.ratings);

              if (pageData["Sites Alternatives"] && pageData["Sites Alternatives"].length > 0) {
                insertAlternatives(pageData["Sites Alternatives"]);
            }
          }
  
          const methodOrder = reviewSettings.paymentMethodsOrder;
          sortAndInsertContent(pageData.firstMethodContent, methodOrder, '.methodlist#first');
          sortAndInsertContent(pageData.secondMethodContent, methodOrder, '.methodlist#second');
      }
  
      if (translations) {
          if (translations[languageTag]) {
              translateTextElements(translations[languageTag]);
          }
      }
  
      const reviewlinks = document.querySelectorAll('.boxreview, .box-extra-links');
      reviewlinks.forEach(link => {
          updateURLs(link);
      });
  
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
  
      function insertRatings(ratings) {
          if (ratings) {
              let container = document.querySelector('.ratingsumm');
              if (!container) {
                  container = document.createElement('div');
                  container.classList.add('ratingsumm');
                  const sitedetails = document.querySelector('.sitedetails');
                  if (sitedetails) {
                      sitedetails.insertAdjacentElement('afterend', container);
                  }
              }
              
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
  });
  
  
  
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
        var path = lang === "en" 
            ? window.location.pathname.replace(/^\/[a-z]{2}\//, "/") 
            : "/" + lang + window.location.pathname.replace(/^\/[a-z]{2}\//, "/");
    
        fetch(path, { method: 'HEAD' }).then(function(response) {
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
    const maxCacheAge = 24 * 60 * 60 * 1000
  
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
  
      const boxReview = document.querySelector('.boxreview');
      if (window.location.pathname.includes('/reviews/') && boxReview) {
        boxReview.insertAdjacentHTML('beforeend', html);
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
        fetchAndInsert(); // corrupted data
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
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 час

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
  if (searchEnabler) {
    searchEnabler.addEventListener('click', () => {
      searchInput.classList.add('active');
      searchEnabler.classList.add('disabled');
      document.querySelector('.search-container').classList.add('expanded');
    });
  }
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

  if (languageTag === 'ru') {
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

let ratings = {};
let requiredRoute = [];
let maybeRoute = [];

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
  const boxesHolder = document.querySelector('.boxes-holder, .sitealternatesboxes');
  if (boxesHolder) {
    for (const boxId in ratings) {
      addStarRating(boxId, ratings[boxId]);
    }
  }

  if (
    window.location.pathname.startsWith('/ru/') ||
    window.location.pathname === '/ru' ||
    window.location.pathname === '/ru.html'
  ) {
    const boxElements = document.querySelectorAll('.box');
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
  ratings = settings.ratings;
  requiredRoute = settings.RequiredRoute;
  maybeRoute = settings.MaybeRoute;
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
  
  const newestBoxesDiv = createElement('div', 'newest-boxes');
  const newestBoxesTitleDiv = createElement('div', 'newest-boxes-title');
  const newestBoxesIconDiv = createElement('div', 'singlemod-icon officon newest');
  const newestBoxesTitleBoxDiv = createElement('div', 'newest-boxes-title-box');
  
  const titleSpan = document.createElement('span');
  const titles = {
    ru: 'Недавно Добавленные',
    tr: 'Yeni Eklenenler',
    pt: 'Recentemente Adicionados',
    es: 'Recientemente Añadidos',
    hi: 'हाल ही में जोड़ा गया',
  };
  titleSpan.textContent = titles[languageTag] || 'Recently Added';
  
  const newestBoxesMoreLink = createElement('a', 'newest-boxes-more');
  newestBoxesMoreLink.href = languageTag === 'ru' ? '/ru/newest' : '/newest';
  newestBoxesMoreLink.textContent = languageTag === 'ru' ? 'Больше' : 'More';
  
  newestBoxesTitleBoxDiv.append(newestBoxesIconDiv, titleSpan);
  newestBoxesTitleDiv.append(newestBoxesTitleBoxDiv, newestBoxesMoreLink);
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

      updateURLs(newestBoxesDiv);
      updateURLs(sliderContainer);
    });
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
  
document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;

  // REVIEW PAGE
  if (path.includes('/reviews/')) {
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
      es: {
        plusminus: 'Pros y Contras',
        screentable: 'Capturas de Pantalla y Modos',
        sitedetails: 'Métodos de Pago',
        sitealternates: 'Sitios Similares'
      },
      pl: {
        plusminus: 'Pros and Cons',
        screentable: 'Screenshots and Modes',
        sitedetails: 'Payment Methods',
        sitealternates: 'Similar Sites'
      }
    };

    const t = translations[languageTag];
    const mainBox = document.querySelector('.box.main');

    function bindRatingClick() {
      const ratingTrigger = mainBox.querySelector('.rating');
      const ratingTarget = document.querySelector('.ratingsumm');

      if (!ratingTrigger || !ratingTarget) return;

      ratingTrigger.style.cursor = 'pointer';
      ratingTrigger.addEventListener('click', () => {
        const rect = ratingTarget.getBoundingClientRect();
        const offsetTop = window.scrollY + rect.top - 200;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });

        ratingTarget.classList.remove('navmark');
        void ratingTarget.offsetWidth;
        ratingTarget.classList.add('navmark');
        ratingTarget.addEventListener('animationend', function handler() {
          ratingTarget.classList.remove('navmark');
          ratingTarget.removeEventListener('animationend', handler);
        });
      });
    }

    bindRatingClick();

    const ratingObserver = new MutationObserver(() => {
      if (document.querySelector('.ratingsumm')) {
        bindRatingClick();
        ratingObserver.disconnect();
      }
    });

    ratingObserver.observe(document.body, { childList: true, subtree: true });


    const navReview = document.createElement('div');
    navReview.classList.add('nav-review');

    const ol = document.createElement('ol');
    navReview.appendChild(ol);

    const sections = [
      { selector: '.plusminus', text: t.plusminus },
      { selector: 'h2', text: document.querySelector('h2')?.textContent },
      { selector: 'h3', text: document.querySelector('h3')?.textContent },
      { selector: '.screentable', text: t.screentable },
      { selector: '.sitedetails', text: t.sitedetails }
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

    function updateNav() {
      ol.innerHTML = '';
      let firstLiSet = false;

      sections.forEach(section => {
        const element = document.querySelector(section.selector);
        if (element && window.getComputedStyle(element).display !== 'none') {
          const li = document.createElement('li');
          li.textContent = section.text;
          li.addEventListener('click', () => {
            if (!isElementInViewport(element)) {
              const rect = element.getBoundingClientRect();
              const offsetTop = window.scrollY + rect.top - 150;
              window.scrollTo({ top: offsetTop, behavior: 'smooth' });
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
                  const parent = sitepros.closest('.sitedetails');
                  const allSitepros = Array.from(parent.querySelectorAll('.sitepros'));
                  const activeSitepros = allSitepros.filter(sp => sp.classList.contains('active'));

                  let maxMethodlistHeight = 0;
                  allSitepros.forEach(sp => {
                    const methodlist = sp.querySelector('.methodlist');
                    if (methodlist) {
                      maxMethodlistHeight = Math.max(maxMethodlistHeight, methodlist.offsetHeight);
                    }
                  });

                  const totalHeight = sitepros.offsetHeight + maxMethodlistHeight;
                  const currentHeight = parseInt(window.getComputedStyle(parent).height);

                  if (sitepros.classList.contains('active')) {
                    if (currentHeight < totalHeight) {
                      parent.style.height = totalHeight + 'px';
                    }
                  } else if (activeSitepros.length === 0) {
                    parent.style.height = '';
                  }
                }
              });
            }
          });

          ol.appendChild(li);
          if (!firstLiSet) {
            li.classList.add('current');
            firstLiSet = true;
          }
        }
      });
    }

    function highlightCurrentSection() {
      const threshold = 300;
      const sectionElements = Array.from(ol.querySelectorAll('li')).map((li, index) => {
        const section = sections[index];
        const element = document.querySelector(section.selector);
        return { li, element };
      }).filter(({ element }) => element);

      let currentIndex = -1;
      sectionElements.forEach(({ element }, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.top - threshold <= 0) {
          currentIndex = index;
        }
      });

      if (currentIndex === -1) currentIndex = 0;
      sectionElements.forEach(({ li }, index) => {
        li.classList.toggle('current', index === currentIndex);
      });
    }

    const observer = new MutationObserver(mutations => {
      let shouldUpdate = false;
      mutations.forEach(mutation => {
        if ([...mutation.addedNodes].some(node => node.matches?.('.sitedetails, .sitealternates'))) {
          shouldUpdate = true;
        }
      });
      if (shouldUpdate) {
        if (!sections.find(s => s.selector === '.sitealternates')) {
          sections.push({ selector: '.sitealternates', text: t.sitealternates });
        }
        if (!sections.find(s => s.selector === '.sitedetails')) {
          sections.push({ selector: '.sitedetails', text: t.sitedetails });
        }
        updateNav();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    updateNav();
    highlightCurrentSection();
    window.addEventListener('scroll', highlightCurrentSection);
    window.addEventListener('resize', highlightCurrentSection);

    const extraLinksBox = document.querySelector('.box-extra-links');
    if (extraLinksBox) {
      extraLinksBox.appendChild(navReview);
    } else if (mainBox) {
      const newBox = document.createElement('div');
      newBox.className = 'box-extra-links';
      newBox.appendChild(navReview);
      mainBox.insertAdjacentElement('afterend', newBox);
    }    

  // TOPIC PAGE
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

        targetElement.classList.remove('navmark');
        void targetElement.offsetWidth;
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
        if (rect.top - threshold <= 0) {
          currentIndex = index;
        }
      });
      if (currentIndex === -1) currentIndex = 0;
      navItems.forEach((li, index) => {
        li.classList.toggle('current', index === currentIndex);
      });
    }

    highlightTopicSection();
    window.addEventListener('scroll', highlightTopicSection);
    window.addEventListener('resize', highlightTopicSection);
  }
});


const boxes = Array.from(document.querySelectorAll('.box:not(.main)'));

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

window.initPayments();


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

function loadCombinedSearchData() {
  const cached = StorageHelper.getJSON(CACHE_KEY);
  const now = Date.now();

  if (cached) {
    const { configData, translationData, expiry } = cached;
    if (expiry && now < expiry) {
      return Promise.resolve({ configData, translationData });
    }
  }

  return Promise.all([
    fetch('/code-parts/search-config/config.json').then(res => res.json()),
    fetch('/code-parts/search-config/translations.json').then(res => res.json())
  ]).then(([configData, translationData]) => {
    const expiry = now + CACHE_DURATION_MS;
    const cacheObject = { configData, translationData, expiry };
    StorageHelper.setJSON(CACHE_KEY, cacheObject);
    return { configData, translationData };
  });
}

function loadModsJSON() {
  const cacheKey = "modsBoxes";
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

function loadCachedData_sitesInfo() {
  const cachedData = StorageHelper.getJSON('sites_info');
  if (cachedData) {
    try {
      ratings = cachedData.ratings || {};
      requiredRoute = cachedData.RequiredRoute || [];
      maybeRoute = cachedData.MaybeRoute || [];
    } catch (e) {
      console.error('Ошибка при разборе sites_info:', e);
    }
  }
}

function saveToCache_sitesInfo(data) {
  const fullData = {
    ratings: data.ratings,
    RequiredRoute: data.RequiredRoute,
    MaybeRoute: data.MaybeRoute,
    hash: data.hash
  };
  StorageHelper.setJSON('sites_info', fullData);
}
