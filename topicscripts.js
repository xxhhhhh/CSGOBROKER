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

$(document).ready(function () {
    const currentPath = window.location.pathname;
    if (
      currentPath.includes("/topic/items/") ||
      currentPath.includes("/topic/stickers/") ||
      currentPath.includes("/topic/cases/") ||
      currentPath.includes("/topic/collections/") ||
      currentPath.includes("/topic/skins/") ||
      currentPath.includes("/topic/guides/") ||
      currentPath.includes("/topic/sticker-crafts/") &&
      !currentPath.includes("/topic/sticker-crafts/skin/") ||
      currentPath.endsWith("sticker-crafts.html") ||
      currentPath.endsWith("sticker-crafts")
    ) {
      let enabledFiltersState = {};
      let sortState = "normal";

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
                      "Lis-Skins",
                      "Avan.Market",
                      "Tradeit",
                      "CSMoney",
                      "BitSkins",
                      "SkinSwap",
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
    
                const topicGrandbox = document.querySelector(".topic-grandbox");
                if (topicGrandbox) {
                    topicGrandbox.insertAdjacentElement("afterend", boxExtraLinks);
                }
            } catch {}
        }
    }
    
    addMoreCraftsLink();
    

      function insertRandomAdsBox() {
        if (href.endsWith("sticker-crafts") || href.endsWith("sticker-crafts.html")) {
          return;
        }
      
        let adsFilePath = currentPath.includes("/ru/")
          ? "/code-parts/topics/topic-ads-ru.html"
          : "/code-parts/topics/topic-ads.html";
      
        let adsCount = 2;
      
        fetch(adsFilePath)
          .then((response) => response.text())
          .then((adsBoxesHtml) => {
            const adsBoxes = document.createElement("div");
            adsBoxes.innerHTML = adsBoxesHtml;
      
            const insertAfterElement = document.querySelector(".topic-grandbox");
            
            for (let i = 0; i < adsCount; i++) {
              if (adsBoxes.children.length === 0) break;
              const randomIndex = Math.floor(Math.random() * adsBoxes.children.length);
              const randomAdsBox = adsBoxes.children[randomIndex];
              insertAfterElement.parentNode.insertBefore(
                randomAdsBox,
                insertAfterElement.nextSibling
              );
              setTimeout(() => randomAdsBox.classList.add("active"), 100);
            }
          });
      }
      

      insertRandomAdsBox();

      if ($(".skin").length) {
        const skinsOnPage = $(".skin");
        const weaponToSkinIds = {};
    
        skinsOnPage.each(function () {
            const weapon = $(this).attr("weapon");
            const skinId = $(this).attr("skin-id");
            if (weapon && skinId) {
                weaponToSkinIds[weapon] = weaponToSkinIds[weapon] || [];
                weaponToSkinIds[weapon].push(skinId);
            }
        });
    
        const loadSkinsData = async () => {
            try {
                const skinPrices = await fetchSkinPrices();
    
                await Promise.all(Object.keys(weaponToSkinIds).map(async (weapon) => {
                    try {
                        const response = await fetch(`/code-parts/topics/skins-list/${weapon}.json`);
                        if (!response.ok) throw new Error(`Не удалось загрузить ${weapon}.json`);
                        const skinsData = await response.json();
    
                        const skinsForWeapon = skinsData || {};
                        weaponToSkinIds[weapon].forEach((skinId) => {
                            const skinData = skinsForWeapon[skinId];
                            if (skinData) {
                                const isInNavigation = $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).closest('.navigation-section').length > 0;
                                const imageUrl = isInNavigation ? skinData.imageOG : skinData.image;
    
                                const matchedSkins = Array.isArray(skinPrices) ? skinPrices.filter(skin => skin.name.includes(skinData.name)) : [];
                                let priceInfo = "";
    
                                if (matchedSkins.length > 0) {
                                    const prices = matchedSkins.map(skin => skin.price).sort((a, b) => a - b);
                                    priceInfo = prices[0] === prices[prices.length - 1] 
                                        ? `${prices[0].toFixed(2)}$` 
                                        : `${prices[0].toFixed(2)}$ - ${prices[prices.length - 1].toFixed(2)}$`;
                                }
    
                                const newSkinHTML = `
                                    <div class="skin ${skinData.class}" skin-id="${skinId}" weapon="${weapon}">
                                        <img src="${imageUrl}" draggable="false" alt="${skinData.name}">
                                        <div class="skin-desc-name">${skinData.name}</div>
                                        ${priceInfo ? `<div class="skin-price-info">${priceInfo}</div>` : ""}
                                    </div>
                                `;
    
                                $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).each(function () {
                                    $(this).replaceWith(newSkinHTML);
                                });
                            }
                        });
                    } catch (error) {
                    }
                }));
    
                $(".skin img").each(function () {
                    if (this.complete) {
                        $(this).addClass("imported");
                    } else {
                        $(this).on("load", function () {
                            $(this).addClass("imported");
                        });
                    }
                });
    
                checkWeaponTypeAvailabilityForItems();
            } catch (error) {
            }
        };
    
        loadSkinsData();
    }
    
    

      function updateNavigationReset() {
        const enabledFilters = $(".navigation-weapon-type.enabled").length;
        const sortEnabled = $("#Quality-Filter").hasClass("enabled");
        const resetExists = $(".topic-centralizer .navigation-reset").length;

        if (enabledFilters === 0 && !sortEnabled && resetExists === 0) {
          $(".topic-centralizer").append(
            '<div class="navigation-reset">Reset Navigation</div>'
          );
        } else if (enabledFilters > 0 || sortEnabled) {
          $(".topic-centralizer .navigation-reset").remove();
        }
      }

      function checkWeaponTypeAvailability() {
        const weaponTypes = [
          "knives",
          "gloves",
          "pistols",
          "rifles",
          "srifles",
          "smgs",
          "shotguns",
          "mguns",
        ];

        weaponTypes.forEach((type) => {
          const allNotExist = $(`.box-skins.${type}`)
            .toArray()
            .every((element) => $(element).hasClass("notexist"));
          const navigationType = $(`.navigation-weapon-type.${type}`);

          if (allNotExist) {
            navigationType.removeClass("enabled").addClass("notexist");
            $(`.box-skins.${type}`).addClass("disabled");
          } else {
            navigationType.addClass("enabled").removeClass("notexist");
            $(`.box-skins.${type}`).removeClass("disabled");
          }
        });

        const enabledTypes = $(".navigation-weapon-type.enabled");
        if (enabledTypes.length === 1) {
          enabledTypes.addClass("solo-category");
        } else {
          enabledTypes.removeClass("solo-category");
        }
      }

      function checkWeaponTypeAvailabilityForItems() {
        const skinTypes = ["white", "lblue", "blue", "purple", "pink", "red"];

        skinTypes.forEach((type) => {
          const allNotExist = $(
            `.box-skins-list .skin.${type}`
          )
            .toArray()
            .every((element) => $(element).hasClass("notexist"));
          const navigationType = $(`.navigation-weapon-type.${type}`);

          if (allNotExist) {
            navigationType.removeClass("enabled").addClass("notexist");
            $(
              `.box-skins-list .skin.${type}`
            ).addClass("disabled");
          } else {
            navigationType.addClass("enabled").removeClass("notexist");
            $(
              `.box-skins-list .skin.${type}`
            ).removeClass("disabled");
          }
        });

        const enabledTypes = $(".navigation-weapon-type.enabled");
        if (enabledTypes.length === 1) {
          enabledTypes.addClass("solo-category");
        } else {
          enabledTypes.removeClass("solo-category");
        }
      }

      function generateSearchUrl(skinName, selectedSite) {
        const siteUrls = {
          Tradeit: `https://tradeit.gg/csgo/store?search=${encodeURIComponent(
            skinName
          )}&aff=csgobroker`,
          BitSkins: `https://bitskins.com/market/cs2?search={"order":[{"field":"price","order":"ASC"}],"where":{"skin_name":"${encodeURIComponent(
            skinName
          )}"}}&ref_alias=csgobroker`,
          Steam: `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(
            skinName
          )}`,
          CSMoney: `https://cs.money/market/buy/?search=${encodeURIComponent(
            skinName
          )}&sort=price&order=asc&utm_source=mediabuy&utm_medium=csgobroker&utm_campaign=market&utm_content=link`,
          "Avan.Market": `https://avan.market/ru/market/cs?name=${encodeURIComponent(
            skinName
          )}&r=broker`,
          SkinSwap: `https://skinswap.com/buy?search=${encodeURIComponent(
            skinName
          )}&r=csgobroker&appid=730`,
          default: `https://lis-skins.ru/market/csgo/?query=${encodeURIComponent(
            skinName
          )}&rf=83346597`,
        };
        return siteUrls[selectedSite] || siteUrls["default"];
      }

      async function fetchSkinPrices() {
        try {
            const response = await fetch("https://cs2broker.cc/");
            const skins = await response.json();
            return Array.isArray(skins) ? skins : [];
        } catch (error) {
            return [];
        }
    }
  
      async function showPreviewWindow(element) {
        const previewWindow = $("#preview-window");
        const previewContent = $("#preview-content");
        let skinClasses = [];
    
        previewWindow.attr("class", "hidden");
    
        if ($(element).hasClass("skin none")) {
            return;
        }
    
        if ($(element).hasClass("skin")) {
            skinClasses = $(element).attr("class").split(" ");
        }
    
        const skinBox = $(element).closest(".box-skins-list, .topic-grandbox, .introduce-craft p");
        const visibleItems = skinBox.find(".skin:not(.disabled)");
        const totalItems = visibleItems.length;
        const itemName = element.querySelector(".skin-desc-name")
            ? element.querySelector(".skin-desc-name").textContent.trim()
            : "";
    
        const weaponName = itemName.split("|")[0].trim();
    
        previewWindow.removeClass("hidden").attr({
            "data-current-index": visibleItems.index(element),
            "data-total-items": totalItems,
            "data-current-box": skinBox.index(".box-skins-list, .topic-grandbox, .introduce-craft p"),
        });
    
        skinClasses.forEach((skinClass) => {
            if (!["skin"].includes(skinClass)) {
                previewWindow.addClass(skinClass);
            }
        });
    
        previewContent.html(element.innerHTML);
        previewWindow.find(".skin-alt-info, .skin-craft-info").remove();
    
        const weapon = element.getAttribute("weapon");
        const isSticker = weapon.startsWith("sticker");
    
        const skinAltInfoDiv = $("<a>", {
            class: "skin-alt-info titled",
            href:
                languageTag === "ru"
                    ? `/ru/topic/items/${weapon}`
                    : `/topic/items/${weapon}`,
            "data-title":
                languageTag === "ru"
                    ? isSticker
                        ? "Вся Коллекция"
                        : `Все Скины на ${weaponName}`
                    : isSticker
                        ? "All Stickers"
                        : `All Skins on ${weaponName}`,
            html: '<i class="officon library"></i>',
        });
    
        let previewExtras = $("#preview-showcase .preview-extras");
        if (previewExtras.length === 0) {
            previewExtras = $("<div>", { class: "preview-extras" });
            $("#preview-showcase").append(previewExtras);
        }
    
        previewExtras.prepend(skinAltInfoDiv);
    
        let skinColorInfo = previewExtras.find(".skin-color-info");
        if (skinColorInfo.length === 0) {
            skinColorInfo = $("<div>", { class: "skin-color-info" });
            previewExtras.append(skinColorInfo);
        }
    
        skinColorInfo.empty();

      const skinId = element.getAttribute("skin-id");
      fetch(`/code-parts/topics/skins-list/${weapon}.json`)
          .then((response) => response.json())
          .then((skinsData) => {
              const skinData = skinsData[skinId];
              if (skinData) {
                if (skinData.imageOG) {
                  const imageUrl = skinData.image;
                  const imgElement = previewContent.find("img");
          
                  if (imgElement.length) {
                      imgElement.attr("src", imageUrl);
                      
                  } else {
                      previewContent.append(`
                          <img src="${imageUrl}" draggable="false" alt="${skinData.name}">
                          <div class="skin-desc-name">${skinData.name}</div>
                      `);
                  }
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
              }
          });

          fetch("/code-parts/topics/sticker-crafts-binds.json")
          .then((response) => response.json())
          .then((bindsData) => {
              const pageKey = Object.keys(bindsData).find(key => bindsData[key] === itemName);
              if (pageKey) {
                  const skinCraftInfoDiv = $("<a>", {
                      class: "skin-craft-info titled",
                      href:
                      languageTag === "ru"
                          ? `/ru/topic/sticker-crafts/skin/${pageKey}`
                          : `/topic/sticker-crafts/skin/${pageKey}`,
                      "data-title": languageTag === "ru"
                          ? `Все Стикер-Крафты для ${itemName}`
                          : `All Sticker-Crafts for ${itemName}`,
                      html: '<i class="officon stickers"></i>',
                  });
                  previewExtras.prepend(skinCraftInfoDiv);
              }
          });
  
      $(".site-searcher-box")
          .off("click")
          .on("click", function () {
              const selectedSite = this.id;
              const searchName = itemName;
              const searchUrl = generateSearchUrl(searchName, selectedSite);
              window.open(searchUrl, "_blank");
          });
  }
  
      function closePreviewWindow() {
        const previewWindow = $("#preview-window");
        previewWindow.addClass("hidden");
        previewWindow.attr("class", "hidden");
        previewWindow.find(".skin-alt-info").remove();
        previewWindow.find(".skin-craft-info").remove();

        $("#preview-showcase .preview-extras").remove();
      }
      

      function switchSkin(direction) {
        const previewWindow = $("#preview-window");
        const currentIndex = parseInt(previewWindow.attr("data-current-index"), 10);
        const currentBoxIndex = parseInt(previewWindow.attr("data-current-box"), 10);
        const currentBox = $(".box-skins-list, .topic-grandbox, .introduce-craft p, .character-box").eq(
          currentBoxIndex
        );
        const visibleItems = currentBox.find(".skin:not(.disabled):not(.none)");
        const totalItems = visibleItems.length;
        let newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      
        if (newIndex < 0) newIndex = totalItems - 1;
        else if (newIndex >= totalItems) newIndex = 0;
      
        const previewExtras = $("#preview-showcase .preview-extras");
        if (previewExtras.length > 0) {
          const skinColorInfo = previewExtras.find(".skin-color-info");
          if (skinColorInfo.length > 0) {
            skinColorInfo.empty();
          }
        }
      
        showPreviewWindow(visibleItems.eq(newIndex)[0]);
      
        previewWindow.attr("data-current-index", newIndex);
      }
      

      $(document).on("click", ".skin", function () {
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
      
        $(".navigation-weapon-type").click(function () {
          const weaponType = $(this).attr("class").split(" ")[1];
          $(`.box-skins.${weaponType}`).toggleClass("disabled");
          $(this).toggleClass("enabled");
          updateNavigationReset();
        });
      
        $(".topic-centralizer").on("click", ".navigation-reset", function () {
          $(".box-skins").removeClass("disabled selected");
          $(".navigation-weapon-type").addClass("enabled");
          $(".topic-centralizer .navigation-reset").remove();
          checkWeaponTypeAvailability();
        });
      
        checkWeaponTypeAvailability();
      }
       else if (
        currentPath.includes("/items/") ||
        currentPath.includes("/stickers/") ||
        currentPath.includes("/cases/") ||
        currentPath.includes("/skins/") ||
        currentPath.includes("/collections/")
      ) {
        $(".topic-grandbox").load(
          "/code-parts/topics/box-topic-items.html",
          function () {
            $(".navigation-weapon-type").click(function () {
              const weaponType = $(this).attr("class").split(" ")[1];
              $(`.skin.${weaponType}`).toggleClass("disabled");
              $(this).toggleClass("enabled");
              enabledFiltersState[weaponType] = $(this).hasClass("enabled");
              updateNavigationReset();
            });

            checkWeaponTypeAvailabilityForItems();
            translateTypes(languageTag);

            if (languageTag === "ru") {
              const qualityFilter = document.getElementById("Quality-Filter");
              const rarityToggle = document.getElementById("Rarity-Toggle");
              const priceFilter = document.getElementById("Price-Filter");
              if (qualityFilter && rarityToggle && priceFilter) {
                qualityFilter.dataset.title = "Сорт по Редкости";
                priceFilter.dataset.title = "Сорт по Цене";
                rarityToggle.dataset.title = "Показать Редкость";
              }
            }

            const rarityToggleState = getLocalStorageState(
              "RarityToggleState",
              true
            );
            $(".box-skins-list").toggleClass("showrarity", rarityToggleState);
            $("#Rarity-Toggle").toggleClass("enabled", rarityToggleState);

            $("#Rarity-Toggle").on("click", function () {
              $(this).toggleClass("enabled");
              $(".box-skins-list").toggleClass("showrarity");

              const isEnabled = $(this).hasClass("enabled");
              setLocalStorageState("RarityToggleState", isEnabled);
            });

            $("#Quality-Filter").click(function () {
              const enabledFilters = $(
                ".navigation-weapon-type.enabled"
              ).length;
              if (enabledFilters === 0) return;

              const skins = $(".box-skins-list .skin").get();
              skins.sort((a, b) => {
                const aClass = $(a).attr("class").split(" ")[1];
                const bClass = $(b).attr("class").split(" ")[1];
                const sortOrder = [
                  "white",
                  "lblue",
                  "blue",
                  "purple",
                  "pink",
                  "red",
                  "gold",
                ];

                return sortState === "none" || sortState === "reversed"
                  ? sortOrder.indexOf(aClass) - sortOrder.indexOf(bClass)
                  : sortOrder.indexOf(bClass) - sortOrder.indexOf(aClass);
              });

              $(".box-skins-list").html(skins);

              sortState =
                sortState === "none" || sortState === "reversed"
                  ? "enabled"
                  : "reversed";
              $(this).toggleClass("enabled reversed");
              updateNavigationReset();
            });

            $("#Price-Filter").on("click", function () {
              $(this).toggleClass("enabled");

              const skins = $(".box-skins-list .skin").get();
              skins.sort((a, b) => {
                const priceA = parseFloat($(a).find(".skin-price-info").text().split(" - ")[0].replace("$", "")) || 0;
                const priceB = parseFloat($(b).find(".skin-price-info").text().split(" - ")[0].replace("$", "")) || 0;

                return sortState === "none" || sortState === "reversed" ? priceA - priceB : priceB - priceA;
              });

              $(".box-skins-list").html(skins);

              sortState = sortState === "none" || sortState === "reversed" ? "enabled" : "reversed";
              $(this).toggleClass("reversed", sortState === "reversed");
              updateNavigationReset();
            });

            $(".topic-centralizer").on(
              "click",
              ".navigation-reset",
              function () {
                $(".skin").removeClass("disabled");
                $(".navigation-weapon-type").addClass("enabled");
                $(".topic-centralizer .navigation-reset").remove();
                enabledFiltersState = {};
                checkWeaponTypeAvailabilityForItems();
              }
            );
          }
        );
      }
    (async function autoImportFullJsonIfNeeded() {
      const currentPath = window.location.pathname;
      const validPrefixes = [
        "/topic/items/",
        "/topic/collections/",
        "/topic/stickers/",
      ];
      const shouldProcess = validPrefixes.some((prefix) =>
        currentPath.includes(prefix)
      );
      if (!shouldProcess) return;
      const topicId = currentPath
        .split("/")
        .pop()
        .replace(/\.html$/, "");
      try {
        const settingsRes = await fetch("/code-parts/topics/skins-settings.json");
        const settings = await settingsRes.json();
        const mode = settings[topicId];
        if (!mode) return;
        const box = $(".box-skins-list");
        if (!box.length) return;
        const prices = await fetchSkinPrices();
        let html = "";
        if (mode === 1) {
          const jsonPath = `/code-parts/topics/skins-list/${topicId}.json`;
          const dataRes = await fetch(jsonPath);
          if (!dataRes.ok) throw new Error(`Не удалось загрузить: ${jsonPath}`);
          const fullData = await dataRes.json();
          for (const [id, skinData] of Object.entries(fullData)) {
            html += renderSkinHTML(id, topicId, skinData, prices);
          }
        } else if (mode === 2) {
          const presetPath = `/code-parts/topics/skins-list/presets/${topicId}.json`;
          const presetRes = await fetch(presetPath);
          if (!presetRes.ok) throw new Error(`Не удалось загрузить: ${presetPath}`);
          const presetItems = await presetRes.json();
          const weaponCache = {};
          for (const item of presetItems) {
            const { weapon, ["skin-id"]: skinId } = item;
            if (!weaponCache[weapon]) {
              const weaponRes = await fetch(
                `/code-parts/topics/skins-list/${weapon}.json`
              );
              if (!weaponRes.ok) continue;
              weaponCache[weapon] = await weaponRes.json();
            }
            const weaponData = weaponCache[weapon];
            const skinData = weaponData[skinId];
            if (skinData) {
              html += renderSkinHTML(skinId, weapon, skinData, prices);
            }
          }
        }
        box.html(html);
        checkWeaponTypeAvailabilityForItems();
        const qualityFilterBtn = document.getElementById("Quality-Filter");
        if (qualityFilterBtn && !qualityFilterBtn.classList.contains("enabled")) {
          qualityFilterBtn.click();
        }
        setTimeout(() => {
          $(".skin img").each(function () {
            if (this.complete) {
              $(this).addClass("imported");
            } else {
              $(this).on("load", function () {
                $(this).addClass("imported");
              });
            }
          });
        }, 0);
      } catch (err) {
        console.error("Ошибка при автоимпорте:", err);
      }
      function renderSkinHTML(id, weapon, skinData, prices) {
        const matched = Array.isArray(prices)
          ? prices.filter((p) => p.name.includes(skinData.name))
          : [];
        let priceInfo = "";
        if (matched.length > 0) {
          const sortedPrices = matched.map((p) => p.price).sort((a, b) => a - b);
          priceInfo =
            sortedPrices[0] === sortedPrices[sortedPrices.length - 1]
              ? `${sortedPrices[0].toFixed(2)}$`
              : `${sortedPrices[0].toFixed(2)}$ - ${sortedPrices[
                  sortedPrices.length - 1
                ].toFixed(2)}$`;
        }
        const imageUrl = skinData.image;
        return ` <div class="skin ${
          skinData.class
        }" skin-id="${id}" weapon="${weapon}"> <img src="${imageUrl}" draggable="false" alt="${
          skinData.name
        }"> <div class="skin-desc-name">${skinData.name}</div> ${
          priceInfo ? `<div class="skin-price-info">${priceInfo}</div>` : ""
        } </div> `;
      }
      async function fetchSkinPrices() {
        try {
          const res = await fetch("https://cs2broker.cc/");
          if (!res.ok) throw new Error("Не удалось загрузить цены скинов");
          return await res.json();
        } catch (err) {
          console.error("Ошибка при загрузке цен скинов:", err);
          return [];
        }
      }
    })();
    }

});

