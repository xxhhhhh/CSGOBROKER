$(document).ready(function () {
  const currentPath = window.location.pathname;
  if (
    currentPath.includes("items/") ||
    currentPath.includes("tournament-stickers/") ||
    currentPath.includes("stickers/") ||
    currentPath.includes("cases/") ||
    currentPath.includes("players/inventories/") ||
    currentPath.includes("charms/") ||
    currentPath.includes("collections/") ||
    currentPath.includes("skins/") ||
    currentPath.includes("guides/") ||
    currentPath.includes("sticker-crafts/") &&
    !currentPath.includes("sticker-crafts/skin/") ||
    currentPath.endsWith("sticker-crafts.html") ||
    currentPath.endsWith("sticker-crafts")
  ) {
    let enabledFiltersState = {};

    function getTopicInsertTarget(root = document) {
      return root.querySelector(".item-topic-grandbox") || root.querySelector(".topic-grandbox");
    }

    function getTopicContainer(root = document) {
      return root.querySelector(".item-topic-grandbox") || root.querySelector(".topic-grandbox");
    }

    // ---------- PREVIEW WINDOW (оставляем как есть) ----------
    const previewWindowHTML = `
      <div id="preview-window" class="hidden">
          <div id="preview-showcase">
              <div class="preview-buttons">
                  <div class="preview-close-button"><i class="officon cross"></i></div>
                  <div class="preview-pause-button"><i class="officon pause"></i></div>
              </div>
              <div class="preview-nav-button left"><i class="officon chevron left"></i></div>
              <div class="preview-nav-button right"><i class="officon chevron right"></i></div>
              <div id="preview-content"></div>
              <div class="site-searcher-buttons">
                  ${[
                    "LIS-SKINS",
                    "AvanMarket",
                    "MoonMarket",
                    "CSMoney",
                    "Tradeit",
                    "BitSkins",
                    "Steam",
                  ]
                    .map(
                      (site) => `
                  <div class="site-searcher-box" id="${site}" data-title="${
                        languageTag === "ru" ? "Искать в" : "Search on"
                      } ${site}">
                      <div class="site-searcher-logo">
                          <img src="/img/${site
                            .toLowerCase()
                            .replace(
                              ".",
                              "-"
                            )}-logo.webp" draggable="false" alt="${site} logo">
                      </div>
                  </div>`
                    )
                    .join("")}
              </div>
          </div>
      </div>`;
    $(".sitepage").prepend(previewWindowHTML);

    const previewContent = $("#preview-content");

    $(document).on("click", ".preview-pause-button", function () {
      previewContent.toggleClass("paused");
      const icon = $(this).find("i");
      icon.toggleClass("pause play");
    });

    // ---------- "More crafts" ссылка (оставляем, но без генерации .skin) ----------
    async function addMoreCraftsLink() {
      if (currentPath.includes("/topic/sticker-crafts/") && !currentPath.includes("/topic/sticker-crafts/skin/")) {
        try {
          const [craftsResponse, bindsResponse] = await Promise.all([
            fetch("/code-parts/topics/sticker-crafts.json"),
            fetch("/code-parts/topics/sticker-crafts-binds.json")
          ]);

          const craftsData = await craftsResponse.json();
          const bindsData = await bindsResponse.json();

          if (!Array.isArray(craftsData) || typeof bindsData !== "object") return;

          let currentId = currentPath.split("/").pop().replace(/\.html$/, "");
          const currentCraft = craftsData.find(item => item.id === currentId);
          if (!currentCraft) return;

          const skinName = bindsData[currentId] || currentCraft.skin;
          if (!skinName) return;

          let correctId = null;
          for (const [key, value] of Object.entries(bindsData)) {
            if (value === skinName) {
              correctId = key;
              break;
            }
          }

          if (!correctId) return;

          const relatedCrafts = craftsData.filter(item => item.skin === skinName);
          if (new Set(relatedCrafts.map(item => item.id)).size < 2) return;

          const moreCraftsHref = `${languageTag === "ru" ? "/ru" : ""}/topic/sticker-crafts/skin/${correctId}`;

          const boxExtraLinks = document.createElement("div");
          boxExtraLinks.classList.add("box-extra-links");

          const moreCraftsLink = document.createElement("a");
          moreCraftsLink.classList.add("more-crafts", "extra-abox");
          moreCraftsLink.href = moreCraftsHref;
          moreCraftsLink.innerHTML = `<span>${languageTag === "ru" ? `Больше Крафтов с ${skinName}` : `More Sticker Crafts for ${skinName}`}</span>`;

          boxExtraLinks.appendChild(moreCraftsLink);

          const insertTarget = getTopicInsertTarget();
          if (insertTarget) {
            insertTarget.insertAdjacentElement("afterend", boxExtraLinks);
          }
        } catch {}
      }
    }
    addMoreCraftsLink();

const REC_JSON_PATH = "/code-parts/topics/topics-recs.json";

(function () {
  // --- Storage safe wrappers (не даём скрипту падать) ---
  const SafeStorage = {
    getWithExpiry(key) {
      try {
        return typeof StorageHelper !== "undefined" && StorageHelper.getWithExpiry
          ? StorageHelper.getWithExpiry(key)
          : null;
      } catch {
        return null;
      }
    },
    setWithExpiry(key, value, ttl) {
      try {
        if (typeof StorageHelper !== "undefined" && StorageHelper.setWithExpiry) {
          StorageHelper.setWithExpiry(key, value, ttl);
        }
      } catch {
        /* ignore */
      }
    }
  };

  function runAfterDomReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function startFadeIn(el) {
    // Двойной rAF: гарантирует separate paint между вставкой и добавлением класса
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("active"));
    });
  }

  function insertRandomRecBox() {
    try {
      const pathname = window.location.pathname.replace(/\/+$/, "");

      if (/\/topic\/sticker-crafts(?:\.html)?$/i.test(pathname)) return;

      const lang = typeof languageTag !== "undefined" ? languageTag : "en";
      const recCount = 4;
      const cacheKey = "rec_boxes";
      const cacheDuration = 24 * 60 * 60 * 1000;

      const usedIds = new Set();

      const applyRecBoxes = (recData) => {
        if (!Array.isArray(recData) || recData.length === 0) return;

        const isMobile = window.innerWidth < 1365;
        const topicPage = document.querySelector(".topicpage");
        const insertAfterElement =
          document.querySelector(".item-topic-grandbox") ||
          document.querySelector(".topic-grandbox");

        if (!insertAfterElement && !topicPage) return;

        const labels = lang === "ru"
          ? { review: "Подробнее", visit: "Перейти", title: "Случайные Бонусы" }
          : { review: "Read More", visit: "Visit", title: "Random Bonuses" };

        let available = recData.slice();

        const wrapper = document.createElement("div");
        wrapper.className = "best-alternates";

        const title = document.createElement("span");
        title.className = "cent-title";
        title.textContent = labels.title;
        wrapper.appendChild(title);

      const initLocalBestAlternatesSlider = () => {
        const boxes = Array.from(wrapper.querySelectorAll(".rec-box"));
        if (boxes.length < 2) return;

        let activeIndex = Math.max(0, boxes.findIndex(box => box.classList.contains("active")));
        let timer = null;

        const setActive = (index) => {
          boxes.forEach(box => box.classList.remove("active"));
          boxes[index].classList.add("active");
          activeIndex = index;
        };

        const start = () => {
          if (timer) return;
          timer = setInterval(() => {
            setActive((activeIndex + 1) % boxes.length);
          }, 10000);
        };

        const stop = () => {
          clearInterval(timer);
          timer = null;
        };

        boxes.forEach((box, index) => {
          box.addEventListener("mouseenter", () => setActive(index));
        });

        wrapper.addEventListener("mouseenter", stop);
        wrapper.addEventListener("mouseleave", start);

        setActive(activeIndex);
        start();
      };

        const createdBoxes = [];

        for (let i = 0; i < recCount; i++) {
          available = available.filter((box) => !usedIds.has(box.id));
          if (available.length === 0) break;

          const randomIndex = Math.floor(Math.random() * available.length);
          const box = available[randomIndex];
          usedIds.add(box.id);

          const recBox = document.createElement("div");
          recBox.className = i === 0 ? "rec-box active" : "rec-box";
          recBox.setAttribute("data-box-id", String(box.id));

          const description =
            lang === "ru" && box.description_ru ? box.description_ru : box.description;

          const alt =
            lang === "ru"
              ? `Логотип ${box.site}`
              : `${box.site} logo`;

          let reviewHref = box.reviewHref || "#";
          if (lang === "ru" && typeof reviewHref === "string" && reviewHref.startsWith("/")) {
            reviewHref = `/ru${reviewHref}`;
          }

          recBox.innerHTML = `
            <div class="logobg">
              <a href="${reviewHref}">
                <img src="${box.logoSrc}" loading="lazy" draggable="false" alt="${alt}">
              </a>
            </div>
            <div class="content">
              <a class="boxtitle" href="${reviewHref}">${box.site}</a>
              <p>${description ?? ""}</p>
              <div class="content-buttons">
                <a href="${reviewHref}" class="review-button"><span>${labels.review}</span></a>
                <a href="${box.visitHref}" target="_blank" rel="noopener" class="review-button visit"><span>${labels.visit}</span></a>
              </div>
            </div>
          `;

          const reviewBtn = recBox.querySelector(".review-button:not(.visit)");
          const visitBtn = recBox.querySelector(".review-button.visit");

          const reviewLabel = lang === "ru" ? `Читать обзор ${box.site}` : `Read review ${box.site}`;
          const visitLabel = lang === "ru" ? `Перейти на ${box.site}` : `Visit ${box.site}`;

          if (reviewBtn) reviewBtn.setAttribute("aria-label", reviewLabel);
          if (visitBtn) visitBtn.setAttribute("aria-label", visitLabel);

          wrapper.appendChild(recBox);
          createdBoxes.push(recBox);
        }

        if (!createdBoxes.length) return;

        if (isMobile && topicPage) {
          topicPage.appendChild(wrapper);
        } else if (insertAfterElement && insertAfterElement.parentNode) {
          insertAfterElement.parentNode.insertBefore(wrapper, insertAfterElement.nextSibling);
        }
        initLocalBestAlternatesSlider();
      };

      const cached = SafeStorage.getWithExpiry(cacheKey);
      if (cached) {
        applyRecBoxes(cached);
      } else {
        fetch(REC_JSON_PATH, { cache: "force-cache" })
          .then((res) => {
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
            return res.json();
          })
          .then((json) => {
            SafeStorage.setWithExpiry(cacheKey, json, cacheDuration);
            applyRecBoxes(json);
          })
          .catch((err) => {
            console.error("insertRandomRecBox error:", err);
          });
      }
    } catch (err) {
      console.error("insertRandomRecBox fatal error:", err);
    }
  }

  runAfterDomReady(insertRandomRecBox);
})();


