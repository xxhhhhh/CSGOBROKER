$(document).ready(function () {
    if (window.location.pathname.includes("/topic/items/") || window.location.pathname.includes("/topic/cases/") || window.location.pathname.includes("/topic/skins/") || window.location.pathname.includes("/topic/sticker-crafts/")) {
    var enabledFiltersState = {};
    var sortState = 'normal';

    $('.sitepage').prepend(`
    <div id="preview-window" class="hidden">
        <div id="preview-showcase">
            <div class="preview-close-button"><i class="bi bi-x"></i></div>
            <div class="preview-buttons">
            <div class="preview-pause-button"><i class="bi bi-pause-fill"></i></div>
            </div>
            <div class="preview-nav-button left"><i class="bi bi-chevron-left"></i></div>
            <div class="preview-nav-button right"><i class="bi bi-chevron-right"></i></div>
            <div id="preview-content"></div>
            <div class="site-searcher-buttons">
                <div class="site-searcher-box" id="Lis-Skins" data-title="Search on Lis-Skins">
                    <div class="site-searcher-logo"><img src="/img/lis-skins-logo.svg" draggable="false" alt="Lis-Skins logo"></div>
                </div>
                <div class="site-searcher-box" id="Tradeit" data-title="Search on Tradeit">
                    <div class="site-searcher-logo"><img src="/img/tradeit-logo.webp" draggable="false" alt="Tradeit logo"></div>
                </div>
                <div class="site-searcher-box" id="BitSkins" data-title="Search on BitSkins">
                    <div class="site-searcher-logo"><img src="/img/bitskins-logo.webp" draggable="false" alt="BitSkins logo"></div>
                </div>
                <div class="site-searcher-box" id="CSMoney" data-title="Search on CSMoney">
                    <div class="site-searcher-logo"><img src="/img/csmoney-logo.webp" draggable="false" alt="CSMoney logo"></div>
                </div>
                <div class="site-searcher-box" id="SkinSwap" data-title="Search on SkinSwap">
                    <div class="site-searcher-logo"><img src="/img/skinswap-logo.webp" draggable="false" alt="SkinSwap logo"></div>
                </div>
                <div class="site-searcher-box" id="Steam" data-title="Search on Steam">
                    <div class="site-searcher-logo"><img src="/img/steam-logo.png" draggable="false" alt="Steam logo"></div>
                </div>
            </div>
        </div>
    </div>
`);

$(document).on('click', '.preview-pause-button', function () {
  const previewContent = $('#preview-content');
  previewContent.toggleClass('paused');
  const icon = $(this).find('i');
  if (previewContent.hasClass('paused')) {
      icon.removeClass('bi-pause-fill').addClass('bi-play-fill');
  } else {
      icon.removeClass('bi-play-fill').addClass('bi-pause-fill');
  }
});

function insertRandomAdsBox() {
  var currentPath = window.location.pathname;

  if (currentPath.includes('/topic/skins/') && currentPath.includes('/ru/') 
  || currentPath.includes('/topic/sticker-crafts/') && currentPath.includes('/ru/') 
  || currentPath.includes('/topic/cases/') && currentPath.includes('/ru/') 
  || currentPath.includes('/topic/items/') && currentPath.includes('/ru/')) {
    var adsFilePath = '/code-parts/topic-ads-ru.html';
} else if (currentPath.includes('/topic/skins/') || currentPath.includes('/topic/cases/') || currentPath.includes('/topic/sticker-crafts/') || (currentPath.includes('/topic/items/'))) {
    var adsFilePath = '/code-parts/topic-ads.html';
} else {
    return;
}

  var xhr = new XMLHttpRequest();
  xhr.open('GET', adsFilePath, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
        var adsBoxesHtml = xhr.responseText;
        var adsBoxes = document.createElement('div');
        adsBoxes.innerHTML = adsBoxesHtml;

        var insertAfterElement = document.querySelector('.box-topic');

        var randomAdsBox = adsBoxes.children[Math.floor(Math.random() * adsBoxes.children.length)];

        insertAfterElement.parentNode.insertBefore(randomAdsBox, insertAfterElement.nextSibling);

        setTimeout(function () {
            setTimeout(function () {
                randomAdsBox.classList.add('active');
            }, 100);
        });
    }
};


  xhr.send();
}

insertRandomAdsBox();


if (document.querySelector('.skin') && window.location.pathname.includes('/topic/')) {
    const skinsOnPage = $('.skin');

    const weaponToSkinIds = {};
    skinsOnPage.each(function() {
        const weapon = $(this).attr('weapon');
        const skinId = $(this).attr('skin-id');
        if (weapon && skinId) {
            if (!weaponToSkinIds[weapon]) {
                weaponToSkinIds[weapon] = [];
            }
            weaponToSkinIds[weapon].push(skinId);
        }
    });

    const filesToLoad = Object.keys(weaponToSkinIds).map(weapon => `/code-parts/skins-list/${weapon}.html`);

    const fetchPromises = filesToLoad.map(file => fetch(file).then(response => response.text()));

    Promise.all(fetchPromises)
        .then(dataArray => {
            const tempContainers = {};

            Object.keys(weaponToSkinIds).forEach((weapon, index) => {
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = dataArray[index];
                tempContainers[weapon] = tempContainer;
            });

            Object.keys(weaponToSkinIds).forEach(weapon => {
                weaponToSkinIds[weapon].forEach(skinId => {
                    const newSkin = $(tempContainers[weapon]).find(`.skin[skin-id="${skinId}"]`)[0];

                    if (newSkin) {
                        const existingSkin = $(`.skin[weapon="${weapon}"][skin-id="${skinId}"]`)[0];
                        if (existingSkin) {
                            $(newSkin).attr('weapon', weapon);

                            $(existingSkin).replaceWith(newSkin);

                            const imgs = $(newSkin).find('img');
                            imgs.each(function() {
                                this.onload = () => {
                                    setTimeout(() => {
                                        $(this).addClass('imported');
                                    }, 10);
                                };
                            });
                        }
                    }
                });
            });
            checkWeaponTypeAvailabilityForItems();
        });
}




    function updateNavigationReset() {
        var enabledFilters = $(".navigation-weapon-type.enabled").length;
        var sortEnabled = $("#Quality-Filter").hasClass("enabled");
        if (enabledFilters === 0 && !sortEnabled) {
            if ($(".topic-centralizer .navigation-reset").length === 0) {
                $(".topic-centralizer").append('<div class="navigation-reset">Reset Navigation</div>');
            }
        } else {
            $(".topic-centralizer .navigation-reset").remove();
        }
    }

    function checkWeaponTypeAvailability() {
        var weaponTypes = ['knives', 'gloves', 'pistols', 'rifles', 'srifles', 'smgs', 'shotguns', 'mguns'];
        weaponTypes.forEach(function (type) {
            var allNotExist = $(".box-skins." + type).toArray().every(function (element) {
                return $(element).hasClass("notexist");
            });
            if (allNotExist) {
                $(".navigation-weapon-type." + type).removeClass("enabled");
                $(".box-skins." + type).addClass("disabled");
            } else {
                $(".navigation-weapon-type." + type).addClass("enabled");
                $(".box-skins." + type).removeClass("disabled");
            }
        });
    }

    function checkWeaponTypeAvailabilityForItems() {
        const skinTypes = ['white', 'lblue', 'blue', 'purple', 'pink', 'red'];
        skinTypes.forEach(function(type) {
            const allNotExist = $(`.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`).toArray().every(function(element) {
                return $(element).hasClass("notexist");
            });

            if (allNotExist) {
                $(`.navigation-weapon-type.${type}`).removeClass("enabled");
                $(`.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`).addClass("disabled");
            } else {
                $(`.navigation-weapon-type.${type}`).addClass("enabled");
                $(`.box-skins-list .skin.${type}, .box-topic .component-interact.${type}`).removeClass("disabled");
            }
        });
    }

    if (languageTag === 'ru') {
      if (document.getElementById('Lis-Skins')) {
          document.getElementById('Lis-Skins').dataset.title = 'Искать на Lis-Skins';
      }
      if (document.getElementById('Tradeit')) {
          document.getElementById('Tradeit').dataset.title = 'Искать в Tradeit';
      }
      if (document.getElementById('BitSkins')) {
          document.getElementById('BitSkins').dataset.title = 'Искать на BitSkins';
      }
      if (document.getElementById('CSMoney')) {
          document.getElementById('CSMoney').dataset.title = 'Искать на CSMoney';
      } 
      if (document.getElementById('SkinSwap')) {
        document.getElementById('SkinSwap').dataset.title = 'Искать на SkinSwap';
    } 
      if (document.getElementById('Steam')) {
          document.getElementById('Steam').dataset.title = 'Искать в Steam';
      }
  }

    function generateSearchUrl(skinName, selectedSite) {
        let href = '';

        switch (selectedSite) {
            case 'Tradeit':
                href = `https://tradeit.gg/csgo/store?search=${encodeURIComponent(skinName)}&aff=csgobroker`;
                break;
            case 'BitSkins':
                href = `https://bitskins.com/market/cs2?search={"order":[{"field":"price","order":"ASC"}],"where":{"skin_name":"${encodeURIComponent(skinName)}"}}&ref_alias=csgobroker`;
                break;
            case 'Steam':
                href = `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(skinName)}`;
                break;
            case 'CSMoney':
                href = `https://cs.money/market/buy/?search=${encodeURIComponent(skinName)}&sort=price&order=asc&utm_source=mediabuy&utm_medium=csgobroker&utm_campaign=market&utm_content=link`;
                break;
            case 'SkinSwap':
                href = `https://skinswap.com/buy?r=csgobroker&search=${encodeURIComponent(skinName)}&appid=730`;
                break;
            default:
                href = `https://lis-skins.ru/market/csgo/?query=${encodeURIComponent(skinName)}&rf=83346597`;
                break;
        }

        return href;
    }

    function showPreviewWindow(element) {
        const previewWindow = document.getElementById('preview-window');
        const previewContent = document.getElementById('preview-content');
        let skinClasses = [];
    
        if ($(element).hasClass('skin')) {
            skinClasses = $(element).attr("class").split(" ");
        } else if ($(element).hasClass('component-interact')) {
            skinClasses = ['component-interact'];
        }
    
        const skinBox = $(element).closest('.box-skins-list, .box-topic');
        const visibleItems = skinBox.find('.skin:not(.disabled), .component-interact:not(.disabled)');
        const totalItems = visibleItems.length;
        const itemName = element.querySelector('.skin-desc-name') ? element.querySelector('.skin-desc-name').textContent.trim() : '';
    
        previewWindow.className = 'preview-window';
        previewContent.innerHTML = element.innerHTML;
        previewWindow.classList.remove('hidden');
        previewWindow.setAttribute('data-current-index', visibleItems.index(element));
        previewWindow.setAttribute('data-total-items', totalItems);
        previewWindow.setAttribute('data-current-box', skinBox.index('.box-skins-list, .box-topic'));
    
        skinClasses.forEach(function (skinClass) {
            if (skinClass !== "skin" && skinClass !== "component-interact") {
                previewWindow.classList.add(skinClass);
            }
        });

        const existingSkinAltInfo = document.querySelector('.skin-alt-info');
        if (existingSkinAltInfo) {
            existingSkinAltInfo.remove();
        }
        
        const weapon = element.getAttribute('weapon');
        const skinAltInfoDiv = document.createElement('a');
        skinAltInfoDiv.className = 'skin-alt-info';
        skinAltInfoDiv.setAttribute('href', languageTag === 'ru' ? `/ru/topic/items/${weapon}` : `/topic/items/${weapon}`);
        skinAltInfoDiv.setAttribute('data-title', languageTag === 'ru' ? `Все Скины на ${weapon}` : `All Skins on ${weapon}`);
        skinAltInfoDiv.innerHTML = '<i class="bi bi-collection-fill"></i>';        
        
        const previewShowcase = document.getElementById('preview-showcase');
        previewShowcase.appendChild(skinAltInfoDiv);        
    
        $(".site-searcher-box").off("click").on("click", function () {
            const selectedSite = this.id;
            let searchName = itemName;
    
            if ($(element).hasClass('component-interact')) {
                searchName = $(element).data('title');
            }
    
            const searchUrl = generateSearchUrl(searchName, selectedSite);
            window.open(searchUrl, '_blank');
        });
    }

    function closePreviewWindow() {
        const previewWindow = document.getElementById('preview-window');
        previewWindow.classList.add('hidden');
        
        const skinAltInfoDiv = document.querySelector('.skin-alt-info');
        if (skinAltInfoDiv) {
            skinAltInfoDiv.remove();
        }
    }

  function switchSkin(direction) {
    const previewWindow = $('#preview-window');
    const currentIndex = parseInt(previewWindow.attr('data-current-index'));
    const currentBoxIndex = parseInt(previewWindow.attr('data-current-box'));
    const currentBox = $('.box-skins-list, .box-topic').eq(currentBoxIndex);
    const visibleItems = currentBox.find('.skin:not(.disabled), .component-interact:not(.disabled)');
    const totalItems = visibleItems.length;
    let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0) {
        newIndex = totalItems - 1;
    } else if (newIndex >= totalItems) {
        newIndex = 0;
    }

    const newSkinElement = visibleItems.eq(newIndex);

    const existingSkinAltInfo = document.querySelector('.skin-alt-info');
    if (existingSkinAltInfo) {
        existingSkinAltInfo.remove();
    }

    showPreviewWindow(newSkinElement[0]);
    previewWindow.attr('data-current-index', newIndex);
    previewWindow.attr('data-total-items', totalItems);
    previewWindow.attr('data-current-box', currentBox.index('.box-skins-list, .box-topic'));
}

$(document).on("click", ".skin", function () {
    showPreviewWindow(this);
});

$(document).on("click", ".component-interact", function () {
    showPreviewWindow(this);
});

$(document).on("click", ".preview-close-button", function () {
    closePreviewWindow();
});

$(document).on("click", "#preview-window", function (e) {
    if ($(e.target).is("#preview-window")) {
        closePreviewWindow();
    }
});

$(document).on("click", ".preview-nav-button.left", function () {
    switchSkin('left');
});

$(document).on("click", ".preview-nav-button.right", function () {
    switchSkin('right');
});


    if (window.location.pathname.includes("/skins/")) {
        $('.close-box-skins').on('click', function () {
            var parentBoxSkins = $(this).closest(".box-skins");
            parentBoxSkins.toggleClass("selected");
            $(".box-skins").not(parentBoxSkins).removeClass("selected");
            var zoomIcon = $(this).find("i");
            zoomIcon.toggleClass("bi-zoom-in bi-zoom-out");
            $(".close-box-skins i").not(zoomIcon).removeClass("bi-zoom-out").addClass("bi-zoom-in");
        });

        $(".box-skins-name").click(function () {
            var parentBoxSkins = $(this).closest(".box-skins");
            parentBoxSkins.toggleClass("selected");
            $(".box-skins").not(parentBoxSkins).removeClass("selected");
            var zoomIcon = $(this).siblings(".close-box-skins").find("i");
            zoomIcon.toggleClass("bi-zoom-in bi-zoom-out");
            $(".close-box-skins i").not(zoomIcon).removeClass("bi-zoom-out").addClass("bi-zoom-in");
        });

        document.addEventListener("DOMContentLoaded", function () {
            var boxSkinsNames = document.querySelectorAll('.box-skins-name');
            boxSkinsNames.forEach(function (boxSkinsName) {
                boxSkinsName.classList.add('visible');
            });
        });

        $(".navigation-weapon-type").click(function () {
            var weaponType = $(this).attr("class").split(" ")[1];
            $(".box-skins." + weaponType).toggleClass("disabled");
            $(this).toggleClass("enabled");
            updateNavigationReset();
        });

        $(".topic-centralizer").on("click", ".navigation-reset", function () {
            $(".box-skins").removeClass("disabled");
            $(".navigation-weapon-type").addClass("enabled");
            $(".box-skins").removeClass("selected");
            $(".topic-centralizer .navigation-reset").remove();
            checkWeaponTypeAvailability();
        });

        checkWeaponTypeAvailability();

    } else if (window.location.pathname.includes("/items/") || window.location.pathname.includes("/cases/")) {
        $(".box-topic").load("/code-parts/micro-parts/box-topic-items.html", function () {
            $(".navigation-weapon-type").click(function () {
                var weaponType = $(this).attr("class").split(" ")[1];
                $(".skin." + weaponType).toggleClass("disabled");
                $(this).toggleClass("enabled");
                enabledFiltersState[weaponType] = $(this).hasClass("enabled");
                updateNavigationReset();
            });
            translateElements(languageTag)
            checkWeaponTypeAvailabilityForItems();

            if (languageTag === 'ru') {
              if (document.getElementById('Quality-Filter') && document.getElementById('Rarity-Toggle')) {
                  document.getElementById('Quality-Filter').dataset.title = 'Сортировка по Редкости';
                  document.getElementById('Rarity-Toggle').dataset.title = 'Показать Редкость';
              }
          }

          function setLocalStorageState(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
          }

          function getLocalStorageState(key, defaultValue) {
            var storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
          }

          var rarityToggleState = getLocalStorageState(
            "RarityToggleState",
            true
          );
          if (rarityToggleState) {
            $(".box-skins-list").addClass("showrarity");
            $("#Rarity-Toggle").addClass("enabled");
          } else {
            $(".box-skins-list").removeClass("showrarity");
            $("#Rarity-Toggle").removeClass("enabled");
          }

          $("#Rarity-Toggle").on("click", function () {
            $(".box-skins-list").toggleClass("showrarity");
            $(this).toggleClass("enabled");
            var isEnabled = $(this).hasClass("enabled");
            setLocalStorageState("RarityToggleState", isEnabled);
          });

          $("#Quality-Filter").click(function () {
            var enabledFilters = $(".navigation-weapon-type.enabled").length;
            if (enabledFilters === 0) {
                return;
            }

                var skins = $(".box-skins-list .skin").get();
                skins.sort(function (a, b) {
                    var aClass = $(a).attr('class').split(' ')[1];
                    var bClass = $(b).attr('class').split(' ')[1];
                    var sortOrder = ['white', 'lblue', 'blue', 'purple', 'pink', 'red', 'gold'];
                    if (sortState === 'none' || sortState === 'reversed') {
                        return sortOrder.indexOf(aClass) - sortOrder.indexOf(bClass);
                    } else {
                        return sortOrder.indexOf(bClass) - sortOrder.indexOf(aClass);
                    }
                });

                $(".box-skins-list").html(skins);

                if (sortState === 'none' || sortState === 'reversed') {
                    sortState = 'enabled';
                    $(this).removeClass("enabled").addClass("reversed");
                } else {
                    sortState = 'reversed';
                    $(this).removeClass("reversed").addClass("enabled");
                }

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
  }
});

if (window.location.pathname.includes("/topic")) {
    var elements = document.querySelectorAll('.box-skins-list');
    elements.forEach(function(element) {
        element.classList.add('visible');
    });
document.addEventListener('DOMContentLoaded', function () {

    if (window.location.pathname.includes("/topic/skins")) {
        var colorList = ["white", "gray", "black", "brown", "red", "orange", "golden", "silver", "yellow", "green", "cyan", "blue", "purple", "pink"];
  
        colorList.forEach(function(color) {
            var bgImage = new Image();
            bgImage.src = "/img/skins/previews/small/example-" + color + ".webp";
            bgImage.onload = function() {
                var elements = document.querySelectorAll("[data-color='" + color + "']");
                elements.forEach(function(element) {
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
        <div class="box-skins-button left hidden"><i class="bi bi-chevron-left"></i></div>
        <div class="box-skins-button right hidden"><i class="bi bi-chevron-right"></i></div>
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
    
    function translateElements(languageTag) {
      if (languageTag === "ru") {
          var translations = {
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
              if (translations.hasOwnProperty(originalText)) {
                  element.textContent = translations[originalText];
              }
          });
      }
  }
  translateElements(languageTag)
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
            var urlnav = '/code-parts/micro-parts/nav-topic-box.html';
            $.get(urlnav, function (data) {
                boxtopic.append(data);

                boxtopic.on('click.topicNav', '.topic-nav-box', function () {
                    toggleActiveClass($(this));
                    toggleActiveClass($('.topic-nav-selector'));
                    $('.pages').addClass('hardhidden');
                });

                boxtopic.on('click.topicNav', '.topic-nav-close', function () {
                    toggleActiveClass($('.topic-nav-selector'));
                    $('.pages').removeClass('hardhidden');
                });

                boxtopic.on('click.topicNav', '.weapon-container', function () {
                    var clickedContainer = $(this);
                    $('.weapon-container').not(clickedContainer).removeClass('active');
                    $('.pages').removeClass('hardhidden');
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
        if ($(window).width() < 1340) {
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
    return window.location.href.includes('/topic/items/') || window.location.href.includes('/topic/cases/');
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