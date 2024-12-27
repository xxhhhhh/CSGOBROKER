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
      currentPath.includes("/topic/cases/") ||
      currentPath.includes("/topic/collections/") ||
      currentPath.includes("/topic/skins/") ||
      currentPath.includes("/topic/guides/") ||
      currentPath.includes("/topic/sticker-crafts/") ||
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

      function insertRandomAdsBox() {

        if (href.endsWith("sticker-crafts") || href.endsWith("sticker-crafts.html")) {
          return;
        }

        let adsFilePath = currentPath.includes("/ru/")
          ? "/code-parts/topic-ads-ru.html"
          : "/code-parts/topic-ads.html";

        fetch(adsFilePath)
          .then((response) => response.text())
          .then((adsBoxesHtml) => {
            const adsBoxes = document.createElement("div");
            adsBoxes.innerHTML = adsBoxesHtml;

            const insertAfterElement = document.querySelector(".box-topic");
            const randomAdsBox =
              adsBoxes.children[
                Math.floor(Math.random() * adsBoxes.children.length)
              ];

            insertAfterElement.parentNode.insertBefore(
              randomAdsBox,
              insertAfterElement.nextSibling
            );

            setTimeout(() => randomAdsBox.classList.add("active"), 100);
          });
      }

      insertRandomAdsBox();

      if ($(".skin").length && currentPath.includes("/topic/")) {
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
                const response = await fetch(`/code-parts/skins-list/${weapon}.json`);
                const skinsData = await response.json();
    
                const skinsForWeapon = skinsData || {};
                weaponToSkinIds[weapon].forEach((skinId) => {
                    const skinData = skinsForWeapon[skinId];
                    if (skinData) {
                        const newSkinHTML = `
                            <div class="skin ${skinData.class}" skin-id="${skinId}" weapon="${weapon}">
                                <img src="${skinData.image}" draggable="false" alt="${skinData.name}">
                                <div class="skin-desc-name">${skinData.name}</div>
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
          
    
            checkWeaponTypeAvailabilityForItems();
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
          )}&r=csgobroker`,
          SkinSwap: `https://skinswap.com/buy?search=${encodeURIComponent(
            skinName
          )}&r=csgobroker&appid=730`,
          default: `https://lis-skins.ru/market/csgo/?query=${encodeURIComponent(
            skinName
          )}&rf=83346597`,
        };
        return siteUrls[selectedSite] || siteUrls["default"];
      }

      function showPreviewWindow(element) {
        const previewWindow = $("#preview-window");
        const previewContent = $("#preview-content");
        let skinClasses = [];

        previewWindow.attr("class", "hidden");

        if ($(element).hasClass("skin")) {
          skinClasses = $(element).attr("class").split(" ");
        }

        const skinBox = $(element).closest(".box-skins-list, .box-topic");
        const visibleItems = skinBox.find(
          ".skin:not(.disabled)"
        );
        const totalItems = visibleItems.length;
        const itemName = element.querySelector(".skin-desc-name")
          ? element.querySelector(".skin-desc-name").textContent.trim()
          : "";

        previewWindow.removeClass("hidden").attr({
          "data-current-index": visibleItems.index(element),
          "data-total-items": totalItems,
          "data-current-box": skinBox.index(".box-skins-list, .box-topic"),
        });

        skinClasses.forEach((skinClass) => {
          if (!["skin"].includes(skinClass)) {
            previewWindow.addClass(skinClass);
          }
        });

        previewContent.html(element.innerHTML);
        previewWindow.find(".skin-alt-info").remove();

        const weapon = element.getAttribute("weapon");
        const skinAltInfoDiv = $("<a>", {
          class: "skin-alt-info",
          href:
            languageTag === "ru"
              ? `/ru/topic/items/${weapon}`
              : `/topic/items/${weapon}`,
          "data-title":
            languageTag === "ru"
              ? `Все Скины на ${weapon}`
              : `All Skins on ${weapon}`,
          html: '<i class="officon library"></i>',
        });

        $("#preview-showcase").append(skinAltInfoDiv);

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
      }

      function switchSkin(direction) {
        const previewWindow = $("#preview-window");
        const currentIndex = parseInt(
          previewWindow.attr("data-current-index"),
          10
        );
        const currentBoxIndex = parseInt(
          previewWindow.attr("data-current-box"),
          10
        );
        const currentBox = $(".box-skins-list, .box-topic, .character-box").eq(currentBoxIndex);
        const visibleItems = currentBox.find(
          ".skin:not(.disabled)"
        );
        const totalItems = visibleItems.length;
        let newIndex =
          direction === "left" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0) newIndex = totalItems - 1;
        else if (newIndex >= totalItems) newIndex = 0;

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
          $(this).find("i").toggleClass("zoom-in zoom-out");
          $(".close-box-skins i")
            .not($(this).find("i"))
            .removeClass("zoom-out")
            .addClass("zoom-in");
        });

        $(".box-skins-name").click(function () {
          const parentBoxSkins = $(this).closest(".box-skins");
          parentBoxSkins.toggleClass("selected");
          $(".box-skins").not(parentBoxSkins).removeClass("selected");
          $(this)
            .siblings(".close-box-skins")
            .find("i")
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
      } else if (
        currentPath.includes("/items/") ||
        currentPath.includes("/cases/") ||
        currentPath.includes("/collections/")
      ) {
        $(".box-topic").load(
          "/code-parts/micro-parts/box-topic-items.html",
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
              if (qualityFilter && rarityToggle) {
                qualityFilter.dataset.title = "Сортировка по Редкости";
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
    }
});

if (window.location.pathname.includes("/items/") || window.location.pathname.includes("/cases/") || window.location.pathname.includes("/collections/")) {
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
                bgImage.src = "/img/skins/previews/small/example-" + color + ".webp";
                bgImage.onload = function() {
                    var skinslist = document.querySelectorAll("[data-color='" + color + "']");
                    skinslist.forEach(function(element) {
                        element.style.backgroundImage = "url(" + bgImage.src + ")";
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
                "Expensive": "Дорого",
                "Cheap": "Дешево",
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
        var boxtopic = $('.boxtopic');
        if (boxtopic.length) {
            var urlnav = languageTag === 'ru' 
                ? '/code-parts/micro-parts/nav-topic-box-ru.html' 
                : '/code-parts/micro-parts/nav-topic-box.html';
            
            $.get(urlnav, function (data) {
                boxtopic.append(data);
    
                boxtopic.on('click.topicNav', '.topic-nav-box', function () {
                    var topicNavBox = $(this);
                    toggleActiveClass(topicNavBox);
                    
                    if (topicNavBox.hasClass('active')) {
                        $('.pages').addClass('hardhidden');
                    } else {
                        $('.pages').removeClass('hardhidden');
                    }
    
                    toggleActiveClass($('.topic-nav-selector'));
                });
    
                boxtopic.on('click.topicNav', '.topic-nav-close', function () {
                    toggleActiveClass($('.topic-nav-selector'));
                    $('.pages').removeClass('hardhidden');
                    $('.topic-nav-box').removeClass('active');
                });
    
                boxtopic.on('click.topicNav', '.weapon-container', function () {
                    var clickedContainer = $(this);
                    $('.weapon-container').not(clickedContainer).removeClass('active');
                    toggleActiveClass(clickedContainer);
                });
            });
        }
    }
    
    

    function deinitializeBoxTopic() {
        var boxtopic = $('.boxtopic');
        if (boxtopic.length) {
            boxtopic.off('.topicNav');
            $('.topic-nav-selector').remove();
            $('.topic-nav-box').removeClass('active');
            boxtopic.data('initialized', false);
        }
    }

    function checkWindowSize() {
        if ($(window).width() < 1365) {
            if (isTopicItemsLink() && !$('.boxtopic').data('initialized')) {
                initializeBoxTopic();
                $('.boxtopic').data('initialized', true);
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
    return window.location.href.includes('/topic/items/') || window.location.href.includes('/topic/cases/') || window.location.href.includes('/topic/collections/');
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
  const languageTag = document.documentElement.lang || 'en';
  const topicUrl = languageTag === 'ru' 
      ? '/ru/topic/sticker-crafts.html' 
      : '/topic/sticker-crafts.html';

  async function importStickerCrafts() {
      try {
          const response = await fetch(topicUrl);
          if (!response.ok) {
              return;
          }

          const text = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');

          const topicBoxesHolder = doc.querySelector('.topic-boxes-holder');
          if (!topicBoxesHolder) {
              return;
          }

          const boxTopics = Array.from(topicBoxesHolder.querySelectorAll('.box-topic'));
          if (boxTopics.length === 0) {
              return;
          }

          const currentPageSpan = document.querySelector('.siteblock .box-topic .navigation-section.first span');
          const currentPageText = currentPageSpan ? currentPageSpan.textContent.trim() : '';

          const filteredTopics = boxTopics.filter(box => {
              const span = box.querySelector('.navigation-section.first span');
              const spanText = span ? span.textContent.trim() : '';
              return spanText !== currentPageText;
          });

          if (filteredTopics.length === 0) {
              return;
          }

          const randomTopics = filteredTopics.sort(() => 0.5 - Math.random()).slice(0, 5);

          const skinInspectPlaceholder = document.querySelector('.skininspect-placeholder');
          const craftingTable = document.querySelector('.crafting-table');

          if (!craftingTable) {
              return;
          }

          const stickerCraftsList = document.createElement('div');
          stickerCraftsList.classList.add('sticker-crafts-list');

          randomTopics.forEach(box => {
              stickerCraftsList.appendChild(box.cloneNode(true));
          });

          if (skinInspectPlaceholder) {
              skinInspectPlaceholder.insertAdjacentElement('afterend', stickerCraftsList);
          } else {
              craftingTable.insertAdjacentElement('afterend', stickerCraftsList);
          }

          setTimeout(() => {
              stickerCraftsList.classList.add('imported');
          }, 150);

      } catch (error) {
          return;
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

// Проверяем, что скрипт выполняется только на страницах с "/topic/skins/"
if (window.location.pathname.includes('/topic/skins/')) {
  document.addEventListener('DOMContentLoaded', () => {
    const colorsBox = document.querySelector('.colors-box-selection');

    // Если элемент .colors-box-selection существует
    if (colorsBox) {
      // Проверяем, есть ли внутри <ul id="color-list"> и удаляем, если есть
      const existingColorList = colorsBox.querySelector('#color-list');
      if (existingColorList) {
        existingColorList.remove();
      }

      // Определяем, какой файл нужно импортировать
      const pathAfterSkins = window.location.pathname.split('/topic/skins/')[1];
      let fileName = 'skins-color-list.html'; // По умолчанию

      if (pathAfterSkins.startsWith('cheapest')) {
        fileName = 'cheap-skins-color-list.html';
      } else if (pathAfterSkins.startsWith('best')) {
        fileName = 'expensive-skins-color-list.html';
      }

      // Создаем элемент <link> для импорта HTML
      const importUrl = `/code-parts/micro-parts/topic-color-lists/${fileName}`;
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

          // Убедимся, что <ul id="color-list"> присутствует в импортированном файле
          if (importedContent) {
            colorsBox.appendChild(importedContent);
          } else {
            console.error(`No <ul id="color-list"> found in ${fileName}`);
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

    // Расширенная логика для .topic-box и .skins-category-switch
    const topicBox = document.querySelector('.topic-box');
    if (topicBox) {
      const logoBg = topicBox.querySelector('.logobg');
      const dataColor = logoBg ? logoBg.getAttribute('data-color') : null;

      if (dataColor) {
        // Работа с .skins-category-switch
        const categorySwitchContainer = document.querySelector('.skins-category-switch');
        if (categorySwitchContainer) {
          const categorySwitches = categorySwitchContainer.querySelectorAll('div.category-switch');
          categorySwitches.forEach((switchElement, index) => {
            const hrefBase = index === 0
              ? `/topic/skins/cheapest-${dataColor}-skins`
              : `/topic/skins/best-${dataColor}-skins`;

            // Меняем div на a
            const anchor = document.createElement('a');
            anchor.textContent = switchElement.textContent;
            anchor.href = hrefBase;
            anchor.className = switchElement.className;

            // Добавляем обработчик клика для добавления класса "clicked"
            anchor.addEventListener('click', (e) => {
              e.preventDefault();
              categorySwitchContainer.querySelectorAll('a').forEach(el => el.classList.remove('clicked'));
              anchor.classList.add('clicked');
            });

            switchElement.replaceWith(anchor);
          });
        }

        // Работа с .color-box-overview-button
        const overviewButton = document.querySelector('.color-box-overview-button');
        if (overviewButton) {
          overviewButton.href = `/topic/skins/${dataColor}-skins`;
        }
      }
    }
  });
}