(() => {
  "use strict";

  const DATA_URL = "/code-parts/topics/skins-data/skins-prices.json";
  const _skinCache = { data: null, ts: 0, ttl: 30_000 };

  function isPlayersInventoryTopicPath(pathname = window.location.pathname) {
    return /\/topic\/players\/inventories\//i.test(pathname);
  }

  function normalizePriceName(str) {
    return String(str || "")
      .replace(/^★\s*/, "")
      .replace(/StatTrak™/gi, "StatTrak")
      .replace(/[™®]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizePriceLookupKey(str) {
    return normalizePriceName(str).toLowerCase();
  }

function getInventoryPriceCandidateNames(skinEl, visibleName) {
  const weapon = String(skinEl.getAttribute("weapon") || "").trim().toLowerCase();
  const normalizedVisible = normalizePriceName(visibleName);

  const candidates = [];

  if (normalizedVisible) {
    candidates.push(normalizedVisible);
  }

  // Только для стикеров добавляем вариант с префиксом,
  // потому что на карточке может быть имя без "Sticker |"
  if (weapon === "sticker" || weapon.includes("sticker")) {
    if (normalizedVisible && !/^Sticker\s*\|/i.test(normalizedVisible)) {
      candidates.push(normalizePriceName(`Sticker | ${normalizedVisible}`));
    }
  }

  // Только для charms
  if (weapon.includes("charm")) {
    if (normalizedVisible && !/^Charm\s*\|/i.test(normalizedVisible)) {
      candidates.push(normalizePriceName(`Charm | ${normalizedVisible}`));
    }
  }

  return uniqStrings(candidates);
}

function findInventoryPriceMatches(skinEl, visibleName, priceData) {
  const candidates = getInventoryPriceCandidateNames(skinEl, visibleName);
  const out = [];

  for (const candidate of candidates) {
    if (!candidate) continue;

    // Сначала exact
    const candidateKey = normalizePriceLookupKey(candidate);
    const exact = priceData.exactMap.get(candidateKey);
    if (exact && !exact.isStickerSlab) {
      out.push(exact);
      continue;
    }

    // Потом old-script partial, но только по ПОЛНОМУ имени карточки
    for (const item of priceData.partialList) {
      if (item.isStickerSlab) continue;
      if (item.lookupName.includes(candidateKey)) {
        out.push(item);
      }
    }
  }

  return uniqStrings(out.map(item => item.name))
    .map(name => priceData.exactMap.get(normalizePriceLookupKey(name)))
    .filter(Boolean);
}

function stripExteriorSuffix(name) {
  return String(name || "").replace(
    /\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/i,
    ""
  ).trim();
}

function extractExteriorSuffix(name) {
  const match = String(name || "").match(
    /\s*(\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\))\s*$/i
  );
  return match ? ` ${match[1]}` : "";
}

function uniqStrings(arr) {
  return [...new Set(
    arr
      .map(v => String(v || "").trim())
      .filter(Boolean)
  )];
}

function getSkinDisplayName(skinEl) {
  return String(
    skinEl.querySelector(".skin-desc-name")?.textContent || ""
  ).replace(/\s+/g, " ").trim();
}

function getSkinAltName(skinEl) {
  return String(
    skinEl.querySelector("img")?.getAttribute("alt") || ""
  ).replace(/\s+/g, " ").trim();
}

  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function formatRange(min, max) {
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);

    if (hasMin && hasMax) {
      return min === max
        ? `${min.toFixed(2)}$`
        : `${min.toFixed(2)}$ - ${max.toFixed(2)}$`;
    }
    if (hasMin) return `${min.toFixed(2)}$`;
    if (hasMax) return `${max.toFixed(2)}$`;
    return "";
  }

  function isStrictNameMatch(pageName) {
    const n = normalizePriceName(pageName);
    if (!n) return false;
    if (!n.includes("|")) return true;
    if (n.startsWith("Sticker |")) return true;
    return false;
  }

  function hasExterior(name) {
    const n = normalizePriceName(name);
    return /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i.test(n);
  }

  function isStatTrakName(name) {
    return /\bStatTrak\b/i.test(normalizePriceName(name));
  }

  function isSouvenirName(name) {
    return /^Souvenir\b/i.test(normalizePriceName(name));
  }

  function getSkinAmount(skinEl) {
    const amountEl = skinEl.querySelector(".skin-amount");
    if (!amountEl) return 1;

    const text = String(amountEl.textContent || "").trim();
    const value = parseInt(text.replace(/[^\d]/g, ""), 10);

    return Number.isFinite(value) && value > 0 ? value : 1;
  }

function formatInventoryUpdatedAt(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

async function updateTopicTotalValue(totalValue) {
  const info = document.querySelector(".topic-extra-info");
  if (!info) return;

  const summarySpans = info.querySelectorAll(".topic-inventory-summary span");
  const updateSpan = info.querySelector(".topic-inventory-update span");

  if (summarySpans[1]) {
    if (Number.isFinite(totalValue) && totalValue > 0) {
      summarySpans[1].textContent = `${totalValue.toFixed(2)}$`;
      info.classList.add("show");
    } else {
      summarySpans[1].textContent = "";
      info.classList.remove("show");
    }
  }

  if (!isPlayersInventoryTopicPath() || !updateSpan) return;

  try {
    const slug = window.location.pathname
      .split("/")
      .pop()
      .replace(/\.html$/i, "")
      .trim()
      .toLowerCase();

    if (!slug) {
      updateSpan.textContent = "";
      return;
    }

    const res = await fetch(
      `/code-parts/topics/players-data/players-inventories/${slug}.json`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      updateSpan.textContent = "";
      return;
    }

    const data = await res.json();
    updateSpan.textContent = formatInventoryUpdatedAt(data?.updatedAt);
  } catch {
    updateSpan.textContent = "";
  }
}

  function ensureOriginalTopicSkinOrder($list) {
    $list.children(".skin").each(function (index) {
      if (!this.hasAttribute("data-sort-origin")) {
        this.setAttribute("data-sort-origin", String(index));
      }
    });
  }

  function getTopicSkinPriceValue(el) {
    const direct = Number(el.getAttribute("data-price-value"));
    if (Number.isFinite(direct)) return direct;

    const priceEl = el.querySelector(".skin-price-info");
    if (!priceEl) return null;

    const raw = String(priceEl.textContent || "").replace(",", ".");
    const match = raw.match(/\d+(?:\.\d+)?/);
    if (!match) return null;

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sortTopicSkinsByPrice(direction = "desc") {
    const $list = $(".box-skins-list");
    if (!$list.length) return;

    ensureOriginalTopicSkinOrder($list);

    const skins = $list.children(".skin").not(".expander").get();
    if (!skins.length) return;

    if (direction === "original") {
      skins.sort((a, b) => {
        const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
        const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
        return aIndex - bIndex;
      });
    } else {
      skins.sort((a, b) => {
        const aPrice = getTopicSkinPriceValue(a);
        const bPrice = getTopicSkinPriceValue(b);

        const aMissing = aPrice === null;
        const bMissing = bPrice === null;

        if (aMissing && bMissing) {
          const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
          const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
          return aIndex - bIndex;
        }

        if (aMissing) return 1;
        if (bMissing) return -1;

        if (direction === "asc") {
          if (aPrice !== bPrice) return aPrice - bPrice;
        } else {
          if (aPrice !== bPrice) return bPrice - aPrice;
        }

        const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
        const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
        return aIndex - bIndex;
      });
    }

    $list.append(skins);
    $list.each(function () {
      window.keepStaticTopicExpanderLast?.(this);
    });
  }

  function applyDefaultInventoryPriceSort() {
    if (!isPlayersInventoryTopicPath()) return;

    const $priceFilter = $("#Price-Filter");
    const $qualityFilter = $("#Quality-Filter");
    const $list = $(".box-skins-list");

    $qualityFilter.removeClass("enabled reversed");
    $priceFilter.addClass("enabled").removeClass("reversed");

    sortTopicSkinsByPrice("desc");

    // ✅ добавлено
    if ($list.length) {
      $list.addClass("filtered");
    }

    updateNavigationReset?.();
  }

  const INVENTORY_EXPAND_PRICE_LIMIT = 1.0;
  const INVENTORY_EXPAND_BATCH_SIZE = 24;

  function getInventoryExpanderWord(count) {
    if (typeof languageTag !== "undefined" && languageTag === "ru") {
      const mod10 = count % 10;
      const mod100 = count % 100;

      if (mod10 === 1 && mod100 !== 11) return "предмет";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "предмета";
      return "предметов";
    }

    return count === 1 ? "item" : "items";
  }

  function createInventoryExpander(remainingCount) {
    const el = document.createElement("div");
    el.className = "skin expander";
    el.setAttribute("data-no-preview", "1");

    const word = getInventoryExpanderWord(remainingCount);
    const belowText =
      typeof languageTag !== "undefined" && languageTag === "ru"
        ? `до ${INVENTORY_EXPAND_PRICE_LIMIT.toFixed(2)}$`
        : `below ${INVENTORY_EXPAND_PRICE_LIMIT.toFixed(2)}$`;

    el.innerHTML = `
      <i class="officon click"></i>
      <div class="skin-expander-text">
        <span>${remainingCount} ${word}</span>
        <span>${belowText}</span>
      </div>
    `;

    return el;
  }

  const STATIC_TOPIC_EXPAND_BATCH_SIZE = 160;

  function createStaticTopicExpander(remainingCount) {
    const el = createInventoryExpander(remainingCount);
    el.classList.add("topic-static-expander");

    const textSpans = el.querySelectorAll(".skin-expander-text span");
    if (textSpans[1]) {
      textSpans[1].textContent =
        typeof languageTag !== "undefined" && languageTag === "ru"
          ? "показать ещё"
          : "show more";
    }

    return el;
  }

  function countStaticTopicSkinsInHtml(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html || "");

    return Array.from(tpl.content.children).filter((el) => {
      return el.classList && el.classList.contains("skin") && !el.classList.contains("expander");
    }).length;
  }

  function updateStaticTopicExpanderText(expander, remainingCount) {
    if (!expander) return;

    const word = getInventoryExpanderWord(remainingCount);
    const textSpans = expander.querySelectorAll(".skin-expander-text span");

    if (textSpans[0]) {
      textSpans[0].textContent = `${remainingCount} ${word}`;
    }

    if (textSpans[1]) {
      textSpans[1].textContent =
        typeof languageTag !== "undefined" && languageTag === "ru"
          ? "показать ещё"
          : "show more";
    }

    expander.classList.toggle("disabled", remainingCount <= 0);
  }

  function initStaticTopicDeferredExpanders() {
    document.querySelectorAll(".box-skins-list").forEach((listEl) => {
      const expander = listEl.querySelector(".skin.expander.topic-static-expander");
      if (!expander) return;

      const listId = expander.getAttribute("data-topic-static-list") || "";
      const dataEl = listId
        ? listEl.querySelector(`script.topic-static-deferred-items[data-topic-static-list="${CSS.escape(listId)}"]`)
        : listEl.querySelector("script.topic-static-deferred-items");

      if (!dataEl) {
        expander.remove();
        return;
      }

      let chunks = [];
      try {
        chunks = JSON.parse(dataEl.textContent || "[]");
      } catch {
        chunks = [];
      }

      if (!Array.isArray(chunks) || !chunks.length) {
        expander.remove();
        dataEl.remove();
        return;
      }

      dataEl.__topicStaticChunks = chunks;
      dataEl.__topicStaticLoaded = 0;

      const remaining = chunks.reduce((sum, chunk) => {
        return sum + countStaticTopicSkinsInHtml(chunk);
      }, 0);

      updateStaticTopicExpanderText(expander, remaining);
    });
  }

  function updateInventoryExpanderState(listEl) {
    if (!listEl || !isPlayersInventoryTopicPath()) return;

    const cheapItems = Array.from(
      listEl.querySelectorAll('.skin.inventory-hidden-cheap:not(.expander)')
    );

    let expander = listEl.querySelector('.skin.expander');
    const hiddenCheapItems = cheapItems.filter((el) => el.classList.contains("disabled-cheap"));
    const remainingCount = hiddenCheapItems.length;

    if (!cheapItems.length) {
      if (expander) expander.remove();
      return;
    }

    if (!expander) {
      expander = createInventoryExpander(remainingCount);
    }

    const word = getInventoryExpanderWord(remainingCount);
    const textSpans = expander.querySelectorAll(".skin-expander-text span");

    if (textSpans[0]) {
      textSpans[0].textContent = `${remainingCount} ${word}`;
    }

    expander.classList.toggle("disabled", remainingCount <= 0);

    const visibleSkins = Array.from(
      listEl.querySelectorAll('.skin:not(.disabled):not(.disabled-cheap):not(.expander)')
    );

    const lastVisibleSkin = visibleSkins[visibleSkins.length - 1];

    if (remainingCount <= 0) {
      if (!expander.parentNode) {
        listEl.appendChild(expander);
      } else {
        listEl.appendChild(expander);
      }
      return;
    }

    if (!expander.parentNode) {
      listEl.appendChild(expander);
    }

    if (lastVisibleSkin && lastVisibleSkin !== expander.previousElementSibling) {
      lastVisibleSkin.insertAdjacentElement("afterend", expander);
    } else if (!lastVisibleSkin) {
      listEl.prepend(expander);
    }
  }

  function initInventoryCheapItemsExpander() {
    if (!isPlayersInventoryTopicPath()) return;

    const listEl = document.querySelector(".box-skins-list");
    if (!listEl) return;

    const skins = Array.from(listEl.querySelectorAll(".skin:not(.expander)"));

    const cheapPricedItems = skins.filter((skinEl) => {
      const price = getTopicSkinPriceValue(skinEl);
      if (price === null) return false; // без цены не учитываем
      return price < INVENTORY_EXPAND_PRICE_LIMIT;
    });

    if (!cheapPricedItems.length) {
      listEl.querySelector(".skin.expander")?.remove();
      return;
    }

    cheapPricedItems.forEach((skinEl) => {
      skinEl.classList.add("inventory-hidden-cheap", "disabled-cheap");
      skinEl.setAttribute("data-no-preview", "1");
    });

    updateInventoryExpanderState(listEl);
  }

  async function fetchSkinPrices() {
    const now = Date.now();
    if (_skinCache.data && now - _skinCache.ts < _skinCache.ttl) {
      return _skinCache.data;
    }

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort("timeout"), 12000);

    try {
      const res = await fetch(DATA_URL, {
        method: "GET",
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) return null;

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return null;

      const skins = await res.json();
      const data = Array.isArray(skins) ? skins : [];

      const exactMap = new Map();
      const partialList = [];

      for (const item of data) {
        const rawName = item && item.name ? item.name : "";
        const name = normalizePriceName(rawName);
        if (!name) continue;

        const entry = {
          name,
          lookupName: normalizePriceLookupKey(name),
          isSouvenir: /^Souvenir\b/i.test(name),
          isStatTrak: /\bStatTrak\b/i.test(name),
          isStickerSlab: /^Sticker Slab\s*\|/i.test(name),
          min: toNum(item.min_price ?? item.price),
          max: toNum(item.max_price ?? item.price),
        };

        if (!Number.isFinite(entry.min) && !Number.isFinite(entry.max)) continue;

        exactMap.set(entry.lookupName, entry);

        if (name.includes("|")) {
          partialList.push(entry);
        }
      }

      const indexed = { exactMap, partialList };
      _skinCache.data = indexed;
      _skinCache.ts = now;
      return indexed;
    } catch {
      return null;
    } finally {
      clearTimeout(to);
    }
  }

  function buildPriceParts(entries, options = {}) {
    if (!entries || !entries.length) {
      return { normalText: "", souvenirText: "", normalMin: null, souvenirMin: null };
    }

    const {
      allowNormal = true,
      allowSouvenir = true,
    } = options;

    const normal = [];
    const souvenir = [];

    for (const e of entries) {
      if (e.isSouvenir) souvenir.push(e);
      else normal.push(e);
    }

    let normalText = "";
    let souvenirText = "";
    let normalMin = null;
    let souvenirMin = null;

    if (allowNormal && normal.length) {
      const mins = [];
      const maxs = [];

      for (const x of normal) {
        if (Number.isFinite(x.min)) mins.push(x.min);
        if (Number.isFinite(x.max)) maxs.push(x.max);
      }

      const min = mins.length ? Math.min(...mins) : null;
      const max = maxs.length ? Math.max(...maxs) : null;

      normalMin = min;
      normalText = formatRange(min, max);
    }

    if (allowSouvenir && souvenir.length) {
      const mins = [];
      const maxs = [];

      for (const x of souvenir) {
        if (Number.isFinite(x.min)) mins.push(x.min);
        if (Number.isFinite(x.max)) maxs.push(x.max);
      }

      const min = mins.length ? Math.min(...mins) : null;
      const max = maxs.length ? Math.max(...maxs) : null;

      souvenirMin = min;
      souvenirText = formatRange(min, max);
    }

    return { normalText, souvenirText, normalMin, souvenirMin };
  }
    // ---------- Players recs for /players/inventories/ ----------
    (function initPlayersRecsBox() {
      const PLAYERS_LIST_URL = "/code-parts/topics/players-data/players-list/fetch-players.json";
      const PLAYERS_META_URL = "/code-parts/topics/players-data/players-list/players.json";
      const UNKNOWN_IMAGE_CROP = "/img/skins/players/crop/unknown.webp";
      const CACHE_TTL_MS = 5 * 60 * 1000;

      const isPlayerInventoryPage = /\/topic\/players\/inventories\/[^/]+(?:\.html)?$/i.test(window.location.pathname);

      if (!isPlayerInventoryPage) return;

      async function fetchJsonWithSmartCache(url, storageKey) {
        const now = Date.now();
        let cached = null;

        try {
          cached = JSON.parse(localStorage.getItem(storageKey) || "null");
        } catch (_) {
          cached = null;
        }

        if (cached?.data && cached?.time && now - cached.time < CACHE_TTL_MS) {
          return cached.data;
        }

        const headers = {};

        if (cached?.etag) {
          headers["If-None-Match"] = cached.etag;
        }

        if (cached?.lastModified) {
          headers["If-Modified-Since"] = cached.lastModified;
        }

        try {
          const res = await fetch(url, {
            cache: "no-cache",
            headers,
          });

          if (res.status === 304 && cached?.data) {
            localStorage.setItem(storageKey, JSON.stringify({
              ...cached,
              time: now,
            }));

            return cached.data;
          }

          if (!res.ok) {
            if (cached?.data) return cached.data;
            throw new Error(`Fetch failed: ${res.status}`);
          }

          const data = await res.json();

          localStorage.setItem(storageKey, JSON.stringify({
            data,
            time: now,
            etag: res.headers.get("ETag"),
            lastModified: res.headers.get("Last-Modified"),
          }));

          return data;
        } catch (err) {
          if (cached?.data) return cached.data;
          throw err;
        }
      }

      function getCurrentPlayerSlug() {
        return window.location.pathname
          .split("/")
          .pop()
          .replace(/\.html$/i, "")
          .trim()
          .toLowerCase();
      }

      function toCroppedPlayerImagePath(src = "") {
        const value = String(src || "").trim();
        if (!value) return value;

        if (!value.startsWith("/")) return value;
        if (value.includes("/img/skins/players/crop/")) return value;
        if (!value.startsWith("/img/skins/players/")) return value;

        return value.replace("/img/skins/players/", "/img/skins/players/crop/");
      }

      function normalizePlayerSlug(value = "") {
        return String(value)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      function normalizeNationality(value = "") {
        return String(value || "")
          .trim()
          .toLowerCase();
      }

      function shuffleArray(arr = []) {
        const out = Array.from(arr);

        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }

        return out;
      }

      function normalizePlayersList(raw) {
        const rawPlayers =
          Array.isArray(raw) ? raw :
          Array.isArray(raw?.players) ? raw.players :
          Array.isArray(raw?.items) ? raw.items :
          [];

        return rawPlayers
          .map((p) => {
            const nickname = String(
              p?.nickname ||
              p?.nick ||
              p?.player_nickname ||
              ""
            ).trim();

            const realNickname = String(
              p?.real_nickname ||
              p?.realNickname ||
              p?.display_nickname ||
              p?.displayNickname ||
              nickname
            ).trim();

            const slug = String(
              p?.slug ||
              p?.player_slug ||
              normalizePlayerSlug(nickname)
            ).trim();

            const team = String(
              p?.team ||
              p?.organization ||
              p?.org ||
              ""
            ).trim();

            const nationality = String(
              p?.nationality ||
              p?.country ||
              ""
            ).trim();

            const isContentCreator =
              p?.isContentCreator === true ||
              p?.is_content_creator === true;

            const imageRaw = String(
              p?.photo ||
              p?.image ||
              p?.avatar ||
              p?.img ||
              `/img/skins/players/${slug}.webp`
            ).trim();

            const image = toCroppedPlayerImagePath(imageRaw);

            return {
              nickname,
              realNickname,
              slug,
              team,
              nationality,
              isContentCreator,
              image,
            };
          })
          .filter((p) => p.nickname && p.slug);
      }

      function normalizePlayersMetaList(raw) {
        const rawPlayers =
          Array.isArray(raw) ? raw :
          Array.isArray(raw?.players) ? raw.players :
          Array.isArray(raw?.items) ? raw.items :
          [];

        return rawPlayers
          .map((p) => {
            const nickname = String(
              p?.nickname ||
              p?.nick ||
              p?.player_nickname ||
              ""
            ).trim();

            const slug = String(
              p?.slug ||
              p?.player_slug ||
              normalizePlayerSlug(nickname)
            ).trim();

            const totalItemsGrouped = Number(p?.totalItemsGrouped || 0) || 0;

            return {
              nickname,
              slug,
              totalItemsGrouped,
            };
          })
          .filter((p) => p.nickname && p.slug);
      }

      function isUnknownPlayerImage(src = "") {
        const value = String(src || "").trim().toLowerCase();

        if (!value) return true;

        return (
          value.endsWith("/unknown.webp") ||
          value === "/img/skins/players/unknown.webp" ||
          value.includes("players/unknown.webp")
        );
      }

      function getPlayerPriorityGroups(players, nationality) {
        const nat = normalizeNationality(nationality);

        const groups = {
          sameWithPhoto: [],
          sameUnknown: [],
          otherWithPhoto: [],
          otherUnknown: [],
        };

        players.forEach((p) => {
          const pNat = normalizeNationality(p?.nationality);
          const sameNationality = !!nat && !!pNat && pNat === nat;
          const unknownImage = isUnknownPlayerImage(p?.image);

          if (sameNationality && !unknownImage) {
            groups.sameWithPhoto.push(p);
            return;
          }

          if (sameNationality && unknownImage) {
            groups.sameUnknown.push(p);
            return;
          }

          if (!sameNationality && !unknownImage) {
            groups.otherWithPhoto.push(p);
            return;
          }

          groups.otherUnknown.push(p);
        });

        return groups;
      }

      function pickFromPriorityGroups(players, nationality, limit) {
        const groups = getPlayerPriorityGroups(players, nationality);
        const picked = [];

        function takeFrom(list, amount) {
          if (amount <= 0 || !list.length) return [];
          return shuffleArray(list).slice(0, amount);
        }

        picked.push(...takeFrom(groups.sameWithPhoto, limit));

        if (picked.length < limit) {
          picked.push(...takeFrom(groups.sameUnknown, limit - picked.length));
        }

        if (picked.length < limit) {
          picked.push(...takeFrom(groups.otherWithPhoto, limit - picked.length));
        }

        if (picked.length < limit) {
          picked.push(...takeFrom(groups.otherUnknown, limit - picked.length));
        }

        return picked.slice(0, limit);
      }

      function getExcludedPlayerSlugs() {
        const out = new Set();
        const currentSlug = getCurrentPlayerSlug();

        if (currentSlug) out.add(currentSlug);

        document.querySelectorAll(".players-box.team .player[href], .player-teammates .teammate[href]").forEach((a) => {
          const href = a.getAttribute("href") || "";
          const slug = href
            .split("/")
            .pop()
            ?.replace(/\.html$/i, "")
            .trim()
            .toLowerCase();

          if (slug) out.add(slug);
        });

        return out;
      }

      function buildPlayerHref(slug) {
        const prefix = typeof languageTag !== "undefined" && languageTag === "ru" ? "/ru" : "";
        return `${prefix}/topic/players/inventories/${slug}`;
      }

      function createPlayerNode(player) {
        const a = document.createElement("a");
        a.className = "player";
        a.href = buildPlayerHref(player.slug);
        a.setAttribute("data-title", player.realNickname || player.nickname || "");

        const photo = document.createElement("div");
        photo.className = "player-photo";

        const img = document.createElement("img");
        img.src = player.image || `/img/skins/players/crop/${player.slug}.webp`;
        img.alt = `${player.realNickname || player.nickname} Photo`;

        img.onerror = function () {
          this.onerror = null;
          this.src = UNKNOWN_IMAGE_CROP;
          this.alt = "CSGOBROKER Mascotte";
        };

        photo.appendChild(img);
        a.appendChild(photo);

        return a;
      }

      function buildPlayersBox(type, players) {
        const box = document.createElement("div");
        box.className = `players-box ${type}`;

        const sign = document.createElement("div");
        sign.className = "players-sign";

        box.appendChild(sign);
        players.forEach((player) => box.appendChild(createPlayerNode(player)));

        return box;
      }

      async function fetchPlayers() {
        const json = await fetchJsonWithSmartCache(
          PLAYERS_LIST_URL,
          "players_recs_players_list_v1"
        );

        return normalizePlayersList(json);
      }

      async function fetchPlayersMeta() {
        const json = await fetchJsonWithSmartCache(
          PLAYERS_META_URL,
          "players_recs_players_meta_v1"
        );

        return normalizePlayersMetaList(json);
      }

      function filterPlayersWithPages(players, playersMeta) {
        const metaBySlug = new Map();
        const metaByNickname = new Map();

        (Array.isArray(playersMeta) ? playersMeta : []).forEach((player) => {
          const slug = String(player?.slug || "").trim().toLowerCase();
          const nickname = String(player?.nickname || "").trim().toLowerCase();

          if (slug) metaBySlug.set(slug, player);
          if (nickname) metaByNickname.set(nickname, player);
        });

        return (Array.isArray(players) ? players : []).filter((player) => {
          const slug = String(player?.slug || "").trim().toLowerCase();
          const nickname = String(player?.nickname || "").trim().toLowerCase();

          const meta =
            metaBySlug.get(slug) ||
            metaByNickname.get(nickname) ||
            null;

          if (!meta) return false;

          return Number(meta.totalItemsGrouped || 0) > 0;
        });
      }

      function pickRecPlayers(currentPlayer, allPlayers, excludedSlugs) {
        const currentSlug = String(currentPlayer?.slug || "").trim().toLowerCase();
        const currentNationality = String(currentPlayer?.nationality || "").trim();

        const pool = (Array.isArray(allPlayers) ? allPlayers : []).filter((p) => {
          const slug = String(p?.slug || "").trim().toLowerCase();
          return slug && slug !== currentSlug && !excludedSlugs.has(slug);
        });

        const creatorsPool = pool.filter((p) => p.isContentCreator === true);
        const pickedCreators = pickFromPriorityGroups(creatorsPool, currentNationality, 2);

        const used = new Set(pickedCreators.map((p) => String(p.slug).toLowerCase()));

        const remainingPool = pool.filter((p) => !used.has(String(p.slug).toLowerCase()));
        const pickedRest = pickFromPriorityGroups(remainingPool, currentNationality, 6);

        return [...pickedCreators, ...pickedRest].slice(0, 8);
      }

      function insertRecsBox(recsBox) {
        const existingRecs = document.querySelector(".players-box.recs");

        if (existingRecs) {
          existingRecs.replaceWith(recsBox);
          return;
        }

        const teamBox = document.querySelector(".players-box.team");

        if (teamBox) {
          teamBox.insertAdjacentElement("afterend", recsBox);
          return;
        }

        const legacyTeamBox = document.querySelector(".player-teammates");

        if (legacyTeamBox) {
          legacyTeamBox.insertAdjacentElement("afterend", recsBox);
          return;
        }

        const insertTarget = getTopicInsertTarget(document) || getTopicContainer(document);

        if (insertTarget) {
          insertTarget.insertAdjacentElement("afterend", recsBox);
        }
      }

      async function run() {
        try {
          const [allPlayersRaw, playersMeta] = await Promise.all([
            fetchPlayers(),
            fetchPlayersMeta(),
          ]);

          if (!allPlayersRaw.length || !playersMeta.length) return;

          const allPlayers = filterPlayersWithPages(allPlayersRaw, playersMeta);
          if (!allPlayers.length) return;

          const currentSlug = getCurrentPlayerSlug();
          if (!currentSlug) return;

          const currentPlayer = allPlayers.find((p) => String(p.slug).toLowerCase() === currentSlug);
          if (!currentPlayer) return;

          const excludedSlugs = getExcludedPlayerSlugs();
          const recPlayers = pickRecPlayers(currentPlayer, allPlayers, excludedSlugs);

          if (!recPlayers.length) {
            document.querySelector(".players-box.recs")?.remove();
            return;
          }

          const recsBox = buildPlayersBox("recs", recPlayers);
          insertRecsBox(recsBox);

          if (typeof languageTag !== "undefined" && languageTag === "ru") {
            updateURLs(recsBox);
          }
        } catch (err) {
          console.error("players recs init error:", err);
        }
      }

      run();
    })();

function findMatches(name, priceData, skinEl = null) {
  const normalizedName = normalizePriceName(name);
  if (!normalizedName) return [];

  if (isPlayersInventoryTopicPath() && skinEl) {
    return findInventoryPriceMatches(skinEl, normalizedName, priceData);
  }

  const candidates = [normalizedName];

  const weapon = String(skinEl?.getAttribute("weapon") || "").toLowerCase();
  if (
    weapon.includes("sticker") &&
    !/^Sticker\s*\|/i.test(normalizedName)
  ) {
    candidates.push(normalizePriceName(`Sticker | ${normalizedName}`));
  }

  if (
    weapon.includes("charm") &&
    !/^Charm\s*\|/i.test(normalizedName)
  ) {
    candidates.push(normalizePriceName(`Charm | ${normalizedName}`));
  }

  const out = [];

  for (const candidate of candidates) {
    const candidateKey = normalizePriceLookupKey(candidate);
    const strictMatch = isStrictNameMatch(candidate);

    if (strictMatch) {
      const exact = priceData.exactMap.get(candidateKey);
      if (exact && !exact.isStickerSlab) {
        out.push(exact);
        continue;
      }
    }

    for (const item of priceData.partialList) {
      if (item.isStickerSlab) continue;
      if (item.lookupName.includes(candidateKey)) {
        out.push(item);
      }
    }
  }

  return uniqStrings(out.map(item => item.lookupName))
    .map(key => priceData.exactMap.get(key))
    .filter(Boolean);
}

  async function priceSkinsOnPage() {
    const skins = Array.from(document.querySelectorAll(".skin:not(.extra-list)"));
    if (!skins.length) return;

    const priceData = await fetchSkinPrices();
    if (!priceData) return;

    const pending = [];
    let totalValue = 0;

    for (const skinEl of skins) {
      if (skinEl.classList.contains("extra-list")) continue;

      const nameEl = skinEl.querySelector(".skin-desc-name");
      const name = normalizePriceName(nameEl ? nameEl.textContent : "");
      if (!name) continue;

      const nameHasExterior = hasExterior(name);
      const nameIsStatTrak = isStatTrakName(name);
      const nameIsSouvenir = isSouvenirName(name);

      let matched = findMatches(name, priceData, skinEl);
      if (!matched.length) {
        skinEl.setAttribute("data-price-value", "");

        let priceEl = skinEl.querySelector(".skin-price-info");
        if (!priceEl) {
          skinEl.insertAdjacentHTML("beforeend", `<div class="skin-price-info"></div>`);
          priceEl = skinEl.querySelector(".skin-price-info:last-of-type");
        }

        if (priceEl) {
          priceEl.classList.remove("loading");

          const defaultPriceEl = priceEl.querySelector(".default-price-info");
          const souvenirEl = priceEl.querySelector(".souvenir-price-info");

          if (defaultPriceEl) {
            defaultPriceEl.remove();
          }

          if (souvenirEl) {
            souvenirEl.remove();
          }

          // Удаляем старый текстовый узел цены, если он остался
          Array.from(priceEl.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.remove();
            }
          });
        }

        continue;
      }

      if (nameHasExterior && !nameIsStatTrak) {
        matched = matched.filter(item => !item.isStatTrak);
      }

      if (!matched.length) {
        skinEl.setAttribute("data-price-value", "");

        let priceEl = skinEl.querySelector(".skin-price-info");
        if (!priceEl) {
          skinEl.insertAdjacentHTML("beforeend", `<div class="skin-price-info"></div>`);
          priceEl = skinEl.querySelector(".skin-price-info:last-of-type");
        }

        if (priceEl) {
          priceEl.classList.remove("loading");

          const defaultPriceEl = priceEl.querySelector(".default-price-info");
          const souvenirEl = priceEl.querySelector(".souvenir-price-info");

          if (defaultPriceEl) {
            defaultPriceEl.remove();
          }

          if (souvenirEl) {
            souvenirEl.remove();
          }

          // Удаляем старый текстовый узел цены, если он остался
          Array.from(priceEl.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.remove();
            }
          });
        }

        continue;
      }

      const parts = buildPriceParts(matched, {
        allowNormal: !nameIsSouvenir,
        allowSouvenir: !nameHasExterior || nameIsSouvenir,
      });

      if (!parts.normalText && !parts.souvenirText) {
        skinEl.setAttribute("data-price-value", "");
        continue;
      }

      const sortPrice = nameIsSouvenir
        ? (parts.souvenirMin ?? parts.normalMin)
        : (parts.normalMin ?? parts.souvenirMin);

      const amount = getSkinAmount(skinEl);

      if (Number.isFinite(sortPrice)) {
        skinEl.setAttribute("data-price-value", String(sortPrice));
        totalValue += sortPrice * amount;
      } else {
        skinEl.setAttribute("data-price-value", "");
      }

      pending.push({
        skinEl,
        normalText: parts.normalText,
        souvenirText: parts.souvenirText,
        addStatTrakClass: nameIsStatTrak,
        isSouvenirCard: nameIsSouvenir,
      });
    }

    const BATCH_SIZE = 30;
    let i = 0;

    function applyBatch() {
      const end = Math.min(i + BATCH_SIZE, pending.length);

      for (; i < end; i++) {
        const {
          skinEl,
          normalText,
          souvenirText,
          addStatTrakClass,
          isSouvenirCard,
        } = pending[i];

        let priceEl = skinEl.querySelector(".skin-price-info");

        if (!priceEl) {
          skinEl.insertAdjacentHTML("beforeend", `<div class="skin-price-info"></div>`);
          priceEl = skinEl.querySelector(".skin-price-info:last-of-type");
        }

        if (!priceEl) continue;

        priceEl.classList.remove("loading");

        // Удаляем старые текстовые узлы цены,
        // которые могли остаться от прежней версии скрипта
        Array.from(priceEl.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.remove();
          }
        });

        let defaultPriceEl = priceEl.querySelector(".default-price-info");
        let souvenirEl = priceEl.querySelector(".souvenir-price-info");

        if (!isSouvenirCard && normalText) {
          if (!defaultPriceEl) {
            defaultPriceEl = document.createElement("div");
            defaultPriceEl.className = "default-price-info";

            if (souvenirEl) {
              priceEl.insertBefore(defaultPriceEl, souvenirEl);
            } else {
              priceEl.appendChild(defaultPriceEl);
            }
          }

          defaultPriceEl.textContent = normalText;
        } else if (defaultPriceEl) {
          defaultPriceEl.remove();
          defaultPriceEl = null;
        }

        if (addStatTrakClass) {
          priceEl.classList.add("stattrak");
        } else {
          priceEl.classList.remove("stattrak");
        }

        if (souvenirText) {
          if (!souvenirEl) {
            souvenirEl = document.createElement("div");
            souvenirEl.className = "souvenir-price-info";
            priceEl.appendChild(souvenirEl);
          }

          souvenirEl.textContent = souvenirText;
        } else if (souvenirEl) {
          souvenirEl.remove();
        }
      }

      if (i < pending.length) {
        requestAnimationFrame(applyBatch);
      } else {
        finalize();
      }
    }

    async function finalize() {
      await updateTopicTotalValue(totalValue);

      $(".skin img").each(function () {
        if (this.complete) {
          $(this).addClass("imported");
        } else {
          $(this).on("load", function () {
            $(this).addClass("imported");
          });
        }
      });

      if (isPlayersInventoryTopicPath()) {
        applyDefaultInventoryPriceSort();
        initInventoryCheapItemsExpander();
      }

      if (location.pathname.includes("/topic/sticker-crafts/")) {
        updateCraftComponentList();
      }
    }

    requestAnimationFrame(applyBatch);
  }

  if ($(".skin").length) {
    priceSkinsOnPage();
  }

  function keepStaticTopicExpanderLast(listEl) {
    if (!listEl) return;

    const expander = listEl.querySelector(".skin.expander.topic-static-expander");
    if (!expander) return;

    const dataEl = listEl.querySelector("script.topic-static-deferred-items");

    if (dataEl) {
      listEl.appendChild(dataEl);
    }

    listEl.appendChild(expander);
    syncStaticTopicExpanderVisibility(listEl);
  }

  window.keepStaticTopicExpanderLast = keepStaticTopicExpanderLast;

  function syncStaticTopicExpanderVisibility(listEl) {
    if (!listEl) return;

    const expander = listEl.querySelector(".skin.expander.topic-static-expander");
    if (!expander) return;

    const hasVisibleSkins = !!listEl.querySelector(
      ".skin:not(.expander):not(.disabled):not(.disabled-cheap):not(.none)"
    );

    expander.classList.toggle("hidden", !hasVisibleSkins);
  }

    function getTopicFilterClassFromButton(button) {
      const classList = ($(button).attr("class") || "").split(/\s+/);

      return classList.find(
        (cls) =>
          cls &&
          cls !== "navigation-weapon-type" &&
          cls !== "enabled" &&
          cls !== "notexist" &&
          cls !== "solo-category"
      );
    }

    function syncStaticTopicItemsWithNavigation(listEl) {
      if (!listEl) return;

      $(".navigation-weapon-type").each(function () {
        const filterClass = getTopicFilterClassFromButton(this);
        if (!filterClass) return;

        const enabled = $(this).hasClass("enabled");

        $(listEl)
          .find(`.skin.${filterClass}:not(.expander)`)
          .toggleClass("disabled", !enabled);
      });

      syncStaticTopicExpanderVisibility(listEl);
      keepStaticTopicExpanderLast(listEl);
    }
    
    window.syncStaticTopicItemsWithNavigation = syncStaticTopicItemsWithNavigation;

  initStaticTopicDeferredExpanders();

  $(document).on("click", ".skin.expander.topic-static-expander", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    if (this.classList.contains("disabled")) return;

    const listEl = this.closest(".box-skins-list");
    if (!listEl) return;

    const listId = this.getAttribute("data-topic-static-list") || "";
    const dataEl = listId
      ? listEl.querySelector(`script.topic-static-deferred-items[data-topic-static-list="${CSS.escape(listId)}"]`)
      : listEl.querySelector("script.topic-static-deferred-items");

    if (!dataEl) {
      this.remove();
      return;
    }

    const chunks = Array.isArray(dataEl.__topicStaticChunks)
      ? dataEl.__topicStaticChunks
      : [];

    const loadedIndex = Number(dataEl.__topicStaticLoaded || 0);
    const html = chunks[loadedIndex];

    if (!html) {
      this.classList.add("disabled");
      this.remove();
      dataEl.remove();
      return;
    }

    this.insertAdjacentHTML("beforebegin", html);
    
    syncStaticTopicItemsWithNavigation(listEl);

    keepStaticTopicExpanderLast(listEl);
    dataEl.__topicStaticLoaded = loadedIndex + 1;

    const remainingChunks = chunks.slice(dataEl.__topicStaticLoaded);
    const remaining = remainingChunks.reduce((sum, chunk) => {
      return sum + countStaticTopicSkinsInHtml(chunk);
    }, 0);

    if (remaining <= 0) {
      this.remove();
      dataEl.remove();
    } else {
      updateStaticTopicExpanderText(this, remaining);
      keepStaticTopicExpanderLast(listEl);
    }

    if (typeof priceSkinsOnPage === "function") {
      priceSkinsOnPage();
    }
  });
  $(document).on("click", ".skin.expander", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if ($(this).hasClass("disabled")) return;

    const listEl = this.closest(".box-skins-list");
    if (!listEl) return;

    const batchSize = 24;

    const hiddenCheapItems = Array.from(
      listEl.querySelectorAll(".skin.inventory-hidden-cheap.disabled-cheap:not(.expander)")
    ).slice(0, batchSize);

    hiddenCheapItems.forEach((skinEl) => {
      skinEl.classList.remove("disabled-cheap");
      skinEl.removeAttribute("data-no-preview");
    });

    updateInventoryExpanderState(listEl);
  });
})();

    // ---------- КРАФТЫ: работа только с уже существующими .skin ----------
    const updateCraftComponentList = () => {
    const boxes = Array.from(document.querySelectorAll('.siteblock')).map(siteblock =>
      siteblock.querySelector('.item-topic-grandbox') || siteblock.querySelector('.topic-grandbox')
    ).filter(Boolean);

      boxes.forEach(box => {
        const thirdSection = box.querySelector('.section.third');
        const introduceCraftList = document.querySelector('.introduce-craft .craft-components-list');
        const craftingTable = document.querySelector('.crafting-table-screens');

        if (!thirdSection || !introduceCraftList) return;

        const stickerElements = Array.from(thirdSection.querySelectorAll('.skin'));

        // === ДОБАВЛЕНИЕ В СПИСОК КОМПОНЕНТОВ КРАФТА ===
        const map = new Map();
        stickerElements.forEach(skin => {
          const nameAttr = skin.getAttribute("skin-id");
          if (!nameAttr) return;
          const cleanedName = nameAttr.replace(/^Sticker\s\|\s/, '');

          if (!map.has(cleanedName)) {
            map.set(cleanedName, { count: 1, original: skin });
          } else {
            map.get(cleanedName).count++;
          }
        });

        introduceCraftList.innerHTML = '';

        Array.from(map.entries()).forEach(([name, { count, original }], index, arr) => {
          const spanSkin = document.createElement('span');
          spanSkin.className = original.className;
          spanSkin.classList.add('skin');
          spanSkin.setAttribute('skin-id', original.getAttribute('skin-id') || '');
          spanSkin.setAttribute('weapon', original.getAttribute('weapon') || '');

          const img = original.querySelector('img');
          if (img) {
            const newImg = img.cloneNode(true);
            spanSkin.appendChild(newImg);
          }

          const nameDiv = original.querySelector('.skin-desc-name');
          if (nameDiv) {
            const newName = document.createElement('div');
            newName.className = 'skin-desc-name';
            newName.textContent = nameDiv.textContent.replace(/^Sticker\s\|\s/, '').trim();

            if (count > 1) {
              const prefix = document.createElement('span');
              prefix.textContent = `x${count} `;
              spanSkin.appendChild(prefix);
            }

            spanSkin.appendChild(newName);
          }

          const priceInfo = original.querySelector('.skin-price-info');
          if (priceInfo) {
            spanSkin.appendChild(priceInfo.cloneNode(true));
          }

          introduceCraftList.appendChild(spanSkin);

          if (index < arr.length - 1) {
            introduceCraftList.appendChild(document.createTextNode(', '));
          }
        });

        // === ДОБАВЛЕНИЕ В КАЖДЫЙ .crafting-table-screen ===
        if (craftingTable) {
          const screenElements = craftingTable.querySelectorAll('.crafting-table-screen');
          stickerElements.forEach((skin, i) => {
            if (i < screenElements.length) {
              const clonedSkin = skin.cloneNode(true);
              screenElements[i].prepend(clonedSkin);
            }
          });
        }
      });
    };

    // ---------- Навигация/сервисы/фильтры и т.д. (без изменений) ----------
    function generateSearchUrl(skinName, selectedSite) {
      const siteUrls = {
        Tradeit: `https://tradeit.gg/csgo/store?search=${encodeURIComponent(skinName)}&aff=csgobroker`,
        BitSkins: `https://bitskins.com/market/cs2?search={"order":[{"field":"price","order":"ASC"}],"where":{"skin_name":"${encodeURIComponent(skinName)}"}}&ref_alias=csgobroker`,
        Steam: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(skinName)}`,
        CSMoney: `https://cs.money/market/buy/?search=${encodeURIComponent(skinName)}&sort=price&order=asc&utm_source=mediabuy&utm_medium=csgobroker&utm_campaign=market&utm_content=link`,
        "AvanMarket": `https://avan.market/ru/market/cs?name=${encodeURIComponent(skinName)}&r=broker`,
        SkinSwap: `https://skinswap.com/buy?search=${encodeURIComponent(skinName)}&r=csgobroker&appid=730`,
        "MoonMarket": `https://moon.market/shop/?lang=ru&app_id=730&filters=&search=${encodeURIComponent(skinName)}&sort=price_desc&float_from=&float_to=&price_from=&price_to=&r=DTQBM8816d89c`,
        default: `https://lis-skins.ru/market/csgo/?query=${encodeURIComponent(skinName)}&rf=83346597`,
      };
      return siteUrls[selectedSite] || siteUrls["default"];
    }

    function updateNavigationReset() {
      const hasActiveFilters = $(".navigation-weapon-type.enabled").length > 0;
      const $resetButton = $(".topic-centralizer .navigation-reset");

      if (!hasActiveFilters) {
        if ($resetButton.length === 0) {
          $(".topic-centralizer").append('<div class="navigation-reset">Reset Sort</div>');
        }
      } else {
        $resetButton.remove();
      }
    }

    // ---------- Slick слайды для крафта (без изменений) ----------
    let switchLock = false;

    $('.crafting-table-screens').on('init', function (event, slick) {
      const $slides = slick.$slides;
      const total = $slides.length;
      let resultIndex = total - 1;

      if ($($slides[total - 1]).hasClass('alternative')) {
        resultIndex = total - 2;
      }

      setTimeout(function () {
        $('.crafting-table-screens').slick('slickGoTo', resultIndex, true);
      }, 0);
    });

    $('.crafting-table-screens').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      speed: 450,
      autoplaySpeed: 5500,
      pauseOnHover: true,
      pauseOnDotsHover: true,
      fade: true,
      cssEase: 'linear',
      prevArrow: '<button aria-label="Prev Slide" class="prev-button"><i class="officon chevron left"></i></button>',
      nextArrow: '<button aria-label="Next Slide" class="next-button"><i class="officon chevron right"></i></button>',
      dots: true,
      customPaging: function (slider, i) {
        const $slides = slider.$slides;
        const $currentSlide = $($slides[i]);
        const total = $slides.length;

        let label = `Step ${i + 1}`;
        const isAltLast = $($slides[total - 1]).hasClass('alternative');

        if ($currentSlide.hasClass('alternative') && i === total - 1) {
          label = 'Alternative';
        } else if (i === total - 2 && isAltLast) {
          label = 'Result';
        } else if (i === total - 1) {
          label = 'Result';
        } else if ($currentSlide.hasClass('alternative')) {
          label = 'Alternative';
        }

        if (typeof languageTag !== 'undefined' && languageTag === 'ru') {
          if (label.startsWith('Step')) {
            const stepNum = label.match(/\d+/);
            label = `Шаг ${stepNum ? stepNum[0] : ''}`;
          } else if (label === 'Result') {
            label = 'Результат';
          } else if (label === 'Alternative') {
            label = 'Вариант 2';
          }
        }

        return `<button type="button" role="tab"><span>${label}</span></button>`;
      }
    });

    // ---------- Preview (оставляем) ----------
    async function showCraftPreviewWindow(element) {
      const previewWindow = $("#preview-window");
      const previewContent = $("#preview-content");

      const skinBox = $(element).closest(".preview-craft");
      const units = skinBox.find(".preview-craft-unit");
      const boxId = skinBox.attr("data-box-id");

      previewWindow.removeClass("hidden").addClass("inspect-craft").attr({
        "data-current-index": units.index(element),
        "data-total-items": units.length,
        "data-current-box-id": boxId,
        "data-craft-mode": "true"
      });

      const content = $(element).html();
      previewContent.html(content);
    }

    $(document).ready(function () {
      let boxCounter = 0;
      $(".box-skins-list, .item-topic-grandbox, .topic-grandbox, .introduce-craft, .character-box, .preview-craft").each(function () {
        if (!$(this).attr("data-box-id")) {
          $(this).attr("data-box-id", `box-${boxCounter++}`);
        }
      });
    });

    async function showPreviewWindow(element) {
      if (!element) return;
      if (
        $(element).hasClass("extra-list") ||
        $(element).hasClass("expander") ||
        element.getAttribute("data-no-preview") === "1"
      ) return;

      const previewWindow = $("#preview-window");
      const previewContent = $("#preview-content");
      let skinClasses = [];

      previewWindow.attr("class", "hidden");

      if ($(element).hasClass("skin none")) return;

      if ($(element).hasClass("skin")) {
        skinClasses = $(element).attr("class").split(" ");
      }

      const skinBox = $(element).closest("[data-box-id]");
      const visibleItems = skinBox.find('.skin:not(.disabled):not(.disabled-cheap):not(.none):not(.extra-list):not(.expander):not([data-no-preview="1"])');
      const totalItems = visibleItems.length;
      const itemName = element?.querySelector(".skin-desc-name")?.textContent.trim() || "";
      const weaponName = itemName.split("|")[0].trim();
      const boxId = skinBox.attr("data-box-id");

      previewWindow.removeClass("hidden").attr({
        "data-current-index": visibleItems.index(element),
        "data-total-items": totalItems,
        "data-current-box-id": boxId,
      });

      skinClasses.forEach((skinClass) => {
        if (skinClass !== "skin") {
          previewWindow.addClass(skinClass);
        }
      });

      previewContent.html(element.innerHTML);

      let previewExtras = $("#preview-showcase .preview-extras");
      if (previewExtras.length === 0) {
        previewExtras = $("<div>", { class: "preview-extras" });
        $("#preview-showcase").append(previewExtras);
      }

      previewExtras.find(".skin-alt-info, .skin-craft-info").remove();

      const weapon = element.getAttribute("weapon") || "";
      const weaponLower = weapon.toLowerCase();

      const isTournamentStickerWeapon =
        /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}$/i.test(weaponLower) ||
        /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(weaponLower);

      const isSticker =
        weaponLower.includes("sticker") ||
        weaponLower.includes("capsule") ||
        isTournamentStickerWeapon;

      if (isSticker) {
        previewExtras.find(".skin-alt-info").remove();
      }

      const skinId = element.getAttribute("skin-id");

      let skinData = null;
      try {
        const skinsDataResponse = await fetch(`/code-parts/topics/skins-list/${weapon}.json`);
        const skinsData = await skinsDataResponse.json();
        skinData = skinsData?.[skinId] || null;
      } catch {
        skinData = null;
      }

      if (!isSticker) {
        let skinAltInfoDiv = previewExtras.find(".skin-alt-info");

        if (skinAltInfoDiv.length === 0) {
          skinAltInfoDiv = $("<a>", {
            class: "skin-alt-info titled",
            html: '<i class="officon library"></i>',
          });
          previewExtras.prepend(skinAltInfoDiv);
        }

        const isAgentsCollection =
          typeof skinData?.collection === "string" &&
          skinData.collection.toLowerCase().includes("agents");

        const altInfoHref = isAgentsCollection
          ? (languageTag === "ru" ? `/ru/topic/items/agents` : `/topic/items/agents`)
          : (languageTag === "ru" ? `/ru/topic/items/${weapon}` : `/topic/items/${weapon}`);

        const altInfoTitle = isAgentsCollection
          ? (languageTag === "ru" ? `Все Агенты` : `All Agents`)
          : (languageTag === "ru" ? `Все Скины на ${weaponName}` : `All Skins on ${weaponName}`);

        skinAltInfoDiv.attr({
          href: altInfoHref,
          "data-title": altInfoTitle,
        });
      }

      let skinColorInfo = previewExtras.find(".skin-color-info");
      if (skinColorInfo.length === 0) {
        skinColorInfo = $("<div>", { class: "skin-color-info" }).css({ display: "flex", opacity: 0 });
        previewExtras.append(skinColorInfo);
      }

      let skinExtraInfo = previewExtras.find(".skin-extra-info.main-extra-info");
      if (skinExtraInfo.length === 0) {
        skinExtraInfo = $("<div>", { class: "skin-extra-info main-extra-info" }).css({ display: "flex", opacity: 0 });
        previewExtras.append(skinExtraInfo);
      }

      let tournamentExtraInfo = previewExtras.find(".skin-extra-info.tournament-extra-info");
      if (tournamentExtraInfo.length === 0) {
        tournamentExtraInfo = $("<div>", { class: "skin-extra-info tournament-extra-info" }).css({ display: "flex", opacity: 0 });
        previewExtras.append(tournamentExtraInfo);
      }

      skinColorInfo.stop(true, true);
      skinExtraInfo.stop(true, true);
      tournamentExtraInfo.stop(true, true);

      const hideAnimations = [];

      if (parseFloat(skinColorInfo.css("opacity")) > 0) {
        hideAnimations.push(
          skinColorInfo.animate({ opacity: 0 }, 100).promise().then(() => {
            skinColorInfo.css({ display: "none" });
          })
        );
      }
      if (parseFloat(skinExtraInfo.css("opacity")) > 0) {
        hideAnimations.push(
          skinExtraInfo.animate({ opacity: 0 }, 100).promise().then(() => {
            skinExtraInfo.css({ display: "none" });
          })
        );
      }

      if (parseFloat(tournamentExtraInfo.css("opacity")) > 0) {
        hideAnimations.push(
          tournamentExtraInfo.animate({ opacity: 0 }, 100).promise().then(() => {
            tournamentExtraInfo.css({ display: "none" });
          })
        );
      }

      await Promise.all(hideAnimations);
      skinColorInfo.empty();
      skinExtraInfo.empty();
      tournamentExtraInfo.empty();

      const bindsDataResponse = await fetch("/code-parts/topics/sticker-crafts-binds.json");
      const bindsData = await bindsDataResponse.json();
      const pageKey = Object.keys(bindsData).find(key => bindsData[key] === itemName);

      if (pageKey) {
        const skinCraftInfoDiv = $("<a>", {
          class: "skin-craft-info titled",
          href: languageTag === "ru"
            ? `/ru/topic/sticker-crafts/skin/${pageKey}`
            : `/topic/sticker-crafts/skin/${pageKey}`,
          "data-title": languageTag === "ru"
            ? `Все Стикер-Крафты для ${itemName}`
            : `All Sticker-Crafts for ${itemName}`,
          html: '<i class="officon stickers"></i>',
        });
        previewExtras.prepend(skinCraftInfoDiv);
      }

      if (skinData) {
        const imgElement = previewContent.find("img");
        if (skinData.imageOG && imgElement.length) {
          imgElement.stop(true, true).fadeOut(150, function () {
            imgElement.attr("src", skinData.image).fadeIn(150);
          });
        } else if (skinData.imageOG) {
          previewContent.append(`
              <img src="${skinData.image}" draggable="false" alt="${skinData.name}">
              <div class="skin-desc-name">${skinData.name}</div>
          `);
        }

        if (skinData.color) {
          skinData.color.forEach((color) => {
            const colorLink = $("<a>", {
              class: `skin-color ${color.toLowerCase()}`,
              href: languageTag === "ru"
                ? `/ru/topic/skins/${color.toLowerCase()}-skins`
                : `/topic/skins/${color.toLowerCase()}-skins`,
            });
            skinColorInfo.append(colorLink);
          });
        }

      function getTopicItemsArray(data) {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.items)) return data.items;
        return [];
      }

      function createPreviewExtraLink({ href, img, title }) {
        return $("<a>", { href }).append(
          $("<img>", { src: img, alt: title }),
          $("<span>").text(title)
        );
      }

      async function findTopicItemByTitle(file, title) {
        if (!title) return null;

        const response = await fetch(`/code-parts/topics/${file}.json`);
        if (!response.ok) return null;

        const data = await response.json();
        const items = getTopicItemsArray(data);

        return items.find(item => String(item.title || "").trim() === String(title).trim()) || null;
      }

      async function handleCollectionOrCase(type) {
        const file = type === "collection" ? "collections" : "cases";
        const searchTitle = skinData[type];
        const match = await findTopicItemByTitle(file, searchTitle);

        if (!match) return;

        const link = createPreviewExtraLink({
          href: `/topic/${file}/${match.id}`,
          img: match.img,
          title: match.title,
        });

        skinExtraInfo.append(link);
      }

      async function handleStickerCapsuleByField(field, file, pathType) {
        const searchTitle = skinData?.[field];
        const weaponId = String(weapon || "").toLowerCase();

        const response = await fetch(`/code-parts/topics/${file}.json`);
        if (!response.ok) return;

        const data = await response.json();
        const items = getTopicItemsArray(data);

        let match = null;

        if (searchTitle) {
          match = items.find(item => String(item.title || "").trim() === String(searchTitle).trim()) || null;
        }

        if (!match && weaponId) {
          match = items.find(item => {
            const id = String(item.id || "").toLowerCase();
            return id && id === weaponId;
          }) || null;
        }

        if (!match) return;

        const link = createPreviewExtraLink({
          href: `/topic/${pathType}/${match.id}`,
          img: match.img,
          title: match.title,
        });

        skinExtraInfo.append(link);
      }

        async function handleTournamentStickerGroup() {

        const weaponId = String(weapon || "").toLowerCase();
        if (!weaponId) return;

        const response = await fetch("/code-parts/topics/tournament-stickers.json");
        if (!response.ok) return;

        const data = await response.json();
        const items = getTopicItemsArray(data);

        const match = items
          .slice()
          .sort((a, b) => String(b.id || "").length - String(a.id || "").length)
          .find(item => {
            const id = String(item.id || "").toLowerCase();
            return id && (weaponId === id || weaponId.startsWith(`${id}-`));
          });

        if (!match) return;

        const link = createPreviewExtraLink({
          href: `/topic/tournament-stickers/${match.id}`,
          img: match.img,
          title: match.title,
        });

        tournamentExtraInfo.append(link);
      }

      await handleCollectionOrCase("collection");
      await handleCollectionOrCase("case");

      await handleStickerCapsuleByField("sticker-capsule", "sticker-capsules", "stickers");
      await handleStickerCapsuleByField("autograph-capsule", "autograph-capsules", "stickers");

      await handleTournamentStickerGroup();
      }

      skinColorInfo.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 100);

      if (skinExtraInfo.children().length) {
        skinExtraInfo.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 100);
      } else {
        skinExtraInfo.css({ display: "none", opacity: 0 });
      }

      if (tournamentExtraInfo.children().length) {
        tournamentExtraInfo.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 100);
      } else {
        tournamentExtraInfo.css({ display: "none", opacity: 0 });
      }

      $(".site-searcher-box")
        .off("click")
        .on("click", function () {
          const selectedSite = this.id;
          const searchName = itemName;
          const searchUrl = generateSearchUrl(searchName, selectedSite);
          window.open(searchUrl, "_blank");
        });

      const PreviewButtons = document.querySelector(".preview-extras");
      if (languageTag === "ru") {
        updateURLs(PreviewButtons);
      }
    }

    function closePreviewWindow() {
      const previewWindow = $("#preview-window");
      previewWindow.removeAttr("class").addClass("hidden");

      previewWindow.find(".skin-alt-info, .skin-craft-info").remove();

      const previewExtras = $("#preview-showcase .preview-extras");
      if (previewExtras.length > 0) {
          previewExtras.find(".skin-color-info, .skin-extra-info").stop(true, true).fadeOut(100, function() {
              $(this).empty();
          });
      }
    }

    async function switchSkin(direction) {
      if (switchLock) return;
      switchLock = true;

      const $previewWindow = $("#preview-window");
      const currentBoxId = $previewWindow.attr("data-current-box-id");
      const isCraftMode = $previewWindow.hasClass("preview-craft") || $("[data-box-id='" + currentBoxId + "']").hasClass("preview-craft");

      try {
        if (isCraftMode) {
          const currentBox = $(".preview-craft[data-box-id='" + currentBoxId + "']");
          const units = currentBox.find(".preview-craft-unit");
          const total = units.length;
          const currentIndex = +$previewWindow.attr("data-current-index");

          const newIndex = (direction === "left")
            ? (currentIndex - 1 + total) % total
            : (currentIndex + 1) % total;

          const newUnit = units.get(newIndex);
          if (newUnit) {
            await showCraftPreviewWindow(newUnit);
            $previewWindow.attr("data-current-index", newIndex);
          }
        } else {
          const currentBox = $("[data-box-id='" + currentBoxId + "']");
          const visibleItems = currentBox.find('.skin:not(.disabled):not(.none):not(.extra-list):not(.expander):not([data-no-preview="1"])');
          const total = visibleItems.length;
          const currentIndex = +$previewWindow.attr("data-current-index");

          const newIndex = (direction === "left")
            ? (currentIndex - 1 + total) % total
            : (currentIndex + 1) % total;

          const newSkin = visibleItems.get(newIndex);
          if (newSkin) {
            await showPreviewWindow(newSkin);
            $previewWindow.attr("data-current-index", newIndex);
          }
        }
      } catch (err) {
        console.error("Ошибка при переключении:", err);
      }

      switchLock = false;
    }

    $(document).on("click", ".skin", function (e) {
      if (
        $(this).hasClass("extra-list") ||
        $(this).hasClass("expander") ||
        $(this).attr("data-no-preview") === "1"
      ) {
        return;
      }

      showPreviewWindow(this);
    });

    $(document).on("click", ".preview-close-button", function () {
      closePreviewWindow();
    });
    $(document).on("click", "#preview-window", function (e) {
      if ($(e.target).closest("#preview-showcase").length === 0) {
        closePreviewWindow();
      }
    });
    $(document).on("click", ".preview-nav-button.left", function () {
      switchSkin("left");
    });
    $(document).on("click", ".preview-nav-button.right", function () {
      switchSkin("right");
    });
    $(document).on("click", ".preview-craft-unit", function () {
      showCraftPreviewWindow(this);
    });

    // ---------- Страницы /skins/ (UI) ----------

        // ---------- Price sorter for /topic/skins/* ----------
    function isPriceSorterAllowedPath(pathname) {
      const match = pathname.match(/^\/(?:ru\/)?topic\/skins(?:\/([^\/]+))?\/?$/i);
      if (!match) return false;

      const leaf = (match[1] || "").toLowerCase();
      return !leaf.startsWith("best-") && !leaf.startsWith("cheapest-");
    }

    function ensureOriginalSkinOrder($list) {
      $list.children(".skin").each(function (index) {
        if (!this.hasAttribute("data-sort-origin")) {
          this.setAttribute("data-sort-origin", String(index));
        }
      });
    }

    function getSkinPriceValue($skin) {
      const $price = $skin.find(".skin-price-info").first();
      if (!$price.length) return null;

      // Берём только первое число из блока цены:
      // "12.00$ - 18.00$" -> 12
      // "7.50$" -> 7.5
      const text = ($price.text() || "").replace(",", ".").trim();
      const match = text.match(/\d+(?:\.\d+)?/);

      if (!match) return null;

      const value = Number(match[0]);
      return Number.isFinite(value) ? value : null;
    }

    function sortSkinsInList($list, direction) {
      ensureOriginalSkinOrder($list);

      const skins = $list.children(".skin").not(".expander").get();

      if (!skins.length) return;

      if (direction === "original") {
        skins.sort((a, b) => {
          const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
          const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
          return aIndex - bIndex;
        });
      } else {
        skins.sort((a, b) => {
          const aPrice = getSkinPriceValue($(a));
          const bPrice = getSkinPriceValue($(b));

          // Скины без цены всегда в конец
          const aMissing = aPrice === null;
          const bMissing = bPrice === null;

          if (aMissing && bMissing) {
            const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
            const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
            return aIndex - bIndex;
          }

          if (aMissing) return 1;
          if (bMissing) return -1;

          if (direction === "desc") {
            if (bPrice !== aPrice) return bPrice - aPrice;
          } else if (direction === "asc") {
            if (aPrice !== bPrice) return aPrice - bPrice;
          }

          // одинаковые цены — сохраняем исходный порядок
          const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
          const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
          return aIndex - bIndex;
        });
      }

      $list.append(skins);

    $list.each(function () {
      window.keepStaticTopicExpanderLast?.(this);
    });
    }

    $(document).on("click", ".box-skins-list .price-sorter", function () {
      if (!isPriceSorterAllowedPath(window.location.pathname)) return;

      const $sorter = $(this);
      const $list = $sorter.closest(".box-skins-list");

      if (!$list.length) return;

      ensureOriginalSkinOrder($list);

      const currentState = Number($list.attr("data-price-sort-state")) || 0;
      let nextState = 0;

      // 0 -> 1 -> 2 -> 0
      if (currentState === 0) {
        nextState = 1; // expensive -> cheap
      } else if (currentState === 1) {
        nextState = 2; // cheap -> expensive
      } else {
        nextState = 0; // original
      }

      $list.removeClass("sort-to-highest sort-to-lowest");

      if (nextState === 1) {
        sortSkinsInList($list, "desc");
        $list.addClass("sort-to-highest");
      } else if (nextState === 2) {
        sortSkinsInList($list, "asc");
        $list.addClass("sort-to-lowest");
      } else {
        sortSkinsInList($list, "original");
      }

      $list.attr("data-price-sort-state", String(nextState));
    });

    if (currentPath.includes("/skins/")) {
      $(".close-box-skins").on("click", function () {
        const parentBoxSkins = $(this).closest(".box-skins");
        parentBoxSkins.toggleClass("selected");
        $(".box-skins").not(parentBoxSkins).removeClass("selected");

        $(this).toggleClass("zoom-in zoom-out");
        $(".close-box-skins")
          .not($(this))
          .removeClass("zoom-out")
          .addClass("zoom-in");
      });

      $(".box-skins-name").click(function () {
        const parentBoxSkins = $(this).closest(".box-skins");
        parentBoxSkins.toggleClass("selected");
        $(".box-skins").not(parentBoxSkins).removeClass("selected");

        $(this)
          .siblings(".close-box-skins")
          .toggleClass("zoom-in zoom-out");
      });

      document.addEventListener("DOMContentLoaded", () => {
        document
          .querySelectorAll(".box-skins-name")
          .forEach((boxSkinsName) => boxSkinsName.classList.add("visible"));
      });

      $(".navigation-weapon-type").on("click", function () {
        const classList = ($(this).attr("class") || "").split(/\s+/);
        const weaponType = classList.find(
          (cls) =>
            cls &&
            cls !== "navigation-weapon-type" &&
            cls !== "enabled" &&
            cls !== "notexist" &&
            cls !== "solo-category"
        );

        if (!weaponType) return;

        $(`.box-skins.${weaponType}`).toggleClass("disabled");
        $(this).toggleClass("enabled");
        updateNavigationReset();
      });

      $(".topic-centralizer").on("click", ".navigation-reset", function () {
        $(".box-skins").removeClass("disabled selected");
        $(".navigation-weapon-type").not(".notexist").addClass("enabled");
        $(".navigation-weapon-type.notexist").removeClass("enabled");
        $(".topic-centralizer .navigation-reset").remove();
      });
    }
    // ---------- Навигация внутри items/stickers/cases/charms/skins/collections ----------
    else if (
      currentPath.includes("/items/") ||
      currentPath.includes("/stickers/") ||
      currentPath.includes("/tournament-stickers/") ||
      currentPath.includes("/cases/") ||
      currentPath.includes("/players/inventories/") ||
      currentPath.includes("/charms/") ||
      currentPath.includes("/skins/") ||
      currentPath.includes("/collections/")
    ) {
      const $skinBox = $(".box-skins-list");
      const $priceToggle = $("#Price-Toggle");
      const $rarityToggle = $("#Rarity-Toggle");
      const $qualityFilter = $("#Quality-Filter");
      const $priceFilter = $("#Price-Filter");

      $(".navigation-weapon-type").on("click", function () {
        const classList = ($(this).attr("class") || "").split(/\s+/);
        const weaponType = classList.find(
          (cls) =>
            cls &&
            cls !== "navigation-weapon-type" &&
            cls !== "enabled" &&
            cls !== "notexist" &&
            cls !== "solo-category"
        );

        if (!weaponType) return;

        $(`.skin.${weaponType}`).toggleClass("disabled");
        $(this).toggleClass("enabled");
        enabledFiltersState[weaponType] = $(this).hasClass("enabled");
        updateNavigationReset();

        $(".box-skins-list").each(function () {
          if (typeof syncStaticTopicItemsWithNavigation === "function") {
            syncStaticTopicItemsWithNavigation(this);
          }
        });
      });

      function getSkinsToggleState() {
        return getLocalStorageState("SkinsToggleState", { showprice: true, showrarity: true });
      }

      function setSkinsToggleState(newState) {
        setLocalStorageState("SkinsToggleState", newState);
      }

      const toggleState = getSkinsToggleState();

      $skinBox.toggleClass("showprice", toggleState.showprice);
      $skinBox.toggleClass("showrarity", toggleState.showrarity);

      $priceToggle.toggleClass("enabled", toggleState.showprice);
      $rarityToggle.toggleClass("enabled", toggleState.showrarity);

      $priceToggle.on("click", function () {
        toggleState.showprice = !toggleState.showprice;
        setSkinsToggleState(toggleState);

        $skinBox.toggleClass("showprice", toggleState.showprice);
        $(this).toggleClass("enabled", toggleState.showprice);
      });

      $rarityToggle.on("click", function () {
        toggleState.showrarity = !toggleState.showrarity;
        setSkinsToggleState(toggleState);

        $skinBox.toggleClass("showrarity", toggleState.showrarity);
        $(this).toggleClass("enabled", toggleState.showrarity);
      });

      function toggleSortFilter($current, $other, sortCallback) {
        const isEnabled = $current.hasClass("enabled");
        const isReversed = $current.hasClass("reversed");

        $other.removeClass("enabled reversed");

        if (!isEnabled && !isReversed) {
          $current.addClass("enabled").removeClass("reversed");
        } else if (isEnabled && !isReversed) {
          $current.addClass("reversed");
        } else {
          $current.removeClass("enabled reversed");
        }

        const sortState =
          $current.hasClass("enabled") && !$current.hasClass("reversed")
            ? "desc"
            : $current.hasClass("enabled") && $current.hasClass("reversed")
              ? "asc"
              : "original";

        sortCallback(sortState);
        updateNavigationReset();
      }

      function ensureTopicOriginalOrder($list) {
        $list.children(".skin").each(function (index) {
          if (!this.hasAttribute("data-sort-origin")) {
            this.setAttribute("data-sort-origin", String(index));
          }
        });
      }

      function getTopicItemPriceValue($skin) {
        const attrValue = Number($skin.attr("data-price-value"));
        if (Number.isFinite(attrValue)) return attrValue;

        const $price = $skin.find(".skin-price-info").first();
        if (!$price.length) return null;

        const text = ($price.text() || "").replace(",", ".").trim();
        const match = text.match(/\d+(?:\.\d+)?/);

        if (!match) return null;

        const value = Number(match[0]);
        return Number.isFinite(value) ? value : null;
      }

      function sortTopicItemsByPrice(sortState) {
        const $list = $(".box-skins-list");
        if (!$list.length) return;

        ensureTopicOriginalOrder($list);

        const skins = $list.children(".skin").not(".expander").get();
        if (!skins.length) return;

        if (sortState === "original") {
          skins.sort((a, b) => {
            const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
            const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
            return aIndex - bIndex;
          });
        } else {
          skins.sort((a, b) => {
            const priceA = getTopicItemPriceValue($(a));
            const priceB = getTopicItemPriceValue($(b));

            const aMissing = priceA === null;
            const bMissing = priceB === null;

            if (aMissing && bMissing) {
              const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
              const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
              return aIndex - bIndex;
            }

            if (aMissing) return 1;
            if (bMissing) return -1;

            if (sortState === "asc") {
              if (priceA !== priceB) return priceA - priceB;
            } else {
              if (priceA !== priceB) return priceB - priceA;
            }

            const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
            const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
            return aIndex - bIndex;
          });
        }

        $list.append(skins);
        $list.each(function () {
          window.keepStaticTopicExpanderLast?.(this);
        });
      }

      function sortTopicItemsByQuality(sortState) {
        const $list = $(".box-skins-list");
        if (!$list.length) return;

        ensureTopicOriginalOrder($list);

        const skins = $list.children(".skin").not(".expander").get();
        const sortOrder = ["white", "lblue", "blue", "purple", "pink", "red", "gold"];

        if (sortState === "original") {
          skins.sort((a, b) => {
            const aIndex = Number(a.getAttribute("data-sort-origin")) || 0;
            const bIndex = Number(b.getAttribute("data-sort-origin")) || 0;
            return aIndex - bIndex;
          });
        } else {
          skins.sort((a, b) => {
            const aClass = getSkinQualityClass(a);
            const bClass = getSkinQualityClass(b);

            const aIndex = sortOrder.indexOf(aClass);
            const bIndex = sortOrder.indexOf(bClass);

            const safeA = aIndex === -1 ? -1 : aIndex;
            const safeB = bIndex === -1 ? -1 : bIndex;

            const diff = safeA - safeB;
            if (diff !== 0) {
              return sortState === "asc" ? diff : -diff;
            }

            const originA = Number(a.getAttribute("data-sort-origin")) || 0;
            const originB = Number(b.getAttribute("data-sort-origin")) || 0;
            return originA - originB;
          });
        }

        $list.append(skins);
        $list.each(function () {
          window.keepStaticTopicExpanderLast?.(this);
        });
      }

      function applyDefaultTopicPriceFilterIfNeeded() {
        if (!/\/topic\/players\/inventories\//i.test(window.location.pathname)) return;

        $qualityFilter.removeClass("enabled reversed");
        $priceFilter.addClass("enabled").removeClass("reversed");

        sortTopicItemsByPrice("desc");
        updateNavigationReset();
      }

      $qualityFilter.off("click").on("click", function () {
        toggleSortFilter($(this), $priceFilter, (sortState) => {
          sortTopicItemsByQuality(sortState);
        });
      });

      $priceFilter.off("click").on("click", function () {
        toggleSortFilter($(this), $qualityFilter, (sortState) => {
          sortTopicItemsByPrice(sortState === "none" ? "original" : sortState);
        });
      });

      $(".topic-centralizer").off("click", ".navigation-reset").on("click", ".navigation-reset", function () {
        $(".skin").removeClass("disabled");
        $(".navigation-weapon-type").not(".notexist").addClass("enabled");
        $(".navigation-weapon-type.notexist").removeClass("enabled");

        $qualityFilter.removeClass("enabled reversed");
        $priceFilter.removeClass("enabled reversed");
        $(".topic-centralizer .navigation-reset").remove();

        enabledFiltersState = {};

        applyDefaultTopicPriceFilterIfNeeded();

        $(".box-skins-list").each(function () {
          syncStaticTopicItemsWithNavigation(this);
        });
      });

      applyDefaultTopicPriceFilterIfNeeded();

      function getSkinQualityClass(el) {
        const order = ["white", "lblue", "blue", "purple", "pink", "red", "gold"];
        const classList = (el.className || "").split(/\s+/);
        return order.find((cls) => classList.includes(cls)) || "";
      }
    }

    // !!! УДАЛЕНО: авто-импорт .box-skins-list (autoImportFullJsonIfNeeded)

  }
});

