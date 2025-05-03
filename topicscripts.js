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
                    const imageUrl = skinData.image;
      
                    let priceInfoContent = "";
      
                    if (Array.isArray(skinPrices)) {
                      const isSticker = skinData.name.startsWith("Sticker |");
      
                      const matchedSkins = skinPrices.filter(skin => {
                        return isSticker
                          ? skin.name === skinData.name
                          : skin.name.includes(skinData.name);
                      });
      
                      const normalPrices = matchedSkins
                        .filter(skin => !skin.name.startsWith("Souvenir"))
                        .map(skin => skin.price);
      
                      const souvenirPrices = matchedSkins
                        .filter(skin => skin.name.startsWith("Souvenir"))
                        .map(skin => skin.price);
      
                      if (normalPrices.length > 0) {
                        normalPrices.sort((a, b) => a - b);
                        const text = normalPrices[0] === normalPrices[normalPrices.length - 1]
                          ? `${normalPrices[0].toFixed(2)}$`
                          : `${normalPrices[0].toFixed(2)}$ - ${normalPrices[normalPrices.length - 1].toFixed(2)}$`;
                        priceInfoContent += `${text}`;
                      }
      
                      if (souvenirPrices.length > 0) {
                        souvenirPrices.sort((a, b) => a - b);
                        const text = souvenirPrices[0] === souvenirPrices[souvenirPrices.length - 1]
                          ? `${souvenirPrices[0].toFixed(2)}$`
                          : `${souvenirPrices[0].toFixed(2)}$ - ${souvenirPrices[souvenirPrices.length - 1].toFixed(2)}$`;
                        priceInfoContent += `<div class="souvenir-price-info">${text}</div>`;
                      }
                    }
      
                    const newSkinHTML = `
                      <div class="skin ${skinData.class}" skin-id="${skinId}" weapon="${weapon}">
                          <img src="${imageUrl}" draggable="false" alt="${skinData.name}">
                          <div class="skin-desc-name">${skinData.name}</div>
                          ${priceInfoContent ? `<div class="skin-price-info">${priceInfoContent}</div>` : ""}
                      </div>
                    `;
      
                    $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).each(function () {
                      $(this).replaceWith(newSkinHTML);
                    });
                  }
                });
              } catch (error) {
                console.error(error);
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
      
            if (location.pathname.includes("/topic/sticker-crafts/")) {
              updateCraftComponentList();
            }
          } catch (error) {
            console.error(error);
          }
        };
      
        const updateCraftComponentList = () => {
          const boxes = document.querySelectorAll('.siteblock .topic-grandbox');
        
          boxes.forEach(box => {
            const thirdSection = box.querySelector('.navigation-section.third');
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
        
        
      
        window.loadSkinsData = loadSkinsData;
      
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
  
    let switchLock = false; // блокировка спама

    async function showPreviewWindow(element) {
        const previewWindow = $("#preview-window");
        const previewContent = $("#preview-content");
        let skinClasses = [];
    
        previewWindow.attr("class", "hidden");
    
        if ($(element).hasClass("skin none")) return;
    
        if ($(element).hasClass("skin")) {
            skinClasses = $(element).attr("class").split(" ");
        }
    
        const skinBox = $(element).closest(".box-skins-list, .topic-grandbox, .introduce-craft");
        const visibleItems = skinBox.find(".skin:not(.disabled)");
        const totalItems = visibleItems.length;
        const itemName = element.querySelector(".skin-desc-name")?.textContent.trim() || "";
        const weaponName = itemName.split("|")[0].trim();
    
        previewWindow.removeClass("hidden").attr({
            "data-current-index": visibleItems.index(element),
            "data-total-items": totalItems,
            "data-current-box": skinBox.index(".box-skins-list, .topic-grandbox, .introduce-craft"),
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
    
        // Очищаем только alt/craft info (не весь extras)
        previewExtras.find(".skin-alt-info, .skin-craft-info").remove();

        const weapon = element.getAttribute("weapon");
        const isSticker = weapon.includes("sticker") || weapon.includes("capsule");
    
        // ALT info
        let skinAltInfoDiv = previewExtras.find(".skin-alt-info");
        if (skinAltInfoDiv.length === 0) {
            skinAltInfoDiv = $("<a>", {
                class: "skin-alt-info titled",
                html: '<i class="officon library"></i>',
            });
            previewExtras.prepend(skinAltInfoDiv);
        }
        skinAltInfoDiv.attr({
            href: languageTag === "ru"
                ? `/ru/topic/items/${weapon}`
                : `/topic/items/${weapon}`,
            "data-title": languageTag === "ru"
                ? `Все Скины на ${weaponName}`
                : `All Skins on ${weaponName}`,
        }).toggleClass("hidden", isSticker);
    
        let skinColorInfo = previewExtras.find(".skin-color-info");
        if (skinColorInfo.length === 0) {
            skinColorInfo = $("<div>", { class: "skin-color-info" }).css({ display: "flex", opacity: 0 });
            previewExtras.append(skinColorInfo);
        }
    
        let skinExtraInfo = previewExtras.find(".skin-extra-info");
        if (skinExtraInfo.length === 0) {
            skinExtraInfo = $("<div>", { class: "skin-extra-info" }).css({ display: "flex", opacity: 0 });
            previewExtras.append(skinExtraInfo);
        }
    
        // Остановить текущие анимации
        skinColorInfo.stop(true, true);
        skinExtraInfo.stop(true, true);

        // Если видно - скрыть через анимацию
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

        // Ждём все скрытия
        await Promise.all(hideAnimations);

        // Очищаем старый контент
        skinColorInfo.empty();
        skinExtraInfo.empty();

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
    
        const skinId = element.getAttribute("skin-id");
        const skinsDataResponse = await fetch(`/code-parts/topics/skins-list/${weapon}.json`);
        const skinsData = await skinsDataResponse.json();
        const skinData = skinsData[skinId];
    
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
    
            async function handleCollectionOrCase(type) {
                const file = type === "collection" ? "collections" : "cases";
                const searchTitle = skinData[type];
                if (!searchTitle) return;
    
                const response = await fetch(`/code-parts/topics/${file}.json`);
                const data = await response.json();
                const match = data.items.find(item => item.title === searchTitle);
    
                if (match) {
                    const link = $("<a>", {
                        href: `/topic/${file}/${match.id}`,
                    }).append(
                        $("<img>", { src: match.img, alt: match.title }),
                        $("<span>").text(match.title)
                    );
                    skinExtraInfo.append(link);
                }
            }
    
            async function handleStickerOrCapsule() {
                if (!weapon.includes("sticker") && !weapon.includes("capsule")) return;
    
                const filesToCheck = [
                    "/code-parts/topics/sticker-capsules.json",
                    "/code-parts/topics/autograph-capsules.json"
                ];
    
                for (const filePath of filesToCheck) {
                    const response = await fetch(filePath);
                    const data = await response.json();
                    const match = data.items.find(item => item.id === weapon);
                    if (match) {
                        const link = $("<a>", {
                            href: `/topic/stickers/${match.id}`,
                        }).append(
                            $("<img>", { src: match.img, alt: match.title }),
                            $("<span>").text(match.title)
                        );
                        skinExtraInfo.append(link);
                        break;
                    }
                }
            }
    
            await handleCollectionOrCase("collection");
            await handleCollectionOrCase("case");
            await handleStickerOrCapsule();
        }

        // Добавляем новый контент
        // Теперь правильно показываем: сначала display: flex и opacity: 0
        skinColorInfo.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 100);
        skinExtraInfo.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 100);
    
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
        previewWindow.addClass("hidden");
        previewWindow.attr("class", "hidden");
    
        previewWindow.find(".skin-alt-info, .skin-craft-info").remove();
    
        const previewExtras = $("#preview-showcase .preview-extras");
        if (previewExtras.length > 0) {
            previewExtras.find(".skin-color-info, .skin-extra-info").stop(true, true).fadeOut(100, function() {
                $(this).empty();
            });
        }
    }
    
    async function switchSkin(direction) {
        if (switchLock) return; // уже переключаем
        switchLock = true;
    
        const previewWindow = $("#preview-window");
        const currentIndex = parseInt(previewWindow.attr("data-current-index"), 10);
        const currentBoxIndex = parseInt(previewWindow.attr("data-current-box"), 10);
        const currentBox = $(".box-skins-list, .topic-grandbox, .introduce-craft, .character-box").eq(currentBoxIndex);
        const visibleItems = currentBox.find(".skin:not(.disabled):not(.none)");
        const totalItems = visibleItems.length;
        let newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    
        if (newIndex < 0) newIndex = totalItems - 1;
        else if (newIndex >= totalItems) newIndex = 0;
    
        await showPreviewWindow(visibleItems.eq(newIndex)[0]);
        previewWindow.attr("data-current-index", newIndex);
    
        switchLock = false;
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
        $.getJSON("/code-parts/topics/items-nav.json", function (navData) {
          const $grandbox = $(".topic-grandbox");
          const $navSectionFirst = $('<div class="navigation-section first"></div>');
          const currentPath = window.location.pathname;
        
          const stickerTitles = {
            blue: "High Grade",
            purple: "Remarkable",
            pink: "Exotic",
            red: "Extraordinary"
          };
        
          navData.types.forEach(type => {
            let title = type.title;
            if (currentPath.includes("/stickers/") && stickerTitles[type.class]) {
              title = stickerTitles[type.class];
            }
        
            $navSectionFirst.append(
              `<div class="navigation-weapon-type ${type.class} enabled">${title}</div>`
            );
          });
        
          const $navSearchers = $('<div class="navigation-section searchers"></div>');
          navData.filters.forEach(filter => {
            const title = languageTag === "ru" ? filter.title_ru : filter.title_en;
            $navSearchers.append(
              `<div class="navigation-weapon-sort" data-title="${title}" id="${filter.id}">
                 <i class="officon ${filter.icon}"></i>
               </div>`
            );
          });
        
          $grandbox.prepend($navSectionFirst, $navSearchers);
        
          // Остальная логика (как в предыдущем ответе, без изменений)
          $(".navigation-weapon-type").click(function () {
            const weaponType = $(this).attr("class").split(" ")[1];
            $(`.skin.${weaponType}`).toggleClass("disabled");
            $(this).toggleClass("enabled");
            enabledFiltersState[weaponType] = $(this).hasClass("enabled");
            updateNavigationReset();
          });
        
          checkWeaponTypeAvailabilityForItems();
          translateTypes(languageTag);
        
          const rarityToggleState = getLocalStorageState("RarityToggleState", true);
          $(".box-skins-list").toggleClass("showrarity", rarityToggleState);
          $("#Rarity-Toggle").toggleClass("enabled", rarityToggleState);
        
          $("#Rarity-Toggle").on("click", function () {
            $(this).toggleClass("enabled");
            $(".box-skins-list").toggleClass("showrarity");
            setLocalStorageState("RarityToggleState", $(this).hasClass("enabled"));
          });
        
          $("#Quality-Filter").click(function () {
            const enabledFilters = $(".navigation-weapon-type.enabled").length;
            if (enabledFilters === 0) return;
        
            const skins = $(".box-skins-list .skin").get();
            skins.sort((a, b) => {
              const aClass = $(a).attr("class").split(" ")[1];
              const bClass = $(b).attr("class").split(" ")[1];
              const sortOrder = ["white", "lblue", "blue", "purple", "pink", "red", "gold"];
              return sortState === "none" || sortState === "reversed"
                ? sortOrder.indexOf(aClass) - sortOrder.indexOf(bClass)
                : sortOrder.indexOf(bClass) - sortOrder.indexOf(aClass);
            });
        
            $(".box-skins-list").html(skins);
            sortState = sortState === "none" || sortState === "reversed" ? "enabled" : "reversed";
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
        
          $(".topic-centralizer").on("click", ".navigation-reset", function () {
            $(".skin").removeClass("disabled");
            $(".navigation-weapon-type").addClass("enabled");
            $(".topic-centralizer .navigation-reset").remove();
            enabledFiltersState = {};
            checkWeaponTypeAvailabilityForItems();
          });
        });
            
      }
      (async function autoImportFullJsonIfNeeded() {
        const currentPath = window.location.pathname;
        const validPrefixes = ["/topic/items/", "/topic/collections/", "/topic/stickers/"];
        const shouldProcess = validPrefixes.some(prefix => currentPath.includes(prefix));
        if (!shouldProcess) return;
      
        const topicId = currentPath.split("/").pop().replace(/\.html$/, "");
        const isCollection = currentPath.includes("/topic/collections/");
        const isSticker = currentPath.includes("/topic/stickers/");
      
        try {
          let mode;
          const settingsRes = await fetch("/code-parts/topics/skins-settings.json");
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            mode = settings[topicId];
          }
      
          if (!mode) {
            if (isCollection) mode = 2;
            if (isSticker) mode = 1;
          }
          if (!mode) return;
      
          const box = $(".box-skins-list");
          if (!box.length) return;
      
          const prices = await fetchSkinPrices();
          let html = "";
      
          if (mode === 1) {
            const jsonPath = `/code-parts/topics/skins-list/${topicId}.json`;
            const dataRes = await fetch(jsonPath);
            if (!dataRes.ok) return;
      
            const fullData = await dataRes.json();
            for (const [id, skinData] of Object.entries(fullData)) {
              html += renderSkinHTML(id, topicId, skinData, prices);
            }
      
          } else if (mode === 2) {
            const presetPath = `/code-parts/topics/skins-list/presets/${topicId}.json`;
            const presetRes = await fetch(presetPath);
            if (!presetRes.ok) return;
      
            const presetItems = await presetRes.json();
            const uniqueWeapons = [...new Set(presetItems.map(item => item.weapon))];
      
            const weaponCache = {};
            await Promise.all(uniqueWeapons.map(async (weapon) => {
              try {
                const res = await fetch(`/code-parts/topics/skins-list/${weapon}.json`);
                if (res.ok) {
                  weaponCache[weapon] = await res.json();
                }
              } catch {}
            }));
      
            for (const item of presetItems) {
              const { weapon, ["skin-id"]: skinId } = item;
              const weaponData = weaponCache[weapon];
              if (!weaponData) continue;
      
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
          console.error("Error in autoImportFullJsonIfNeeded:", err);
        }
      
        // Обновлённая функция отрисовки скина с фильтрацией Sticker и Souvenir
        function renderSkinHTML(id, weapon, skinData, prices) {
          let priceInfoContent = "";
      
          if (Array.isArray(prices)) {
            const isSticker = skinData.name.startsWith("Sticker |");
            const specialStickerKeywords = ["(Lenticular)", "(Foil)", "(Glitter)", "(Reverse)", "(Gold)", "(Holo)"];
      
            const matchedSkins = prices.filter(skin => {
              if (isSticker) {
                return skin.name === skinData.name; // точное совпадение для стикеров
              } else {
                return skin.name.includes(skinData.name); // обычное вхождение для остального
              }
            });
      
            const normalPrices = matchedSkins
              .filter(skin => !skin.name.startsWith("Souvenir"))
              .map(skin => skin.price);
      
            const souvenirPrices = matchedSkins
              .filter(skin => skin.name.startsWith("Souvenir"))
              .map(skin => skin.price);
      
            if (normalPrices.length > 0) {
              normalPrices.sort((a, b) => a - b);
              const normalPriceText = normalPrices[0] === normalPrices[normalPrices.length - 1]
                ? `${normalPrices[0].toFixed(2)}$`
                : `${normalPrices[0].toFixed(2)}$ - ${normalPrices[normalPrices.length - 1].toFixed(2)}$`;
              priceInfoContent += `${normalPriceText}`;
            }
      
            if (souvenirPrices.length > 0) {
              souvenirPrices.sort((a, b) => a - b);
              const souvenirPriceText = souvenirPrices[0] === souvenirPrices[souvenirPrices.length - 1]
                ? `${souvenirPrices[0].toFixed(2)}$`
                : `${souvenirPrices[0].toFixed(2)}$ - ${souvenirPrices[souvenirPrices.length - 1].toFixed(2)}$`;
              priceInfoContent += `<div class="souvenir-price-info">${souvenirPriceText}</div>`;
            }
          }
      
          const imageUrl = skinData.image;
          return `
            <div class="skin ${skinData.class}" skin-id="${id}" weapon="${weapon}">
              <img src="${imageUrl}" draggable="false" alt="${skinData.name}">
              <div class="skin-desc-name">${skinData.name}</div>
              ${priceInfoContent ? `<div class="skin-price-info">${priceInfoContent}</div>` : ""}
            </div>
          `;
        }
      })();
          
    }

});

if (
  window.location.pathname.includes("/items/") ||
  window.location.pathname.includes("/cases/") ||
  window.location.pathname.includes("/stickers/") ||
  window.location.pathname.includes("/collections/")
) {
  const languageTag = document.documentElement.lang || "en";

  async function loadNavDataWithCache() {
    const cacheKey = "topicNavCache";
    const cacheTimeKey = "topicNavCache-time";
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const maxAge = 1000 * 60 * 60 * 24;

    if (cached && cachedTime && (Date.now() - cachedTime < maxAge)) {
      return JSON.parse(cached);
    }

    const response = await fetch("/code-parts/topics/topics-nav-items.json");
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(cacheTimeKey, Date.now().toString());
    return data;
  }

  function createCategoryDOM(category, isMobileView) {
    const container = document.createElement("div");
    container.classList.add("weapon-container");

    const current = document.createElement("div");
    current.classList.add("weapon-current");

    const currentName = isMobileView && languageTag === "ru" ? category["name-ru"] || category.name : category.name;

    current.innerHTML = isMobileView
      ? `<span>${currentName}</span><i class="officon oldcarret"></i>`
      : `<img src="${category.image}" draggable="false" alt="${category.alt}">`;

    const list = document.createElement("ul");
    list.classList.add("weapon-selection");

    category.items.forEach(item => {
      const localizedHref = languageTag === "ru" && !item.link.startsWith("/ru/")
        ? `/ru${item.link}`
        : item.link;

      list.innerHTML += `
        <li class="weapon-selection-unite">
          <a href="${localizedHref}" class="weapon-selection-redir">
            <img src="${item.image}" draggable="false" alt="${item.name}">
            <span>${item.name}</span>
          </a>
        </li>
      `;
    });

    container.appendChild(current);
    container.appendChild(list);
    return container;
  }

  loadNavDataWithCache().then(async data => {
    const topicTopPanel = document.querySelector("div.sitetoppannel");
    const topicPage = document.querySelector("div.topicpage");
    const isMobileView = window.innerWidth < 1365;

    if (!topicTopPanel || !topicPage) return;

    const navElements = [];

    for (const category of data) {
      if (category["import-items"]) {
        try {
          const importedData = await (await fetch(`/code-parts/topics/${category["import-items"]}.json`)).json();
          const importedItems = importedData.items || [];
          importedItems.sort((a, b) => {
            const parseDate = (str) => {
              const [d, m, y] = str.split(".");
              return new Date(`20${y}`, m - 1, d);
            };
            const dateA = a.date ? parseDate(a.date) : new Date(0);
            const dateB = b.date ? parseDate(b.date) : new Date(0);
            return dateB - dateA;
          });      

          const importType = category["import-items"];
          const pathType = ["autograph-capsules", "sticker-capsules"].includes(importType) ? "stickers" : importType;

          category.items = importedItems.map(item => ({
            name: item.title,
            image: item.img,
            link: `/topic/${pathType}/${item.id}`
          }));
        } catch (e) {
          console.error("Failed to import items from", category["import-items"], e);
          category.items = [];
        }
      }

      navElements.push(createCategoryDOM(category, isMobileView));
    }

    if (isMobileView) {
      const navMenu = document.createElement("div");
      navMenu.classList.add("topic-nav-menu");

      navElements.forEach(el => navMenu.appendChild(el));
      navMenu.appendChild(document.createElement("div")).className = "topic-nav-close";

      const navWrapper = document.createElement("div");
      navWrapper.classList.add("topic-nav-selector");
      navWrapper.appendChild(navMenu);

      topicPage.appendChild(navWrapper);

      // Навигация (открытие / закрытие)
      topicPage.addEventListener("click", function (e) {
        if (e.target.closest(".weapon-current")) {
          const container = e.target.closest(".weapon-container");
          const isActive = container.classList.contains("active");

          document.querySelectorAll(".weapon-container").forEach(c => c.classList.remove("active"));

          if (!isActive) {
            container.classList.add("active");
          }
        }

        if (e.target.closest(".topic-nav-close")) {
          document.querySelector(".topic-nav-selector").classList.remove("active");
          document.querySelectorAll(".weapon-container").forEach(c => c.classList.remove("active"));
          document.querySelector(".topic-nav-box")?.classList.remove("active");
          document.querySelector(".pages")?.classList.remove("hardhidden");
        }

        if (e.target.closest(".topic-nav-box")) {
          const navBox = e.target.closest(".topic-nav-box");
          const navSelector = document.querySelector(".topic-nav-selector");

          const isActive = navBox.classList.contains("active");

          navBox.classList.toggle("active", !isActive);
          navSelector.classList.toggle("active", !isActive);

          document.querySelector(".pages")?.classList.toggle("hardhidden", !isActive);
        }
      });

    } else {
      topicTopPanel.innerHTML = "";
      navElements.forEach(el => topicTopPanel.appendChild(el));
      topicPage.classList.add("fade-in-topic");
    }
  });
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

document.addEventListener("DOMContentLoaded", async function () {
  const res = $(window).width();
  const itemsPerPage = res < 1365 ? 6 : 12;
  const path = window.location.pathname;

  const topicBoxesHolder = document.querySelector(".topic-boxes-holder")
  if (!topicBoxesHolder) return;

  const isStickerCraftsSkinPage = /\/sticker-crafts\/skin\//.test(path);
  const isStickerCraftsListPage = /\/topic\/sticker-crafts(?:\.html)?$/.test(path);
  const isStickerCraftsPage = isStickerCraftsSkinPage || isStickerCraftsListPage;
  
  const itemTypeMatch = path.match(/\/topic\/(?:items-type\/)?(cases|collections|sticker-capsules|autograph-capsules)(?:\.html)?$/);

  const isItemsTypePage = !!itemTypeMatch;
  const itemType = itemTypeMatch ? itemTypeMatch[1] : null;

  let pageData = [];
  let skinBindMap = {};

  // === STICKER CRAFTS ===
  if (isStickerCraftsPage) {
    const pageKey = isStickerCraftsSkinPage ? path.split("/").pop().replace(".html", "") : null;
    try {
      const bindsResponse = await fetch("/code-parts/topics/sticker-crafts-binds.json");
      const bindsData = await bindsResponse.json();
      skinBindMap = bindsData || {};
    } catch (error) {}

    const matchedSkinName = skinBindMap[pageKey];

    try {
      const response = await fetch("/code-parts/topics/sticker-crafts.json");
      const data = await response.json();
      pageData = (isStickerCraftsSkinPage && matchedSkinName)
      ? data.filter(sticker => sticker.skin === matchedSkinName)
      : data;
    } catch (e) {
      console.error("Sticker crafts JSON load error:", e);
      return;
    }

    pageData.forEach(sticker => {
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
          ).join("")}
        </div>
      `;

      topicBoxesHolder.appendChild(topic);
    });

  // === ITEMS-TYPE ===
} else if (isItemsTypePage && itemType) {
  try {
    const response = await fetch(`/code-parts/topics/${itemType}.json`);
    const rawData = await response.json();

    const customPath = rawData.customPath || itemType;
    pageData = rawData.items || rawData;

    // === СОРТИРОВКА ПО ДАТЕ ===
    const hasDates = pageData.some(item => item.date);
    if (hasDates) {
      pageData.sort((a, b) => {
        const parseDate = (str) => {
          const [d, m, y] = str.split(".");
          return new Date(`20${y}`, m - 1, d);
        };
        const dateA = a.date ? parseDate(a.date) : new Date(0);
        const dateB = b.date ? parseDate(b.date) : new Date(0);
        return dateB - dateA;
      });
    }

    pageData.forEach(item => {
      const el = document.createElement("a");
      el.classList.add("topic-box", "items");
      el.href = `/topic/${customPath}/${item.id}`;
      el.innerHTML = `
        <div class="logobg">
          <img src="${item.img}" draggable="false" alt="${item.title}">
        </div>
        <div class="content">
          <span>${item.title}</span>
        </div>
      `;
      topicBoxesHolder.appendChild(el);
    });
    
  } catch (e) {
    console.error("Items-type JSON load error:", e);
    return;
  }
}

(function () {
  const topicBoxesHolder = document.querySelector(".topic-boxes-holder.items-type, .topic-boxes-holder.sticker-crafts") ||
    (["skins", "items", "sticker-crafts"].includes(location.pathname.split("/").pop().replace(".html", "")) &&
      document.querySelector(".topic-boxes-holder"));

  if (!topicBoxesHolder) return;

  const isStickerCrafts = location.pathname.includes("sticker-crafts");
  const cacheKey = "topics-nav-cache";
  const cacheTTL = 1000 * 60 * 60 * 24;
  const now = Date.now();

  const topicFilterContainer = document.createElement("div");
  topicFilterContainer.className = "topic-filter";

  const filterInput = document.createElement("input");
  filterInput.className = "singlemod-box topic-filter-tab";
  filterInput.type = "text";
  filterInput.placeholder = "";
  filterInput.setAttribute("aria-label", "Filter Topic");
  filterInput.setAttribute("autocomplete", "off");
  topicFilterContainer.appendChild(filterInput);

  async function fetchNavButtons() {
    const res = await fetch("/code-parts/topics/topics-nav.json");
    return res.json();
  }

  async function getCachedNavButtons() {
    const cached = localStorage.getItem(cacheKey);
    let parsedCache = cached ? JSON.parse(cached) : null;

    try {
      const freshData = await fetchNavButtons();

      // Сравниваем с кэшем
      const isEqual = JSON.stringify(freshData) === JSON.stringify(parsedCache?.data);

      if (!parsedCache || now - parsedCache.timestamp > cacheTTL || !isEqual) {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: freshData }));
        return freshData;
      }

      return parsedCache.data;
    } catch (err) {
      console.error("Ошибка загрузки topics-nav.json:", err);
      return parsedCache?.data || [];
    }
  }

  getCachedNavButtons().then((navButtons) => {
    const currentHref = location.pathname.replace(/\.html$/, "");
    const bestMatch = navButtons.reduce((acc, btn) => {
      return currentHref.includes(btn.href) && btn.href.length > acc.length ? btn.href : acc;
    }, "");

    navButtons.forEach(btn => {
      const box = document.createElement("div");
      box.className = "singlemod-box";
    
      const title = languageTag === "ru" ? btn["data-title-ru"] || btn.alt : btn.alt;
      box.setAttribute("data-title", title || "");
    
      const link = document.createElement("a");
      link.href = btn.href;
      link.className = "singlemod-select";
    
      const img = document.createElement("img");
      img.src = btn.img;
      img.alt = btn.alt || "";
    
      link.appendChild(img);
      box.appendChild(link);
    
      // Только для самого точного совпадения
      if (currentHref.includes(btn.href) && btn.href === bestMatch) {
        box.classList.add("active");
      }
    
      topicFilterContainer.appendChild(box);
    });

    topicBoxesHolder.insertBefore(topicFilterContainer, topicBoxesHolder.firstChild);
    
    if (languageTag === "ru") {
      updateURLs(topicFilterContainer);
    }
  });

  // === ФИЛЬТРАЦИЯ ===
  filterInput.addEventListener("input", () => {
    const value = filterInput.value.trim().toLowerCase();
    const itemSelector = isStickerCrafts ? ".topic-grandbox.sticker" : ".topic-box";
    const allBoxes = Array.from(topicBoxesHolder.querySelectorAll(itemSelector));
    const paginationHolder = document.querySelector(".pagination-holder");

    if (value !== "") {
      topicBoxesHolder.classList.remove("pagination");
      paginationHolder?.remove();

      allBoxes.forEach((box) => {
        const spanText = isStickerCrafts
          ? box.querySelector(".navigation-section.first span")?.textContent.toLowerCase() || ""
          : box.querySelector("span")?.textContent.toLowerCase() || "";

        const isMatch = spanText.includes(value);

        box.classList.remove("hidden", "fade-in", "visible");
        box.style.animationDelay = "0s";
        box.style.display = isMatch ? "" : "none";

        if (isMatch) {
          box.classList.add("visible_sort");
        } else {
          box.classList.remove("visible_sort");
        }
      });
    } else {
      allBoxes.forEach((box) => {
        box.style.display = "";
        box.classList.add("hidden");
        box.classList.remove("fade-in", "visible", "visible_sort");
      });

      topicBoxesHolder.classList.add("pagination");

      if (!document.querySelector(".pagination-holder")) {
        const newPagination = document.createElement("div");
        newPagination.className = "pagination-holder";
        topicBoxesHolder.appendChild(newPagination);
      }

      if (typeof setupPagination === "function") {
        setupPagination();
      }
    }
  });
})();




  if (pageData.length > itemsPerPage) {
    topicBoxesHolder.classList.add("pagination");
  }

  setupPagination();

  // === PAGINATION ===
  function setupPagination() {
    const isSticker = isStickerCraftsPage;
    const itemSelector = isSticker ? ".topic-grandbox.sticker" : ".topic-box";
    const boxTopics = Array.from(topicBoxesHolder.querySelectorAll(itemSelector));
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

    function updatePaginationButtons(activePage) {
      paginationHolder.innerHTML = "";
    
      // === Кнопка "влево"
      const prevButton = document.createElement("button");
      prevButton.classList.add("pagination-button", "arrow");
      prevButton.innerHTML = `<i class="officon chevron left"></i>`;
      if (activePage === 1) {
        prevButton.classList.add("disabled");
      } else {
        prevButton.addEventListener("click", () => showPage(activePage - 1));
      }
      paginationHolder.appendChild(prevButton);
    
      // === Цифровые кнопки (максимум 3: текущая и по бокам)
      let startPage = Math.max(1, activePage - 1);
      let endPage = Math.min(totalPages, startPage + 2);
      // Корректируем, если в конце
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
    
      // === Кнопка "вправо"
      const nextButton = document.createElement("button");
      nextButton.classList.add("pagination-button", "arrow");
      nextButton.innerHTML = `<i class="officon chevron right"></i>`;
      if (activePage === totalPages) {
        nextButton.classList.add("disabled");
      } else {
        nextButton.addEventListener("click", () => showPage(activePage + 1));
      }
      paginationHolder.appendChild(nextButton);
    }

      if (languageTag === "ru") {
          updateURLs(topicBoxesHolder);
      }

    // createPaginationButtons();
    showPage(1);

    // === Extra: если sticker-crafts, грузим обложки скинов ===
    if (isSticker) {
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

              $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`).each(function () {
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
    }
  }
});


const topicBoxesHolder = document.querySelector(".topic-boxes-holder");
const backbutton = document.querySelector(".singlemod-box:has(.back-button)");

if (languageTag === "ru") {
    updateURLs(topicBoxesHolder);
    updateURLs(backbutton);
}