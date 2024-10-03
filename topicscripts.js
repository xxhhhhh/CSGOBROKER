$(document).ready(function () {
    const currentPath = window.location.pathname;
    if (
      currentPath.includes("/topic/items/") ||
      currentPath.includes("/topic/cases/") ||
      currentPath.includes("/topic/collections/") ||
      currentPath.includes("/topic/skins/") ||
      currentPath.includes("/topic/sticker-crafts/")
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

        const filesToLoad = Object.keys(weaponToSkinIds).map(
          (weapon) => `/code-parts/skins-list/${weapon}.html`
        );

        Promise.all(
          filesToLoad.map((file) =>
            fetch(file).then((response) => response.text())
          )
        ).then((dataArray) => {
          const tempContainers = {};
          Object.keys(weaponToSkinIds).forEach((weapon, index) => {
            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = dataArray[index];
            tempContainers[weapon] = tempContainer;
          });

          Object.keys(weaponToSkinIds).forEach((weapon) => {
            weaponToSkinIds[weapon].forEach((skinId) => {
              const newSkin = $(tempContainers[weapon]).find(
                `.skin[skin-id="${skinId}"]`
              )[0];
              const existingSkin = $(
                `.skin[weapon="${weapon}"][skin-id="${skinId}"]`
              )[0];
              if (newSkin && existingSkin) {
                $(newSkin).attr("weapon", weapon);
                $(existingSkin).replaceWith(newSkin);
                $(newSkin)
                  .find("img")
                  .on("load", function () {
                    setTimeout(() => $(this).addClass("imported"), 10);
                  });
              }
            });
          });
          checkWeaponTypeAvailabilityForItems();
        });
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
            `.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`
          )
            .toArray()
            .every((element) => $(element).hasClass("notexist"));
          const navigationType = $(`.navigation-weapon-type.${type}`);

          if (allNotExist) {
            navigationType.removeClass("enabled").addClass("notexist");
            $(
              `.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`
            ).addClass("disabled");
          } else {
            navigationType.addClass("enabled").removeClass("notexist");
            $(
              `.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`
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
        } else if ($(element).hasClass("component-interact")) {
          skinClasses = ["component-interact"];
        }

        const skinBox = $(element).closest(".box-skins-list, .box-topic");
        const visibleItems = skinBox.find(
          ".skin:not(.disabled), .component-interact:not(.disabled)"
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
          if (!["skin", "component-interact"].includes(skinClass)) {
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
            const searchName = $(element).hasClass("component-interact")
              ? $(element).data("title")
              : itemName;
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
        const currentBox = $(".box-skins-list, .box-topic").eq(currentBoxIndex);
        const visibleItems = currentBox.find(
          ".skin:not(.disabled), .component-interact:not(.disabled)"
        );
        const totalItems = visibleItems.length;
        let newIndex =
          direction === "left" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0) newIndex = totalItems - 1;
        else if (newIndex >= totalItems) newIndex = 0;

        showPreviewWindow(visibleItems.eq(newIndex)[0]);
        previewWindow.attr("data-current-index", newIndex);
      }

      $(document).on("click", ".skin, .component-interact", function () {
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

    if (boxSkinsList.scrollWidth > boxSkinsList.clientWidth) {
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
});

    const colorBoxes = document.querySelectorAll('.color-box-selection-button');
    const colorList = document.getElementById('color-list');
  
    colorBoxes.forEach(box => {
      box.addEventListener('click', () => {
        box.classList.toggle('clicked');
        colorList.classList.toggle('active');
      });
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
              "Change Color": "Сменить Цвет"
          };
  
          var elementsToTranslate = document.querySelectorAll('.navigation-weapon-type, .color-box-selection-button');
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