// ------------------- topics-nav и пр. (без изменений функционала) -------------------

(function initTopicNavClickOnly() {
  if (document.__topicNavBound) return;
  document.__topicNavBound = true;

  const mq = window.matchMedia("(max-width: 1364px)");

  document.addEventListener("click", (e) => {
    if (!mq.matches) return;

    const currentBtn = e.target.closest(".weapon-current");
    if (currentBtn) {
      const container = currentBtn.closest(".weapon-container");
      if (!container) return;

      const isActive = container.classList.contains("active");
      document.querySelectorAll(".weapon-container.active").forEach((c) => c.classList.remove("active"));

      if (!isActive) container.classList.add("active");
      return;
    }

    if (e.target.closest(".topic-nav-close")) {
      document.querySelector(".topic-nav-selector")?.classList.remove("active");
      document.querySelectorAll(".weapon-container.active").forEach((c) => c.classList.remove("active"));
      document.querySelector(".topic-nav-box")?.classList.remove("active");
      document.querySelector(".pages")?.classList.remove("hardhidden");
      return;
    }

    const navBox = e.target.closest(".topic-nav-box");
    if (navBox) {
      const navSelector = document.querySelector(".topic-nav-selector");
      const nowActive = !navBox.classList.contains("active");

      navBox.classList.toggle("active", nowActive);
      navSelector?.classList.toggle("active", nowActive);
      document.querySelector(".pages")?.classList.toggle("hardhidden", nowActive);

      if (!nowActive) {
        document.querySelectorAll(".weapon-container.active").forEach((c) => c.classList.remove("active"));
      }
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1365) {
      document.querySelector(".topic-nav-selector")?.classList.remove("active");
      document.querySelector(".topic-nav-box")?.classList.remove("active");
      document.querySelector(".pages")?.classList.remove("hardhidden");
      document.querySelectorAll(".weapon-container.active").forEach((c) => c.classList.remove("active"));
    }
  });
})();

