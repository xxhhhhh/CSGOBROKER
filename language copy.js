document.addEventListener('DOMContentLoaded', function() {
  
  var requests = [
    { url: '/index.html', targetId: 'main-page' },
    { url: '/cs2.html', targetId: 'csgo-best-sites' },
    { url: '/freebies.html', targetId: 'freebies-sites' },
    { url: '/earning.html', targetId: 'earning-sites' },
    { url: '/rust.html', targetId: 'rust-sites' },
    { url: '/dota.html', targetId: 'dota-sites' },
    { url: '/newest.html', targetId: 'newest-sites-list' },
    { url: '/crypto.html', targetId: 'crypto-sites' },
    { url: '/csgo/buy-skins.html', targetId: 'buy-skins-csgo' },
    { url: '/csgo/caseopening.html', targetId: 'caseopening-csgo' },
    { url: '/csgo/case-battle.html', targetId: 'case-battle-csgo' },
    { url: '/csgo/casino.html', targetId: 'casino-csgo' },
    { url: '/csgo/coinflip.html', targetId: 'coinflip-csgo' },
    { url: '/csgo/crash.html', targetId: 'crash-csgo' },
    { url: '/csgo/dice.html', targetId: 'dice-csgo' },
    { url: '/csgo/earn-by-play-csgo.html', targetId: 'earn-by-play-csgo' },
    { url: '/csgo/instant-sell.html', targetId: 'instant-sell-csgo' },
    { url: '/csgo/jackpot.html', targetId: 'jackpot-csgo' },
    { url: '/csgo/marketplaces.html', targetId: 'marketplaces-csgo' },
    { url: '/csgo/matchbetting.html', targetId: 'matchbetting-csgo' },
    { url: '/csgo/roulette.html', targetId: 'roulette-csgo' },
    { url: '/csgo/sell-skins.html', targetId: 'sell-skins-csgo' },
    { url: '/csgo/trade-skins.html', targetId: 'trade-skins-csgo' },
    { url: '/csgo/upgrader.html', targetId: 'upgrader-csgo' },
    { url: '/csgo/mines.html', targetId: 'mines-cs2' },
    { url: '/csgo/plinko.html', targetId: 'plinko-cs2' },
    { url: '/earning/earn-by-play.html', targetId: 'earn-by-play-sites' },
    { url: '/earning/offerwalls.html', targetId: 'offerwalls-list' },
    { url: '/freebies/daily-rewards.html', targetId: 'daily-rewards-list' },
    { url: '/freebies/deposit-bonuses.html', targetId: 'deposit-bonuses-list' },
    { url: '/freebies/giveaways.html', targetId: 'giveaways-list' },
    { url: '/freebies/sign-up-bonuses.html', targetId: 'sign-up-bonuses-list' },
    { url: '/steam/levelup.html', targetId: 'levelup-list' },
    { url: '/steam/topup.html', targetId: 'topup-list' },
    { url: '/steam/buy-games.html', targetId: 'buygames-list' },
    { url: '/crypto/casino.html', targetId: 'casino-crypto' },
    { url: '/crypto/coinflip.html', targetId: 'coinflip-crypto' },
    { url: '/crypto/crash.html', targetId: 'crash-crypto' },
    { url: '/crypto/matchbetting.html', targetId: 'matchbetting-crypto' },
    { url: '/crypto/roulette.html', targetId: 'roulette-crypto' },
    { url: '/rust/buy-skins.html', targetId: 'buy-skins-rust' },
    { url: '/rust/caseopening.html', targetId: 'caseopening-rust' },
    { url: '/rust/case-battle.html', targetId: 'case-battle-rust' },
    { url: '/rust/coinflip.html', targetId: 'coinflip-rust' },
    { url: '/rust/crash.html', targetId: 'crash-rust' },
    { url: '/rust/instant-sell.html', targetId: 'instant-sell-rust' },
    { url: '/rust/jackpot.html', targetId: 'jackpot-rust' },
    { url: '/rust/marketplaces.html', targetId: 'marketplaces-rust' },
    { url: '/rust/matchbetting.html', targetId: 'matchbetting-rust' },
    { url: '/rust/roulette.html', targetId: 'roulette-rust' },
    { url: '/rust/sell-skins.html', targetId: 'sell-skins-rust' },
    { url: '/rust/trade-skins.html', targetId: 'trade-skins-rust' },
    { url: '/rust/upgrader.html', targetId: 'upgrader-rust' },
    { url: '/rust/casino.html', targetId: 'casino-rust' },
    { url: '/dota/buy-items.html', targetId: 'buy-skins-dota' },
    { url: '/dota/caseopening.html', targetId: 'caseopening-dota' },
    { url: '/dota/marketplaces.html', targetId: 'marketplaces-dota' },
    { url: '/dota/matchbetting.html', targetId: 'matchbetting-dota' },
    { url: '/dota/roulette.html', targetId: 'roulette-dota' },
    { url: '/dota/sell-items.html', targetId: 'sell-skins-dota' },
    { url: '/dota/trade-items.html', targetId: 'trade-skins-dota' },
    { url: '/dota/upgrader.html', targetId: 'upgrader-dota' },
    { url: '/dota/instant-sell.html', targetId: 'instant-sell-dota' },
    { url: '/tf2/buy-items.html', targetId: 'buy-items-tf2' },
    { url: '/tf2/instant-sell.html', targetId: 'instant-sell-tf2' },
    { url: '/tf2/marketplaces.html', targetId: 'marketplaces-tf2' },
    { url: '/tf2/sell-items.html', targetId: 'sell-items-tf2' },
    { url: '/tf2/trade-items.html', targetId: 'trade-items-tf2' }
  ];
  
  const basePath = "/code-parts/site-infos";
  
  async function loadJsonData(filePath) {
    const cachedData = sessionStorage.getItem(filePath);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Failed to load JSON data from ${filePath}`);
      const data = await response.json();
      sessionStorage.setItem(filePath, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(`Error loading JSON data: ${error.message}`);
      throw error; 
    }
  }
  
  
  
  function modifyBox(box, mainMode) {
    const logobg = box.querySelector('.logobg');
    if (!logobg) return;
  
    const mainModeDiv = document.createElement('div');
    mainModeDiv.className = `main-mode ${mainMode} lang-${languageTag}`;
    mainModeDiv.innerHTML = `<div class="main-mode-box"><div class="main-mode-icon"></div></div>`;
  
    logobg.appendChild(mainModeDiv);
  }
  
  async function processBoxes(boxes) {
    for (const box of boxes) {
      const logoLink = box.querySelector('.logobg a');
      if (!logoLink) continue;
  
      const path = logoLink.getAttribute('href');
      const pageKey = path.split('/').pop();
      const jsonFilePath = `${basePath}/${pageKey}.json`;
  
      try {
        const data = await loadJsonData(jsonFilePath);
        if (!data) continue;
  
        if (data["Main Mode"]) modifyBox(box, data["Main Mode"]);
        if (data.code) {
          const copyButton = box.querySelector('.copy');
          if (copyButton) {
              copyButton.addEventListener('click', () => copyToClipboard(data.code, copyButton));
          }
      }
  
        updateReviewButtons(box, data, pageKey);
        updateURLs(sitesList);
      } catch (error) {
        console.error(`Error processing box for ${pageKey}: ${error.message}`);
      }
    }
  }  
  
  async function sendRequest(url, targetId) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch content from ${url}`);
      
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
  
      const boxesHolder = doc.querySelector(".boxes-holder");
      if (!boxesHolder) return;
  
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;
  
      targetElement.innerHTML = boxesHolder.innerHTML;
  
      translateURLsIfNeeded(targetElement);
  
      for (const boxId in ratings) {
        addStarRating(boxId, ratings[boxId]);
      }
  
      forcemodsboxes();
      const importedBoxes = targetElement.querySelectorAll(".box");
      await processBoxes(importedBoxes); // Ждём завершения обработки всех боксов
  
      const elementsToTranslate = document.querySelectorAll(".singlemod-box, .boxes-holder-section");
      elementsToTranslate.forEach((box) => {
        translateElement(box, languageTag);
      });
  
      if (isPageInAvaliable()) {
        updateURLs(sitesList);
      }
    } catch (error) {
      console.error(`Error in sendRequest: ${error.message}`);
    }
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
  
  function isPageInAvaliable() {
    var path = window.location.pathname;
    return path.startsWith('/tr/') || path.endsWith('/tr') || path.endsWith('/tr.html') || path.startsWith('/es/') || path.endsWith('/es') || path.endsWith('/es.html');
  }
  
  var boxesHolderElement = document.querySelector('.boxes-holder');
  var neededTargetId = boxesHolderElement ? boxesHolderElement.id : null;
  
  var request = requests.find(function(item) {
    return item.targetId === neededTargetId;
  });
  
  if (request) {
    sendRequest(request.url, request.targetId);
  }
  
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
  
  async function translateURLsIfNeeded() {
    if (!window.location.pathname.includes('/reviews/') && 
        !window.location.pathname.includes('/ru/') && 
        !window.location.pathname.includes('/mirrors/')) {
  
      const languageTag = extractLanguageTagFromHTML();
      if (languageTag === 'en') return;
  
      try {
        const translations = await fetch(`/code-parts/main-translations/${languageTag}.json`).then(res => res.json());
  
        document.querySelectorAll(".box .content p, .box .logobg .best, .box .content button")
          .forEach(element => {
            const text = element.textContent.trim();
  
            if (translations.texts[text]) {
              element.innerHTML = translations.texts[text];
            } else {
              for (const [pattern, replacement] of Object.entries(translations.patterns)) {
                const regex = new RegExp(pattern);
                const match = regex.exec(text);
                if (match) {
                  element.innerHTML = replacement.replace('xote', match[1]);
                  break;
                }
              }
            }
          });
  
      } catch (error) {
      }
      initializeSliderIfNeeded();
    }
  }
  
  function initializeSliderIfNeeded() {
    const sliderContainer = document.querySelector('.main-mode-selection');
    if (sliderContainer && !sliderContainer.classList.contains('slick-slider')) {
      $(sliderContainer).slick({
        slidesToShow: window.innerWidth < 600 ? 2 : 4,
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
    }
  }
});