if (window.location.pathname.includes("/items/") || window.location.pathname.includes("/cases/") || window.location.pathname.includes("/stickers/") || window.location.pathname.includes("/collections/")) {
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
    xhr.open("GET", "/code-parts/topics/nav-bar-items.html", true);
    xhr.send();
  }

  if (window.location.pathname.includes("/topic")) {
    var skinslist = document.querySelectorAll('.box-skins-list');
    skinslist.forEach(function(element) {
        element.classList.add('visible');
    });
    
    document.addEventListener('DOMContentLoaded', function () {
        if (window.location.pathname.includes("/topic/skins")) {
            var colorList = ["white", "gray", "black", "brown", "red", "orange", "golden", "silver", "yellow", "green", "cyan", "blue", "purple", "pink"];
        
            colorList.forEach(function(color) {
                var bgImage = new Image();
                bgImage.src = "/img/skins/topics/small/example-" + color + ".webp";
                bgImage.onload = function() {
                    var skinslist = document.querySelectorAll("[data-color='" + color + "']");
                    skinslist.forEach(function(element) {
                        element.style.backgroundImage = "url(" + bgImage.src + "), linear-gradient(-45deg, var(--darkygray) 50%, var(--darkgray) 100%)";
                        element.classList.add("active");
                    });
                };
            });
        }

        const boxSkinsElements = document.querySelectorAll('.box-skins');
        boxSkinsElements.forEach(function(boxSkinsElement) {
            const boxSkinsList = boxSkinsElement.querySelector('.box-skins-list');

            if (boxSkinsList && boxSkinsList.scrollWidth > boxSkinsList.clientWidth) {
                const boxSkinsControl = document.createElement('div');
                boxSkinsControl.className = 'box-skins-control';
                boxSkinsControl.innerHTML = `
                <div class="box-skins-button left hidden"><i class="officon chevron left"></i></div>
                <div class="box-skins-button right hidden"><i class="officon chevron right"></i></div>
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
              const walk = (x - startX) * 1;
              container.scrollLeft = scrollLeft - walk;
          });
        }
        
        boxSkinsElements.forEach(function(boxSkinsElement) {
          const boxSkinsList = boxSkinsElement.querySelector('.box-skins-list');
          enableMouseDragScroll(boxSkinsList);
        });
        
        const boxSkinsNav = document.querySelector('.box-skins-nav');
        const weaponNames = [
          "Gloves", "Knives", "Перчатки", "Ножи", "AWP", "AK-47", "M4A4", "M4A1-S", "SSG 08", "Desert Eagle", "P250", 
          "Glock-18", "USP-S", "P2000", "CZ75-Auto", "Dual Berettas", "Five-SeveN", "Tec-9", 
          "R8 Revolver", "Zeus x27", "MP9", "MAC-10", "MP7", "MP5-SD", "UMP-45", "P90", "PP-Bizon", "Galil AR", 
          "FAMAS", "SG 553", "AUG", "Nova", "XM1014", "MAG-7", "Sawed-Off", "SCAR-20", "G3SG1", 
          "Negev", "M249"
        ];
        
        function populateNavList(navList) {
          weaponNames.forEach(function(weapon) {
              const boxSkins = document.querySelectorAll('.box-skins');
              let isWeaponExist = false;
        
              boxSkins.forEach(function(box) {
                  const skinNameSpan = box.querySelector('.box-skins-name span');
                  if (skinNameSpan && skinNameSpan.textContent.trim() === weapon && !box.classList.contains('notexist')) {
                      isWeaponExist = true;
                  }
              });
        
              if (isWeaponExist) {
                  const navItem = document.createElement('div');
                  navItem.className = 'navigation-weapon-name';
                  navItem.textContent = weapon;
                  navList.appendChild(navItem);
        
                  navItem.addEventListener('click', function() {
                      scrollToBoxSkins(weapon);
                  });
              }
          });
        }
        
        let scrollOffset = 115;

        function scrollToBoxSkins(weaponName) {
            const boxSkins = document.querySelectorAll('.box-skins');
            boxSkins.forEach(function(box) {
                const skinNameSpan = box.querySelector('.box-skins-name span');
                if (skinNameSpan && skinNameSpan.textContent.trim() === weaponName && !box.classList.contains('notexist')) {
                    const boxPosition = box.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({
                        top: boxPosition - scrollOffset,
                        behavior: 'smooth'
                    });
                }
            });
        }
        
        const navList = document.querySelector('.box-skins-nav-list');

        if (navList) {
            populateNavList(navList);
        
            enableMouseDragScroll(navList);
        
            const navItems = navList.querySelectorAll('.navigation-weapon-name');
            const itemsToScroll = 5;
        
            if (navItems.length > itemsToScroll) {
                const navControl = document.createElement('div');
                navControl.className = 'box-skins-nav-control';
                navControl.innerHTML = `
                    <div class="box-skins-button left hidden"><i class="officon chevron left"></i></div>
                    <div class="box-skins-button right"><i class="officon chevron right"></i></div>
                `;
                boxSkinsNav.appendChild(navControl);
        
                const leftNavButton = navControl.querySelector('.box-skins-button.left');
                const rightNavButton = navControl.querySelector('.box-skins-button.right');
        
                const itemWidth = navItems[0].offsetWidth + 10;
        
                leftNavButton.addEventListener('click', function () {
                    navList.scrollBy({
                        left: -(itemWidth * itemsToScroll),
                        behavior: 'smooth'
                    });
                });
        
                rightNavButton.addEventListener('click', function () {
                    navList.scrollBy({
                        left: itemWidth * itemsToScroll,
                        behavior: 'smooth'
                    });
                });
        
                navList.addEventListener('scroll', function () {
                    leftNavButton.classList.toggle('hidden', navList.scrollLeft <= itemWidth);
                    rightNavButton.classList.toggle('hidden', navList.scrollLeft + navList.clientWidth >= navList.scrollWidth);
                });
        
                leftNavButton.classList.toggle('hidden', navList.scrollLeft <= itemWidth);
                rightNavButton.classList.toggle('hidden', navList.scrollLeft + navList.clientWidth >= navList.scrollWidth);
            }
        }        
      
    });
    
    function translateTypes(languageTag) {
        if (languageTag === "ru") {
            var translations_items = {
                "Knives": "Ножи",
                "Gloves": "Перчатки",
                "Pistols": "Пистолеты",
                "Rifles": "Винтовки",
                "Sniper Rifles": "Снайперские винтовки",
                "SMGs": "ПП",
                "Shotguns": "Дробовики",
                "Machine guns": "Пулеметы",
                "Consumer Grade": "Ширпотреб",
                "Industrial Grade": "Промышленное",
                "Mil-Spec": "Армейское",
                "Restricted": "Запрещенное",
                "Classified": "Засекреченное",
                "Covert": "Тайное",
                "Contraband": "Контрабанда",
                "Change Color": "Сменить Цвет",
                "Expensive": "Дорогой",
                "Cheap": "Дешевый",
                "All Skins": "Все Скины"
            };

            var elementsToTranslate = document.querySelectorAll('.navigation-weapon-type, .category-switch, .color-box-selection-button, .color-box-overview-button, .navigation-weapon-name, .box-skins-name span');
            elementsToTranslate.forEach(function(element) {
                var originalText = element.textContent.trim();
                if (translations_items.hasOwnProperty(originalText)) {
                    element.textContent = translations_items[originalText];
                }
            });
        }
    }

    translateTypes(languageTag)
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

  $(document).ready(function () {
    function initializeBoxTopic() {
        var topicpage = $('.topicpage');
        if (topicpage.length) {
            var urlnav = languageTag === 'ru' 
                ? '/code-parts/topics/nav-topic-box-ru.html' 
                : '/code-parts/topics/nav-topic-box.html';
            
            $.get(urlnav, function (data) {
                topicpage.append(data);
    
                topicpage.on('click.topicNav', '.topic-nav-box', function () {
                    var topicNavBox = $(this);
                    toggleActiveClass(topicNavBox);
                    
                    if (topicNavBox.hasClass('active')) {
                        $('.pages').addClass('hardhidden');
                    } else {
                        $('.pages').removeClass('hardhidden');
                    }
    
                    toggleActiveClass($('.topic-nav-selector'));
                });
    
                topicpage.on('click.topicNav', '.topic-nav-close', function () {
                    toggleActiveClass($('.topic-nav-selector'));
                    $('.pages').removeClass('hardhidden');
                    $('.topic-nav-box').removeClass('active');
                });
    
                topicpage.on('click.topicNav', '.weapon-container', function () {
                    var clickedContainer = $(this);
                    $('.weapon-container').not(clickedContainer).removeClass('active');
                    toggleActiveClass(clickedContainer);
                });
            });
        }
    }
    
    

    function deinitializeBoxTopic() {
        var topicpage = $('.topicpage');
        if (topicpage.length) {
            topicpage.off('.topicNav');
            $('.topic-nav-selector').remove();
            $('.topic-nav-box').removeClass('active');
            topicpage.data('initialized', false);
        }
    }

    function checkWindowSize() {
        if ($(window).width() < 1365) {
            if (isTopicItemsLink() && !$('.topicpage').data('initialized')) {
                initializeBoxTopic();
                $('.topicpage').data('initialized', true);
            }
        } else {
            deinitializeBoxTopic();
        }
    }

    $(window).on('resize', checkWindowSize);
    checkWindowSize();
});

  
  function toggleActiveClass(element) {
    element.toggleClass('active');
  }
  
  function isTopicItemsLink() {
    return (
      window.location.href.includes("/topic/items/") ||
      window.location.href.includes("/topic/cases/") ||
      window.location.pathname.includes("/topic/stickers/") ||
      window.location.href.includes("/topic/collections/")
    );
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

function setLocalStorageState(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getLocalStorageState(key, defaultValue) {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('/topic/')) return;

  const navReview = document.querySelector('.nav-review.blog');
  if (!navReview) return;

  const navItems = navReview.querySelectorAll('li');
  const textColInfos = document.querySelectorAll('.text-col-info');

  if (navItems.length !== textColInfos.length) {
      return;
  }

  navItems.forEach((li, index) => {
      const targetElement = textColInfos[index];

      li.addEventListener('click', () => {
          const rect = targetElement.getBoundingClientRect();
          const offsetTop = window.scrollY + rect.top - 150;

          window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
          });

          targetElement.classList.remove('navmark');
          void targetElement.offsetWidth;
          targetElement.classList.add('navmark');

          targetElement.addEventListener('animationend', function handler() {
              targetElement.classList.remove('navmark');
              targetElement.removeEventListener('animationend', handler);
          });
      });
  });
});

if (window.location.pathname.includes('/sticker-crafts/')) {
  
      async function importStickerCrafts() {
        try {
            const response = await fetch("/code-parts/topics/sticker-crafts.json");
            if (!response.ok) return;
    
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) return;
    
            const currentPageSpan = document.querySelector('.siteblock .topic-grandbox .navigation-section.first span');
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
                    <div class="navigation-section first">
                        <span>${sticker.title}</span>
                    </div>
                    <div class="navigation-section third">
                        ${sticker.skins.map(skin => 
                            `<div class="skin" weapon="${skin.weapon}" skin-id="${skin.skin_id}"></div>`
                        ).join('')}
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
    
            setTimeout(() => {
                stickerCraftsList.classList.add('imported');
            }, 150);
        } catch (error) {
        }
    }

  importStickerCrafts();
}

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
    if (link.closest('div.instruction') || link.closest('div.instruction-mirrors') || link.closest('div.site-attention')) {
      return;
    }

    if (languageTag === 'tr' && link.classList.contains('mirror-redirect') || languageTag === 'es' && link.classList.contains('mirror-redirect')) {
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

if (window.location.pathname.includes('/topic/skins/')) {
  document.addEventListener('DOMContentLoaded', () => {
    const colorsBox = document.querySelector('.colors-box-selection');

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
          if (!response.ok) {
            throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
          }
          return response.text();
        })
        .then(htmlContent => {
          const container = document.createElement('div');
          container.innerHTML = htmlContent;
          const importedContent = container.querySelector('#color-list');

          if (importedContent) {
            colorsBox.appendChild(importedContent);
          }

          const colorBoxes = document.querySelectorAll(
            ".color-box-selection-button"
          );

          colorBoxes.forEach((box) => {
            box.addEventListener("click", () => {
              box.classList.toggle("clicked");
              importedContent.classList.toggle("active");
            });
          });

          const allskinsListbutton = document.querySelector(
            ".navigation-section.second"
          );

          if (languageTag === "ru") {
            updateURLs(allskinsListbutton);
          }
        })
        .catch(error => {
          console.error(error);
        });
    }

    const topicBox = document.querySelector('.topic-box');
    if (topicBox) {
      const logoBg = topicBox.querySelector('.logobg');
      const dataColor = logoBg ? logoBg.getAttribute('data-color') : null;

      if (dataColor) {
        const categorySwitchContainer = document.querySelector('.skins-category-switch');
        if (categorySwitchContainer) {
          const categorySwitches = categorySwitchContainer.querySelectorAll('div.category-switch');
          categorySwitches.forEach((switchElement, index) => {
            const hrefBase = index === 0
              ? `/topic/skins/cheapest-${dataColor}-skins`
              : `/topic/skins/best-${dataColor}-skins`;

            const anchor = document.createElement('a');
            anchor.textContent = switchElement.textContent;
            anchor.href = hrefBase;
            anchor.className = switchElement.className;

            anchor.addEventListener('click', (e) => {
              categorySwitchContainer.querySelectorAll('a').forEach(el => el.classList.remove('clicked'));
              anchor.classList.add('clicked');
            });

            switchElement.replaceWith(anchor);
          });
        }

        const overviewButton = document.querySelector('.color-box-overview-button');
        if (overviewButton) {
          overviewButton.href = `/topic/skins/${dataColor}-skins`;
        }
      }
    }
  });
}

const backbutton = document.querySelector(".singlemod-box:has(.back-button)");

if (languageTag === "ru") {
  updateURLs(backbutton);
}

document.addEventListener("DOMContentLoaded", async function () {
  var res = $(window).width();
  const itemsPerPage = res < 1365 ? 6 : 12;
  const topicBoxesHolder = document.querySelector(".topic-boxes-holder.sticker-crafts");
  if (!topicBoxesHolder) return;
  
  const currentPath = window.location.pathname;
  const isStickerCraftsPage = /\/sticker-crafts\/skin\//.test(currentPath);
  
  let skinBindMap = {};
  
  try {
      const bindsResponse = await fetch("/code-parts/topics/sticker-crafts-binds.json");
      const bindsData = await bindsResponse.json();
      skinBindMap = bindsData || {};
  } catch (error) {
  }
  
  const pageKey = currentPath.split("/").pop().replace(".html", "");
  const matchedSkinName = skinBindMap[pageKey];
  
    
  fetch("/code-parts/topics/sticker-crafts.json")
  .then(response => response.json())
  .then(data => {
      if (!Array.isArray(data)) return;

      const filteredData = isStickerCraftsPage && matchedSkinName 
          ? data.filter(sticker => sticker.skin === matchedSkinName)
          : data;

      filteredData.forEach(sticker => {
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
          <div class="navigation-section first">
              <span>${sticker.title}</span>
          </div>
          <div class="navigation-section third">
              ${sticker.skins.map(skin => 
                  `<div class="skin" weapon="${skin.weapon}" skin-id="${skin.skin_id}"></div>`
              ).join('')}
          </div>
          `;
          topicBoxesHolder.appendChild(topic);
      });

      if (filteredData.length > 12) {
        topicBoxesHolder.classList.add("pagination");
      }

      setupPagination();

      if (languageTag === "ru") {
          updateURLs(topicBoxesHolder);
      }
  });
  
  function setupPagination() {
      const boxTopics = Array.from(topicBoxesHolder.querySelectorAll(".topic-grandbox"));
      if (!boxTopics.length) return;

      const paginationHolder = document.createElement("div");
      paginationHolder.classList.add("pagination-holder");
      topicBoxesHolder.appendChild(paginationHolder);

      const totalPages = Math.ceil(boxTopics.length / itemsPerPage);

      function showPage(page) {
          const start = (page - 1) * itemsPerPage;
          const end = page * itemsPerPage;

          boxTopics.forEach((box, index) => {
              if (index >= start && index < end) {
                  const delay = ((index % itemsPerPage) + 1) * 0.05;
                  box.style.animationDelay = `${delay}s`;
                  box.classList.remove("hidden");
                  box.classList.add("fade-in");
                  
                  box.addEventListener("animationend", () => {
                      box.classList.remove("fade-in");
                      box.classList.add("visible");
                  }, { once: true });
              } else {
                  box.classList.add("hidden");
                  box.classList.remove("fade-in", "visible");
              }
          });
          
          updatePaginationButtons(page);
      }

      function createPaginationButtons() {
          paginationHolder.innerHTML = "";
          for (let i = 1; i <= totalPages; i++) {
              const button = document.createElement("button");
              button.textContent = i;
              button.classList.add("pagination-button");
              button.dataset.page = i;
              button.addEventListener("click", () => showPage(i));
              paginationHolder.appendChild(button);
          }
      }

      function updatePaginationButtons(activePage) {
          document.querySelectorAll(".pagination-button").forEach((button) => {
              button.classList.toggle("active", parseInt(button.dataset.page, 10) === activePage);
          });
      }

      const skinsOnPage = $(".skin");
      const weaponToSkinIds = {};
  
      skinsOnPage.each(function () {
          const weapon = $(this).attr("weapon");
          const skinId = $(this).attr("skin-id");
          if (weapon && skinId) {
              weaponToSkinIds[weapon] = weaponToSkinIds[weapon] || [];
              weaponToSkinIds[weapon].push(skinId);
          }
      });
  
      const loadSkinsData = async () => {
          await Promise.all(Object.keys(weaponToSkinIds).map(async (weapon) => {
              const response = await fetch(`/code-parts/topics/skins-list/${weapon}.json`);
              const skinsData = await response.json();
  
              const skinsForWeapon = skinsData || {};
              weaponToSkinIds[weapon].forEach((skinId) => {
                  const skinData = skinsForWeapon[skinId];
                  if (skinData) {
                      const isInNavigation = $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).closest('.navigation-section').length > 0;
                      const imageUrl = isInNavigation ? skinData.imageOG : skinData.image;
  
                      const newSkinHTML = `
                          <div class="skin ${skinData.class}" skin-id="${skinId}" weapon="${weapon}">
                              <img src="${imageUrl}" draggable="false" alt="${skinData.name}">
                          </div>`;
                          
                      $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).each(function() {
                          $(this).replaceWith(newSkinHTML);
                      });
                  }
              });
          }));
  
          $(".skin img").each(function () {
              if (this.complete) {
                  $(this).addClass("imported");
              } else {
                  $(this).on("load", function () {
                      $(this).addClass("imported");
                  });
              }
          });
  
      };

      loadSkinsData();

        createPaginationButtons();
        showPage(1);
  }
});