// ---------- Разное визуальное для /topic ----------
if (window.location.pathname.includes("/topic")) {
  document.addEventListener("DOMContentLoaded", function () {
  
    const boxSkinsElements = document.querySelectorAll('.box-skins');

    boxSkinsElements.forEach(function(boxSkinsElement) {
      const boxSkinsList = boxSkinsElement.querySelector('.box-skins-list');

      if (boxSkinsList && boxSkinsList.scrollWidth > boxSkinsList.clientWidth) {
        let boxSkinsControl = boxSkinsElement.querySelector('.box-skins-control');

        if (!boxSkinsControl) {
          boxSkinsControl = document.createElement('div');
          boxSkinsControl.className = 'box-skins-control';
          boxSkinsControl.innerHTML = `
            <div class="box-skins-button left hidden"><i class="officon chevron left"></i></div>
            <div class="box-skins-button right hidden"><i class="officon chevron right"></i></div>
          `;
          boxSkinsElement.appendChild(boxSkinsControl);
        }

        const leftButton = boxSkinsControl.querySelector('.box-skins-button.left');
        const rightButton = boxSkinsControl.querySelector('.box-skins-button.right');

        function getSkinWidth() {
          const skin = boxSkinsList.querySelector('.skin');
          return skin ? (skin.offsetWidth + 10) : 0;
        }

        function updateBoxSkinsButtons() {
          const skinWidth = getSkinWidth();
          if (!skinWidth) {
            leftButton.classList.add('hidden');
            rightButton.classList.add('hidden');
            return;
          }

          leftButton.classList.toggle('hidden', boxSkinsList.scrollLeft <= skinWidth);
          rightButton.classList.toggle(
            'hidden',
            boxSkinsList.scrollLeft + boxSkinsList.clientWidth >= boxSkinsList.scrollWidth
          );
        }

        leftButton.addEventListener('click', function () {
          const skinWidth = getSkinWidth();
          boxSkinsList.scrollBy({
            left: -skinWidth,
            behavior: 'smooth'
          });
        });

        rightButton.addEventListener('click', function () {
          const skinWidth = getSkinWidth();
          boxSkinsList.scrollBy({
            left: skinWidth,
            behavior: 'smooth'
          });
        });

        boxSkinsList.addEventListener('scroll', updateBoxSkinsButtons);
        window.addEventListener('resize', updateBoxSkinsButtons);
        updateBoxSkinsButtons();
      }
    });

    function enableMouseDragScroll(container) {
      if (!container) return;

      let isDown = false;
      let startX;
      let scrollLeft;

      container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      });

      container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
      });

      container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
      });

      container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = x - startX;
        container.scrollLeft = scrollLeft - walk;
      });
    }

    boxSkinsElements.forEach(function(boxSkinsElement) {
      const boxSkinsList = boxSkinsElement.querySelector('.box-skins-list');
      enableMouseDragScroll(boxSkinsList);
    });

    const boxSkinsNav = document.querySelector('.box-skins-nav');
    const navList = document.querySelector('.box-skins-nav-list');
    let scrollOffset = 115;

    function scrollToBoxSkins(weaponName) {
      const boxSkins = document.querySelectorAll('.box-skins');

      boxSkins.forEach(function(box) {
        if (box.classList.contains('notexist')) return;

        const skinNameSpan = box.querySelector('.box-skins-name span');
        if (!skinNameSpan) return;

        if (skinNameSpan.textContent.trim() === weaponName) {
          const boxPosition = box.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: boxPosition - scrollOffset,
            behavior: 'smooth'
          });
        }
      });
    }

    // ---------- Hover preview для .box-skins.character ----------
    (function initCharacterSkinPreview() {
      const isTopicPage = window.location.pathname.includes("/topic");
      if (!isTopicPage) return;

      const $characterBox = $(".box-skins.character");
      if (!$characterBox.length) return;

      const previewState = {
        $preview: null,
        timerId: null,
        animTimerId: null,
        remaining: 5000,
        startedAt: 0,
        paused: false,
      };

      function getCharacterModel($skin) {
        let $model = $skin.closest(".character-box").find(".character-model").first();
        if ($model.length) return $model;

        $model = $skin.closest(".item-topic-grandbox, .topic-grandbox").find(".character-model").first();
        if ($model.length) return $model;

        $model = $(".character-model").first();
        return $model;
      }

      function clearRemoveTimer() {
        if (previewState.timerId) {
          clearTimeout(previewState.timerId);
          previewState.timerId = null;
        }
      }

      function clearAnimTimer() {
        if (previewState.animTimerId) {
          clearTimeout(previewState.animTimerId);
          previewState.animTimerId = null;
        }
      }

      function removePreview() {
        clearRemoveTimer();
        clearAnimTimer();

        if (previewState.$preview && previewState.$preview.length) {
          previewState.$preview.remove();
        }

        previewState.$preview = null;
        previewState.remaining = 5000;
        previewState.startedAt = 0;
        previewState.paused = false;
      }

      function startRemoveTimer(duration) {
        clearRemoveTimer();

        previewState.remaining = duration;
        previewState.startedAt = Date.now();
        previewState.paused = false;

        previewState.timerId = setTimeout(() => {
          removePreview();
        }, duration);
      }

      function pauseRemoveTimer() {
        if (!previewState.$preview || previewState.paused) return;

        clearRemoveTimer();

        const elapsed = Date.now() - previewState.startedAt;
        previewState.remaining = Math.max(0, previewState.remaining - elapsed);
        previewState.paused = true;
      }

      function resumeRemoveTimer() {
        if (!previewState.$preview || !previewState.paused) return;
        startRemoveTimer(previewState.remaining || 1);
      }

      function triggerAnimClass($el) {
        if (!$el || !$el.length) return;

        clearAnimTimer();
        $el.removeClass("anim-trigger");
        void $el[0].offsetWidth;
        $el.addClass("anim-trigger");

        previewState.animTimerId = setTimeout(() => {
          if ($el && $el.length) {
            $el.removeClass("anim-trigger");
          }
        }, 2000);
      }

      function showPreviewFromSkin(skinEl) {
        const $skin = $(skinEl);
        if (!$skin.length) return;
        if ($skin.hasClass("preview-item")) return;

        const $characterModel = getCharacterModel($skin);
        if (!$characterModel.length) return;

        const $clone = $skin.clone(false, false);
        $clone
          .removeClass("anim-trigger")
          .addClass("preview-item");

        if (previewState.$preview && previewState.$preview.length) {
          previewState.$preview.replaceWith($clone);
        } else {
          $characterModel.append($clone);
        }

        previewState.$preview = $clone;

        triggerAnimClass($clone);
        startRemoveTimer(5000);
      }

      $(document).on(
        "mouseenter",
        ".box-skins.character .skin:not(.preview-item):not(.extra-list):not(.none):not(.disabled)",
        function () {
          showPreviewFromSkin(this);
        }
      );

      $(document).on("mouseenter", ".character-model .preview-item", function () {
        if (previewState.$preview && previewState.$preview.is(this)) {
          pauseRemoveTimer();
        }
      });

      $(document).on("mouseleave", ".character-model .preview-item", function () {
        if (previewState.$preview && previewState.$preview.is(this)) {
          resumeRemoveTimer();
        }
      });
    })();

    if (navList) {
      enableMouseDragScroll(navList);

      const navItems = navList.querySelectorAll('.navigation-weapon-name');
      navItems.forEach(function(navItem) {
        navItem.addEventListener('click', function() {
          scrollToBoxSkins(navItem.textContent.trim());
        });
      });

      const navControl = boxSkinsNav?.querySelector('.box-skins-nav-control');
      const leftNavButton = navControl?.querySelector('.box-skins-button.left');
      const rightNavButton = navControl?.querySelector('.box-skins-button.right');
      const itemsToScroll = 5;

      function getNavItemWidth() {
        const first = navItems[0];
        return first ? (first.offsetWidth + 10) : 0;
      }

      function updateNavButtons() {
        if (!leftNavButton || !rightNavButton) return;

        const itemWidth = getNavItemWidth();
        if (!itemWidth) {
          leftNavButton.classList.add('hidden');
          rightNavButton.classList.add('hidden');
          return;
        }

        leftNavButton.classList.toggle('hidden', navList.scrollLeft <= itemWidth);
        rightNavButton.classList.toggle(
          'hidden',
          navList.scrollLeft + navList.clientWidth >= navList.scrollWidth
        );
      }

      if (leftNavButton && rightNavButton) {
        leftNavButton.addEventListener('click', function () {
          const itemWidth = getNavItemWidth();
          navList.scrollBy({
            left: -(itemWidth * itemsToScroll),
            behavior: 'smooth'
          });
        });

        rightNavButton.addEventListener('click', function () {
          const itemWidth = getNavItemWidth();
          navList.scrollBy({
            left: itemWidth * itemsToScroll,
            behavior: 'smooth'
          });
        });

        navList.addEventListener('scroll', updateNavButtons);
        window.addEventListener('resize', updateNavButtons);
        updateNavButtons();
      }
    }
  });
}

