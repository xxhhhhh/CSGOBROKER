document.addEventListener('DOMContentLoaded', function() {
  
  const requests = {
    'main-page': '/index.html',
    'csgo-best-sites': '/cs2.html',
    'freebies-sites': '/freebies.html',
    'earning-sites': '/earning.html',
    'rust-sites': '/rust.html',
    'dota-sites': '/dota.html',
    'newest-sites-list': '/newest.html',
    'crypto-sites': '/crypto.html',
    'buy-skins-csgo': '/csgo/buy-skins.html',
    'caseopening-csgo': '/csgo/caseopening.html',
    'case-battle-csgo': '/csgo/case-battle.html',
    'casino-csgo': '/csgo/casino.html',
    'coinflip-csgo': '/csgo/coinflip.html',
    'crash-csgo': '/csgo/crash.html',
    'dice-csgo': '/csgo/dice.html',
    'earn-by-play-csgo': '/csgo/earn-by-play-csgo.html',
    'instant-sell-csgo': '/csgo/instant-sell.html',
    'jackpot-csgo': '/csgo/jackpot.html',
    'marketplaces-csgo': '/csgo/marketplaces.html',
    'matchbetting-csgo': '/csgo/matchbetting.html',
    'roulette-csgo': '/csgo/roulette.html',
    'sell-skins-csgo': '/csgo/sell-skins.html',
    'trade-skins-csgo': '/csgo/trade-skins.html',
    'upgrader-csgo': '/csgo/upgrader.html',
    'mines-cs2': '/csgo/mines.html',
    'plinko-cs2': '/csgo/plinko.html',
    'earn-by-play-sites': '/earning/earn-by-play.html',
    'offerwalls-list': '/earning/offerwalls.html',
    'daily-rewards-list': '/freebies/daily-rewards.html',
    'deposit-bonuses-list': '/freebies/deposit-bonuses.html',
    'giveaways-list': '/freebies/giveaways.html',
    'sign-up-bonuses-list': '/freebies/sign-up-bonuses.html',
    'levelup-list': '/steam/levelup.html',
    'topup-list': '/steam/topup.html',
    'buygames-list': '/steam/buy-games.html',
    'casino-crypto': '/crypto/casino.html',
    'coinflip-crypto': '/crypto/coinflip.html',
    'crash-crypto': '/crypto/crash.html',
    'matchbetting-crypto': '/crypto/matchbetting.html',
    'roulette-crypto': '/crypto/roulette.html',
    'buy-skins-rust': '/rust/buy-skins.html',
    'caseopening-rust': '/rust/caseopening.html',
    'case-battle-rust': '/rust/case-battle.html',
    'coinflip-rust': '/rust/coinflip.html',
    'crash-rust': '/rust/crash.html',
    'instant-sell-rust': '/rust/instant-sell.html',
    'jackpot-rust': '/rust/jackpot.html',
    'marketplaces-rust': '/rust/marketplaces.html',
    'matchbetting-rust': '/rust/matchbetting.html',
    'roulette-rust': '/rust/roulette.html',
    'sell-skins-rust': '/rust/sell-skins.html',
    'trade-skins-rust': '/rust/trade-skins.html',
    'upgrader-rust': '/rust/upgrader.html',
    'casino-rust': '/rust/casino.html',
    'buy-skins-dota': '/dota/buy-items.html',
    'caseopening-dota': '/dota/caseopening.html',
    'marketplaces-dota': '/dota/marketplaces.html',
    'matchbetting-dota': '/dota/matchbetting.html',
    'roulette-dota': '/dota/roulette.html',
    'sell-skins-dota': '/dota/sell-items.html',
    'trade-skins-dota': '/dota/trade-items.html',
    'upgrader-dota': '/dota/upgrader.html',
    'instant-sell-dota': '/dota/instant-sell.html',
    'buy-items-tf2': '/tf2/buy-items.html',
    'instant-sell-tf2': '/tf2/instant-sell.html',
    'marketplaces-tf2': '/tf2/marketplaces.html',
    'sell-items-tf2': '/tf2/sell-items.html',
    'trade-items-tf2': '/tf2/trade-items.html',
  };
  
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
    const promises = Array.from(boxes).map(async (box) => {
      const logoLink = box.querySelector('.logobg a');
      if (!logoLink) return;
  
      const path = logoLink.getAttribute('href');
      const pageKey = path.split('/').pop();
      const jsonFilePath = `${basePath}/${pageKey}.json`;
  
      try {
        const data = await loadJsonData(jsonFilePath);
        if (!data) return;
  
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
    });
  
    await Promise.all(promises);
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

      const boxes = Array.from(document.querySelectorAll('.box:not(.main)'));

      boxes.forEach(function (box) {
        var logoLink = box.querySelector(".logobg a");
        if (logoLink) {
          var href = logoLink.getAttribute("href");
      
          var firstParagraph = box.querySelector(".content p:first-child");
          if (firstParagraph) {
            var newLink = document.createElement("a");
            newLink.href = href;
            newLink.textContent = firstParagraph.textContent;
            newLink.classList.add("boxtitle");
      
            firstParagraph.replaceWith(newLink);
          }
        }
      });
      
  
      forcemodsboxes();
      const importedBoxes = targetElement.querySelectorAll(".box");
      await processBoxes(importedBoxes);
  
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
  
  function findRequest(targetId) {
    return requests[targetId] || null;
  }  

  var url = findRequest(neededTargetId);
  if (url) {
    sendRequest(url, neededTargetId);
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