const topicBoxesHolder = document.querySelector(".topic-boxes-holder");

if (languageTag === "ru") {
    updateURLs(topicBoxesHolder);
}


document.addEventListener("DOMContentLoaded", function () {

  var res = $(window).width();

  const itemsPerPage = res < 1365 ? 6 : 12;
  const topicBoxesHolder = document.querySelector(".topic-boxes-holder");

  if (!topicBoxesHolder) return;

  const boxTopics = Array.from(topicBoxesHolder.querySelectorAll(".topic-box"));

  if (!boxTopics.length) return;

  const paginationHolder = document.createElement("div");
  paginationHolder.classList.add("pagination-holder");
  topicBoxesHolder.appendChild(paginationHolder);

  const totalPages = Math.ceil(boxTopics.length / itemsPerPage);

  function showPage(page) {
      const start = (page - 1) * itemsPerPage;
      const end = page * itemsPerPage;

      boxTopics.forEach((box, index) => {
        if (index >= start && index < end) {
            const delay = ((index % itemsPerPage) + 1) * 0.05;
            box.style.animationDelay = `${delay}s`;
            box.classList.remove("hidden");
            box.classList.add("fade-in");
    
            box.addEventListener("animationend", () => {
                box.classList.remove("fade-in");
                box.classList.add("visible");
            }, { once: true });
        } else {
            box.classList.add("hidden");
            box.classList.remove("fade-in", "visible");
        }
    });
    

      updatePaginationButtons(page);
  }

  boxTopics.forEach((box) => {
    box.addEventListener("animationend", () => {
        box.style.opacity = "";
    });
});



  function createPaginationButtons() {
      paginationHolder.innerHTML = ""; 
      for (let i = 1; i <= totalPages; i++) {
          const button = document.createElement("button");
          button.textContent = i;
          button.classList.add("pagination-button");
          button.dataset.page = i;
          button.addEventListener("click", () => showPage(i));
          paginationHolder.appendChild(button);
      }
  }

  function updatePaginationButtons(activePage) {
      document.querySelectorAll(".pagination-button").forEach((button) => {
          button.classList.toggle("active", parseInt(button.dataset.page, 10) === activePage);
      });
  }

  function initPagination() {
      createPaginationButtons();
      showPage(1);
  }

  initPagination();
});