// ---------- misc хранилище ----------
function setLocalStorageState(key, value) {
  StorageHelper.setJSON(key, value);
}
function getLocalStorageState(key, defaultValue) {
  const storedValue = StorageHelper.getJSON(key);
  return storedValue != null ? storedValue : defaultValue;
}

// ---------- Импорт "похожих крафтов" (без .skin внутри) ----------
if (window.location.pathname.includes('/sticker-crafts/')) {
  async function importStickerCrafts() {
    try {
      const response = await fetch("/code-parts/topics/sticker-crafts.json");
      if (!response.ok) return;

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return;

      const currentPageSpan = document.querySelector('.siteblock .item-topic-grandbox .section.first span')
        || document.querySelector('.siteblock .topic-grandbox .section.first span');
      const currentPageText = currentPageSpan ? currentPageSpan.textContent.trim() : '';

      const filteredTopics = data.filter(sticker => sticker.title.trim() !== currentPageText);
      if (filteredTopics.length === 0) return;

      const randomTopics = filteredTopics.sort(() => 0.5 - Math.random()).slice(0, 5);

      const skinInspectPlaceholder = document.querySelector('.skininspect-placeholder');
      const craftingTable = document.querySelector('.crafting-table');
      if (!craftingTable) return;

      const stickerCraftsList = document.createElement('div');
      stickerCraftsList.classList.add('sticker-crafts-list');

      randomTopics.forEach(sticker => {
        const topic = document.createElement("a");
        topic.classList.add("topic-grandbox", "sticker");
        topic.href = `/topic/sticker-crafts/${sticker.id}`;

        const extraClass = sticker.extra ? ` ${sticker.extra}` : "";

        topic.innerHTML = `
            <div class="topic-box">
                <div class="best ${sticker.range}"></div>
                <div class="logobg${extraClass}">
                    <img src="${sticker.img}" alt="${sticker.title}" draggable="false">
                </div>
            </div>
            <div class="section first">
                <span>${sticker.title}</span>
            </div>
        `;
        stickerCraftsList.appendChild(topic);
      });

      if (skinInspectPlaceholder) {
        skinInspectPlaceholder.insertAdjacentElement('afterend', stickerCraftsList);
      } else {
        craftingTable.insertAdjacentElement('afterend', stickerCraftsList);
      }

      if (languageTag === "ru") {
        updateURLs(stickerCraftsList);
      }
    } catch (error) {}
  }
  importStickerCrafts();
}

// ---------- Страницы /topic/skins/ (часть с color-list и category-switch оставляем; loadout генерацию УДАЛИЛ) ----------
if (window.location.pathname.includes('/topic/skins/')) {
  document.addEventListener('DOMContentLoaded', () => {
    const colorsBox = document.querySelector('.colors-box-selection');
    const grandBox = document.querySelector('.item-topic-grandbox') || document.querySelector('.topic-grandbox');

    if (colorsBox) {
      const existingColorList = colorsBox.querySelector('#color-list');
      if (existingColorList) {
        existingColorList.remove();
      }

      const pathAfterSkins = window.location.pathname.split('/topic/skins/')[1];
      let fileName = 'skins-color-list.html';

      if (pathAfterSkins.startsWith('cheapest')) {
        fileName = 'cheap-skins-color-list.html';
      } else if (pathAfterSkins.startsWith('best')) {
        fileName = 'expensive-skins-color-list.html';
      }

      const importUrl = `/code-parts/topics/topic-color-lists/${fileName}`;
      fetch(importUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to load ${fileName}`);
          return response.text();
        })
        .then(htmlContent => {
          const container = document.createElement('div');
          container.innerHTML = htmlContent;
          const importedContent = container.querySelector('#color-list');

          if (importedContent) {
            colorsBox.appendChild(importedContent);
          }

          document.querySelectorAll(".color-box-selection-button").forEach((box) => {
            box.addEventListener("click", () => {
              box.classList.toggle("clicked");
              importedContent.classList.toggle("active");
            });
          });
          updateURLs(colorsBox);
        })
        .catch(console.error);
    }

    const topicBox = document.querySelector('.topic-box');
    if (topicBox) {
      const logoBg = topicBox.querySelector('.logobg');
      const dataColor = logoBg ? logoBg.getAttribute('data-color') : null;

      if (dataColor) {
        const categorySwitchContainer = document.querySelector('.skins-category-switch');
        if (categorySwitchContainer) {
          categorySwitchContainer.querySelectorAll('div.category-switch').forEach((el, i) => {
            const hrefBase = i === 0 ? `/topic/skins/cheapest-${dataColor}-skins` : `/topic/skins/best-${dataColor}-skins`;
            const a = document.createElement('a');
            a.textContent = el.textContent;
            a.href = hrefBase;
            a.className = el.className;
            a.addEventListener('click', (e) => {
              categorySwitchContainer.querySelectorAll('a').forEach(el => el.classList.remove('clicked'));
              a.classList.add('clicked');
            });
            el.replaceWith(a);
          });
        }

        const overviewButton = document.querySelector('.color-box-overview-button');
        if (overviewButton) {
          overviewButton.href = `/topic/skins/${dataColor}-skins`;
        }

        updateURLs(grandBox);
      }
    }

    // *** Удалено: динамическая сборка loadout (character-box) и наполнение .skin ***
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  const res = $(window).width();
  const path = window.location.pathname;

  const paginationRules = [
    {
      match: (path) => /\/inventories(?:\.html)?\/?$/.test(path),
      mobile: 8,
      desktop: 20,
    },
  ];

  const matchedRule = paginationRules.find((rule) => rule.match(path));

  const itemsPerPage = matchedRule
    ? (res < 1365 ? matchedRule.mobile : matchedRule.desktop)
    : (res < 1365 ? 6 : 12);

  const topicBoxesHolder = document.querySelector(".topic-boxes-holder");
  if (!topicBoxesHolder) return;

  const isStickerCraftsSkinPage = /\/sticker-crafts\/skin\//.test(path);
  const isStickerCraftsListPage = /\/topic\/sticker-crafts(?:\.html)?$/.test(path);
  const isStickerCraftsPage = isStickerCraftsSkinPage || isStickerCraftsListPage;

  const isSticker = isStickerCraftsPage;
  const itemSelector = isSticker ? ".topic-grandbox.sticker" : ".topic-box";

  let currentSearch = getSearchFromURL();

  setupPagination();

  function getURLParams() {
    return new URLSearchParams(window.location.search);
  }

  function getPageFromURL(totalPages = Infinity) {
    const params = getURLParams();
    const page = parseInt(params.get("page"), 10);

    if (Number.isNaN(page) || page < 1) {
      return 1;
    }

    return Math.min(page, totalPages);
  }

  function getSearchFromURL() {
    return getURLParams().get("search") || "";
  }

  function updateURL({ page = 1, search = currentSearch, replace = false } = {}) {
    const url = new URL(window.location.href);

    if (page > 1) {
      url.searchParams.set("page", page);
    } else {
      url.searchParams.delete("page");
    }

    if (search && search.trim() !== "") {
      url.searchParams.set("search", search.trim());
    } else {
      url.searchParams.delete("search");
    }

    if (replace) {
      window.history.replaceState({ page, search }, "", url);
    } else {
      window.history.pushState({ page, search }, "", url);
    }
  }

  function getFuseData(boxes) {
    return boxes.map((box, idx) => {
      if (isSticker) {
        const spans = Array.from(box.querySelectorAll(".section.first span"));
        const spanTexts = spans.map((s) => s.textContent.trim()).filter(Boolean);
        const skinElements = Array.from(box.querySelectorAll(".section.third .skin"));
        const skinIds = skinElements.map((el) => el.getAttribute("skin-id") || "").filter(Boolean);

        return { idx, spanTexts, skinIds };
      }

      const mainText = box.querySelector("span")?.textContent.trim() || "";
      const playerNickname = box.querySelector(".player-nickname")?.textContent.trim() || "";
      const playerTeam = box.querySelector(".player-team")?.textContent.trim() || "";

      return {
        idx,
        text: [mainText, playerNickname, playerTeam].filter(Boolean).join(" "),
      };
    });
  }

  function getFilteredBoxes(allBoxes, searchValue) {
    const value = searchValue.trim().toLowerCase();

    if (!value) {
      return allBoxes;
    }

    const fuseData = getFuseData(allBoxes);
    let matchedIdx = new Set();

    if (typeof Fuse !== "undefined") {
      const fuse = new Fuse(fuseData, {
        keys: isSticker ? ["spanTexts", "skinIds"] : ["text"],
        threshold: 0.3,
        minMatchCharLength: 1,
      });

      const results = fuse.search(value);
      matchedIdx = new Set(results.map((r) => r.item.idx));
    } else {
      fuseData.forEach((item) => {
        const hay = isSticker
          ? item.spanTexts.join(" ") + " " + item.skinIds.join(" ")
          : item.text;

        if ((hay || "").toLowerCase().includes(value)) {
          matchedIdx.add(item.idx);
        }
      });
    }

    return allBoxes.filter((_, idx) => matchedIdx.has(idx));
  }

  function setupPagination(options = {}) {
    const replaceURL = options.replaceURL || false;
    const updateURLState = options.updateURL !== false;

    const existingPagination = topicBoxesHolder.querySelector(".pagination-holder");
    if (existingPagination) {
      existingPagination.remove();
    }

    const allBoxes = Array.from(topicBoxesHolder.querySelectorAll(itemSelector));
    if (!allBoxes.length) return 1;

    const filteredBoxes = getFilteredBoxes(allBoxes, currentSearch);

    // Отключаем пагинацию для holder с классом no-pagination
    if (topicBoxesHolder.classList.contains("no-pagination")) {
      topicBoxesHolder.classList.remove("pagination");

      allBoxes.forEach((box) => {
        box.style.display = "none";
        box.classList.remove("hidden", "fade-in", "visible", "visible_sort");
      });

      filteredBoxes.forEach((box, index) => {
        box.style.display = "";
        box.style.animationDelay = `${((index % itemsPerPage) + 1) * 0.025}s`;
        box.classList.add(currentSearch ? "visible_sort" : "visible");
      });

      if (updateURLState) {
        updateURL({
          page: 1,
          search: currentSearch,
          replace: replaceURL,
        });
      }

      return 1;
    }

    const totalPages = Math.ceil(filteredBoxes.length / itemsPerPage);

    allBoxes.forEach((box) => {
      box.style.display = "none";
      box.classList.remove("hidden", "fade-in", "visible", "visible_sort");
    });

    if (currentSearch) {
      topicBoxesHolder.classList.remove("pagination");
    } else {
      topicBoxesHolder.classList.add("pagination");
    }

    if (totalPages <= 1) {
      filteredBoxes.forEach((box, index) => {
        box.style.display = "";
        box.style.animationDelay = `${((index % itemsPerPage) + 1) * 0.025}s`;
        box.classList.add(currentSearch ? "visible_sort" : "visible");
      });

      if (updateURLState) {
        updateURL({
          page: 1,
          search: currentSearch,
          replace: replaceURL,
        });
      }

      return 1;
    }

    topicBoxesHolder.classList.add("pagination");

    const paginationHolder = document.createElement("div");
    paginationHolder.classList.add("pagination-holder");
    topicBoxesHolder.appendChild(paginationHolder);

    function showPage(page, showOptions = {}) {
      const pageReplaceURL = showOptions.replaceURL || false;
      const pageUpdateURL = showOptions.updateURL !== false;

      page = Math.max(1, Math.min(page, totalPages));

      const start = (page - 1) * itemsPerPage;
      const end = page * itemsPerPage;

      allBoxes.forEach((box) => {
        box.style.display = "none";
        box.classList.add("hidden");
        box.classList.remove("fade-in", "visible", "visible_sort");
      });

      filteredBoxes.forEach((box, index) => {
        if (index >= start && index < end) {
          const delay = ((index % itemsPerPage) + 1) * 0.025;

          box.style.animationDelay = `${delay}s`;
          box.style.display = "";
          box.classList.remove("hidden");

          if (currentSearch) {
            box.classList.add("visible_sort");
          } else {
            box.classList.add("fade-in");
            box.addEventListener(
              "animationend",
              () => {
                box.classList.remove("fade-in");
                box.classList.add("visible");
              },
              { once: true }
            );
          }
        }
      });

      updatePaginationButtons(page);

      if (pageUpdateURL) {
        updateURL({
          page,
          search: currentSearch,
          replace: pageReplaceURL,
        });
      }

      return page;
    }

    function updatePaginationButtons(activePage) {
      paginationHolder.innerHTML = "";

      const showForceButtons = totalPages > 3;

      if (showForceButtons) {
        const firstButton = document.createElement("button");
        firstButton.classList.add("pagination-button", "arrow", "force");
        firstButton.innerHTML = `<i class="officon chevron double left"></i>`;

        if (activePage === 1) {
          firstButton.classList.add("disabled");
        } else {
          firstButton.addEventListener("click", () => showPage(1));
        }

        paginationHolder.appendChild(firstButton);
      }

      const prevButton = document.createElement("button");
      prevButton.classList.add("pagination-button", "arrow");
      prevButton.innerHTML = `<i class="officon chevron left"></i>`;

      if (activePage === 1) {
        prevButton.classList.add("disabled");
      } else {
        prevButton.addEventListener("click", () => showPage(activePage - 1));
      }

      paginationHolder.appendChild(prevButton);

      let startPage = Math.max(1, activePage - 1);
      let endPage = Math.min(totalPages, startPage + 2);

      if (endPage - startPage < 2 && startPage > 1) {
        startPage = Math.max(1, endPage - 2);
      }

      for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.add("pagination-button");

        if (i === activePage) {
          button.classList.add("active");
        } else {
          button.addEventListener("click", () => showPage(i));
        }

        paginationHolder.appendChild(button);
      }

      const nextButton = document.createElement("button");
      nextButton.classList.add("pagination-button", "arrow");
      nextButton.innerHTML = `<i class="officon chevron right"></i>`;

      if (activePage === totalPages) {
        nextButton.classList.add("disabled");
      } else {
        nextButton.addEventListener("click", () => showPage(activePage + 1));
      }

      paginationHolder.appendChild(nextButton);

      if (showForceButtons) {
        const lastButton = document.createElement("button");
        lastButton.classList.add("pagination-button", "arrow", "force");
        lastButton.innerHTML = `<i class="officon chevron double right"></i>`;

        if (activePage === totalPages) {
          lastButton.classList.add("disabled");
        } else {
          lastButton.addEventListener("click", () => showPage(totalPages));
        }

        paginationHolder.appendChild(lastButton);
      }
    }

    const startPage = getPageFromURL(totalPages);
    const activePage = showPage(startPage, {
      replaceURL,
      updateURL: updateURLState,
    });

    if (languageTag === "ru") {
      updateURLs(topicBoxesHolder);
    }

    return activePage;
  }

  // ================================
  // topic-filter: ввод и фильтрация
  // ================================
  (function () {
    const scopedHolder =
      document.querySelector(".topic-boxes-holder.items-type, .topic-boxes-holder.sticker-crafts") ||
      (["skins", "items", "sticker-crafts", "inventories"].includes(location.pathname.split("/").pop().replace(".html", "")) &&
        document.querySelector(".topic-boxes-holder"));

    if (!scopedHolder) return;

    const filterInput = scopedHolder.querySelector(".topic-filter .topic-filter-tab");
    if (!filterInput) return;

    filterInput.value = currentSearch;

    filterInput.addEventListener("input", () => {
      currentSearch = filterInput.value.trim().toLowerCase();

      const activePage = setupPagination({
        replaceURL: false,
        updateURL: false,
      });

      updateURL({
        page: activePage,
        search: currentSearch,
        replace: false,
      });
    });

    window.addEventListener("popstate", () => {
      currentSearch = getSearchFromURL();
      filterInput.value = currentSearch;

      setupPagination({
        updateURL: false,
      });
    });
  })();
});


// Последние правки ссылок под RU
const topicBoxesHolder = document.querySelector(".topic-boxes-holder");
const backbutton = document.querySelector(".singlemod-box:has(.back-button)");
if (languageTag === "ru") {
  updateURLs(topicBoxesHolder);
  updateURLs(backbutton);
}

document.addEventListener('DOMContentLoaded', async () => {
  let mapGrenadesData = [];

  try {
    const response = await fetch('/code-parts/topics/grenades-guides/mirage-smokes.json');

    if (!response.ok) {
      throw new Error(`JSON loading error: ${response.status}`);
    }

    mapGrenadesData = await response.json();
  } catch (error) {
    console.error('Failed to load grenades JSON:', error);
    return;
  }

  const grenadesById = new Map(
    mapGrenadesData.map((grenade) => [grenade['grenade-id'], grenade])
  );

  document.querySelectorAll('.topicpage').forEach((topicPage) => {
    const mapRadar = topicPage.querySelector('.map-radar');
    const guide = topicPage.querySelector('.map-radar-guide');

    if (!mapRadar || !guide) return;

    const linkedSelector = [
      '.radar-smoke-icon[grenade-id]',
      '.map-grenade-unit[grenade-id]',
      '.radar-grenades-pos-list[grenade-id]'
    ].join(', ');

    const grenadeClickableSelector = [
      '.radar-smoke-icon[grenade-id]',
      '.map-grenade-unit[grenade-id]'
    ].join(', ');

    const posClickableSelector = [
      '.radar-pos-spot[pos-id]',
      '.map-pos-spot[pos-id]'
    ].join(', ');

    function getGrenadeId(element) {
      const grenadeParent = element.closest('[grenade-id]');
      return grenadeParent ? grenadeParent.getAttribute('grenade-id') : null;
    }

    function getLinkedGrenadeElements(grenadeId) {
      return [...topicPage.querySelectorAll(linkedSelector)].filter(
        (element) => element.getAttribute('grenade-id') === grenadeId
      );
    }

    function getLinkedGrenadeHoverElements(grenadeId) {
      return getLinkedGrenadeElements(grenadeId).filter((element) =>
        element.classList.contains('radar-smoke-icon') ||
        element.classList.contains('map-grenade-unit')
      );
    }

    function getLinkedPosElements(grenadeId, posId) {
      return [...topicPage.querySelectorAll(posClickableSelector)].filter((element) => {
        const elementGrenadeId = getGrenadeId(element);

        return (
          elementGrenadeId === grenadeId &&
          element.getAttribute('pos-id') === posId
        );
      });
    }

    function showLinkedPosElements(posElement) {
      const grenadeId = getGrenadeId(posElement);
      const posId = posElement.getAttribute('pos-id');

      if (!grenadeId || !posId) return;

      getLinkedPosElements(grenadeId, posId).forEach((element) => {
        element.classList.add('show');
      });
    }

    function hideLinkedPosElements(posElement) {
      const grenadeId = getGrenadeId(posElement);
      const posId = posElement.getAttribute('pos-id');

      if (!grenadeId || !posId) return;

      getLinkedPosElements(grenadeId, posId).forEach((element) => {
        element.classList.remove('show');
      });
    }

    function showLinkedGrenadeElements(grenadeElement) {
      const grenadeId = grenadeElement.getAttribute('grenade-id');

      if (!grenadeId) return;

      getLinkedGrenadeHoverElements(grenadeId).forEach((element) => {
        element.classList.add('show');
      });
    }

    function hideLinkedGrenadeElements(grenadeElement) {
      const grenadeId = grenadeElement.getAttribute('grenade-id');

      if (!grenadeId) return;

      getLinkedGrenadeHoverElements(grenadeId).forEach((element) => {
        element.classList.remove('show');
      });
    }

    function updateMapRadarState() {
      const hasActiveGrenade = [...topicPage.querySelectorAll(linkedSelector)]
        .some((element) => element.classList.contains('active'));

      const hasActiveGuide = guide.classList.contains('active');

      mapRadar.classList.toggle('selected', hasActiveGrenade || hasActiveGuide);
    }

    function clearActivePositions() {
      topicPage
        .querySelectorAll('.radar-pos-spot.active, .map-pos-spot.active')
        .forEach((element) => {
          element.classList.remove('active');
        });
    }

    function clearShownPositions() {
      topicPage
        .querySelectorAll('.radar-pos-spot.show, .map-pos-spot.show')
        .forEach((element) => {
          element.classList.remove('show');
        });
    }

    function addDisablingClass(element) {
      if (element.disablingTimer) {
        window.clearTimeout(element.disablingTimer);
      }

      element.classList.add('disabling');

      element.disablingTimer = window.setTimeout(() => {
        element.classList.remove('disabling');
        element.disablingTimer = null;
      }, 100);
    }

    function clearActiveGrenades() {
      topicPage
        .querySelectorAll(
          '.radar-smoke-icon.active, .map-grenade-unit.active, .radar-grenades-pos-list.active'
        )
        .forEach((element) => {
          element.classList.remove('active');

          if (
            element.classList.contains('radar-smoke-icon') ||
            element.classList.contains('map-grenade-unit')
          ) {
            addDisablingClass(element);
          }
        });
    }

    function clearGuideContent() {
      guide.className = 'map-radar-guide';
      guide.innerHTML = '';

      clearActivePositions();
      clearShownPositions();
    }

    function setActiveGrenade(grenadeId) {
      clearActiveGrenades();

      getLinkedGrenadeElements(grenadeId).forEach((element) => {
        element.classList.add('active');
      });
    }

    function closeGuide() {
      clearGuideContent();
      updateMapRadarState();
    }

    function getPositionData(grenadeId, posId) {
      const grenadeData = grenadesById.get(grenadeId);

      if (!grenadeData) return null;

      const positionData = grenadeData.positions.find(
        (position) => position['pos-id'] === posId
      );

      if (!positionData) return null;

      return {
        grenade: grenadeData,
        position: positionData
      };
    }

    function renderKeybinds(keybinds) {
      if (!keybinds) return '';

      return keybinds
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => `<span>${part}</span>`)
        .join(' + ');
    }

    function getLangValue(value, lang = 'ru') {
      if (!value) return '';

      if (typeof value === 'string') {
        return value;
      }

      return value[lang] || value.ru || value.en || '';
    }

    function getGuideExtraImages(guideData) {
      const extraImages = [];

      if (guideData.extraImg) {
        extraImages.push({
          src: guideData.extraImg,
          className: ''
        });
      }

      Object.keys(guideData)
        .filter((key) => /^extraImg-\d+$/.test(key))
        .sort((a, b) => {
          const numberA = Number(a.replace('extraImg-', ''));
          const numberB = Number(b.replace('extraImg-', ''));

          return numberA - numberB;
        })
        .forEach((key) => {
          const number = Number(key.replace('extraImg-', ''));

          if (!guideData[key]) return;

          extraImages.push({
            src: guideData[key],
            className: `extra-${number}`
          });
        });

      return extraImages;
    }

    function renderGuideExtraImages(guideData, title) {
      const extraImages = getGuideExtraImages(guideData);

      if (!extraImages.length) return '';

      return extraImages
        .map((image) => {
          const extraClass = image.className ? ` ${image.className}` : '';

          return `
            <div class="map-radar-extra${extraClass}">
              <img src="${image.src}" alt="${title}">
            </div>
          `;
        })
        .join('');
    }

    function renderGuideExtraDesc(extraDesc) {
      const text = getLangValue(extraDesc);

      if (!text) return '';

      return `
        <div class="map-radar-extra-desc">
          <span>${text}</span>
        </div>
      `;
    }

    function openGuide(grenadeId, posId) {
      const data = getPositionData(grenadeId, posId);

      if (!data) {
        closeGuide();
        return;
      }

      const { grenade, position } = data;
      const guideData = position.guide || {};

      setActiveGrenade(grenadeId);

      const grenadeExtraClasses = Array.isArray(grenade.extra)
        ? grenade.extra
        : [];

      const positionExtraClasses = Array.isArray(position.extra)
        ? position.extra
        : [];

      const guideClasses = [
        'map-radar-guide',
        'active',
        ...grenadeExtraClasses,
        ...positionExtraClasses
      ];

      const title =
        getLangValue(guideData.title) ||
        getLangValue(position.name) ||
        getLangValue(grenade.name);

      const image = guideData.img || '';
      const keybinds = guideData.keybinds || '';
      const extraDesc = guideData.extraDesc || '';

      guide.className = guideClasses.join(' ');

      guide.innerHTML = `
        <div class="map-radar-guide-block">
          <div class="map-radar-guide-left">
            <div class="map-radar-guide-title">
              <span>${title}</span>
            </div>

            ${renderGuideExtraImages(guideData, title)}
          </div>

          <div class="map-radar-guide-right">
            ${renderGuideExtraDesc(extraDesc)}
          </div>
        </div>

        <div class="map-radar-guide-close">
          <i class="officon cross"></i>
        </div>

        <div class="map-radar-guide-screenshot">
          <div class="map-radar-guide-zoom">
            <img src="${image}" alt="${title}">
          </div>
          <img src="${image}" alt="${title}">
        </div>

        <div class="map-radar-guide-binds">
          ${renderKeybinds(keybinds)}
        </div>
      `;

      clearActivePositions();

      getLinkedPosElements(grenadeId, posId).forEach((element) => {
        element.classList.add('active');
      });

      updateMapRadarState();
    }

    function toggleGrenade(grenadeId) {
      const linkedElements = getLinkedGrenadeElements(grenadeId);

      const isCurrentlyActive = linkedElements.some((element) =>
        element.classList.contains('active')
      );

      clearActiveGrenades();
      clearGuideContent();

      if (!isCurrentlyActive) {
        linkedElements.forEach((element) => {
          element.classList.add('active');
        });
      }

      updateMapRadarState();
    }

    topicPage.addEventListener('pointerover', (event) => {
      const posElement = event.target.closest(posClickableSelector);

      if (posElement && topicPage.contains(posElement)) {
        showLinkedPosElements(posElement);
        return;
      }

      const grenadeElement = event.target.closest(grenadeClickableSelector);

      if (!grenadeElement || !topicPage.contains(grenadeElement)) return;

      showLinkedGrenadeElements(grenadeElement);
    });

    topicPage.addEventListener('pointerout', (event) => {
      const posElement = event.target.closest(posClickableSelector);

      if (posElement && topicPage.contains(posElement)) {
        if (event.relatedTarget && posElement.contains(event.relatedTarget)) {
          return;
        }

        hideLinkedPosElements(posElement);
        return;
      }

      const grenadeElement = event.target.closest(grenadeClickableSelector);

      if (!grenadeElement || !topicPage.contains(grenadeElement)) return;

      if (event.relatedTarget && grenadeElement.contains(event.relatedTarget)) {
        return;
      }

      hideLinkedGrenadeElements(grenadeElement);
    });

    topicPage.addEventListener('click', (event) => {
      const closeButton = event.target.closest('.map-radar-guide-close');

      if (closeButton && topicPage.contains(closeButton)) {
        closeGuide();
        return;
      }

      const posElement = event.target.closest(posClickableSelector);

      if (posElement && topicPage.contains(posElement)) {
        event.stopPropagation();

        const grenadeId = getGrenadeId(posElement);
        const posId = posElement.getAttribute('pos-id');

        if (!grenadeId || !posId) return;

        openGuide(grenadeId, posId);
        return;
      }

      const grenadeElement = event.target.closest(grenadeClickableSelector);

      if (!grenadeElement || !topicPage.contains(grenadeElement)) return;

      if (grenadeElement.classList.contains('map-grenade-unit')) {
        const nestedUl = event.target.closest('ul');

        if (nestedUl && grenadeElement.contains(nestedUl)) {
          return;
        }
      }

      const grenadeId = grenadeElement.getAttribute('grenade-id');

      if (!grenadeId) return;

      toggleGrenade(grenadeId);
    });

    updateMapRadarState();
  });
});

/* DRAGGABLE */

(() => {
    const DRAGGABLE_SELECTOR = '.radar-smoke-icon, .radar-pos-spot';
    const PRECISION = 2;

    let activeDrag = null;

    const coordinatesLabel = document.createElement('div');

    Object.assign(coordinatesLabel.style, {
        position: 'fixed',
        left: '10px',
        bottom: '10px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        font: '13px monospace',
        borderRadius: '5px',
        zIndex: '999999',
        pointerEvents: 'none',
        display: 'none'
    });

    document.body.appendChild(coordinatesLabel);

    function getPercentPosition(element, parent) {
        const inlineLeft = element.style.left;
        const inlineTop = element.style.top;

        const left = inlineLeft.includes('%')
            ? parseFloat(inlineLeft)
            : element.offsetLeft / parent.clientWidth * 100;

        const top = inlineTop.includes('%')
            ? parseFloat(inlineTop)
            : element.offsetTop / parent.clientHeight * 100;

        return {
            left: Number.isFinite(left) ? left : 0,
            top: Number.isFinite(top) ? top : 0
        };
    }

    function updateLabel(element, top, left) {
        const type = element.classList.contains('radar-pos-spot')
            ? 'radar-pos-spot'
            : 'radar-smoke-icon';

        coordinatesLabel.textContent =
            `${type} | top: ${top.toFixed(PRECISION)}%; left: ${left.toFixed(PRECISION)}%;`;

        coordinatesLabel.style.display = 'block';
    }

    document.addEventListener('pointerdown', event => {
        const element = event.target.closest(DRAGGABLE_SELECTOR);

        if (!element || event.button !== 0) {
            return;
        }

        /*
         * offsetParent — реальный родитель, относительно которого
         * работают position:absolute, top и left.
         *
         * Для radar-pos-spot это обычно radar-grenades-pos-list,
         * а для smoke — map-radar.
         */
        const parent = element.offsetParent;

        if (!parent) {
            console.warn('Для элемента не найден offsetParent:', element);
            return;
        }

        const parentRect = parent.getBoundingClientRect();
        const position = getPercentPosition(element, parent);

        activeDrag = {
            element,
            parent,
            parentRect,
            pointerId: event.pointerId,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startLeft: position.left,
            startTop: position.top
        };

        element.classList.add('dragging');
        element.setPointerCapture(event.pointerId);

        updateLabel(element, position.top, position.left);

        event.preventDefault();
    });

    document.addEventListener('pointermove', event => {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
            return;
        }

        const {
            element,
            parentRect,
            startMouseX,
            startMouseY,
            startLeft,
            startTop
        } = activeDrag;

        const deltaXPercent =
            (event.clientX - startMouseX) / parentRect.width * 100;

        const deltaYPercent =
            (event.clientY - startMouseY) / parentRect.height * 100;

        let left = startLeft + deltaXPercent;
        let top = startTop + deltaYPercent;

        left = Math.max(0, Math.min(100, left));
        top = Math.max(0, Math.min(100, top));

        element.style.left = `${left.toFixed(PRECISION)}%`;
        element.style.top = `${top.toFixed(PRECISION)}%`;

        updateLabel(element, top, left);

        event.preventDefault();
    });

    function stopDragging(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) {
            return;
        }

        const { element, pointerId } = activeDrag;

        element.classList.remove('dragging');

        if (element.hasPointerCapture(pointerId)) {
            element.releasePointerCapture(pointerId);
        }

        const type = element.classList.contains('radar-pos-spot')
            ? 'radar-pos-spot'
            : 'radar-smoke-icon';

        console.log(
            `${type}: top: ${element.style.top}; left: ${element.style.left};`
        );

        activeDrag = null;
        coordinatesLabel.style.display = 'none';
    }

    document.addEventListener('pointerup', stopDragging);
    document.addEventListener('pointercancel', stopDragging);

    /*
     * Вызови copyRadarPositions() в консоли,
     * чтобы скопировать координаты всех элементов.
     */
    window.copyRadarPositions = async function () {
        const elements = [
            ...document.querySelectorAll(DRAGGABLE_SELECTOR)
        ];

        const smokeElements = elements.filter(element =>
            element.classList.contains('radar-smoke-icon')
        );

        const spotElements = elements.filter(element =>
            element.classList.contains('radar-pos-spot')
        );

        const result = [];

        spotElements.forEach((element, index) => {
            result.push(
                `radar-pos-spot ${index + 1}: ` +
                `top: ${element.style.top}; left: ${element.style.left};`
            );
        });

        smokeElements.forEach((element, index) => {
            result.push(
                `radar-smoke-icon ${index + 1}: ` +
                `top: ${element.style.top}; left: ${element.style.left};`
            );
        });

        const text = result.join('\n');

        await navigator.clipboard.writeText(text);

        console.log(text);
        console.log('Координаты скопированы в буфер обмена');
    };
})();