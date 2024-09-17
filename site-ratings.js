var ratings = {
    "csgo500": 4.875,
    "500 Casino": 4.875,
    "CSGOFast":4,
    "Gamdom": 4.25,
    "CSGOEmpire":4,
    "CSFAIL":3.5,
    "CSGORUN":3.5,
    "CSGOLuck":4.125,
    "Key-Drop":3.5,
    "xplay":4.5,
    "InsaneGG":3.5,
    "DatDrop":3.5,
    "HellStore":2.875,
    "CSGOStake":2.875,
    "CSGOPOSITIVE":3.875,
    "Hellcase":3.375,
    "Bounty Stars":3,
    "CSGOBIG":3.125,
    "KNIFEX":3,
    "SkinSwap":4.5,
    "Tradeit":4.625,
    "Lis-Skins":4.125,
    "SKINFANS":3,
    "csgo-skins":3,
    "CSGORoll":4,
    "ClashGG":4,
    "FlameCases":3.375,
    "DaddySkins":3.5,
    "Duelbits":4.125,
    "Rollbit":4,
    "FarmSkins":2.625,
    "Bets4.pro":3.375,
    "RustMagic":3.5,
    "Rustly":3.625,
    "CS.Money":4.5,
    "RAPIDSKINS":3.125,
    "Aim.market":4,
    "SKINBOX":3.5,
    "Moon.Market":3.875,
    "vvvgamers":3.375,
    "GameTame":2.875,
    "banditcamp":4.125,
    "GrindBux":3.5,
    "Earnweb":3.25,
    "RustClash":4,
    "RustStake":4,
    "HowlGG":4.25,
    "SkinCashier":4.125,
    "Shuffle":3.625,
    "RustyPot":3.5,
    "RustBet":3,
    "Rustyloot":3.5,
    "RustChance":3.5,
    "CSGOPolygon":3.375,
    "Skinbet":3.375,
    "RUSTMOMENT":2.75,
    "Idle-Empire":4.5,
    "BCGame":4.5,
    "Freeward":3.375,
    "SteamLevelU":4,
    "Freecash":5,
    "SteamLvlUp":4.5,
    "CYBERSHOKE":4.125,
    "Gamehag":3.875,
    "SteamGifts":4.5,
    "SKINSLY":2.625,
    "SwapGG":3.875,
    "CS.Deals":3.625,
    "DMarket":4.625,
    "LOOT.Farm":3.5,
    "BitSkins":4,
    "ShadowPay":3.5,
    "GamerPay":3.5,
    "CSGO-Market":3.875,
    "SkinBaron":3.5,
    "WhiteMarket":3.5,
    "SkinBid":3.125,
    "iTrade.GG":3.125,
    "Avan.Market":4,
    "LootBear":3.375,
    "Skins.Cash":2.625,
    "RustCases":3.375,
    "SteamLevels":3.5,
    "GGDROP":4,
    "Roobet":4.625,
    "Primedice":4.125,
    "RustBounty":3.25,
    "RustReaper":3.625,
    "CobaltLab":3.75,
    "Splits":3.125,
    "ChickenGG":3.5,
  };
  
  function addStarRating(boxId, rating) {
    var boxElement = document.getElementById(boxId);
    if (boxElement) {
        var starRatingHTML = '<div class="rating-case-single">';
        starRatingHTML += '<div class="star_rating"><i class="bi bi-star-fill"></i></div>';
        starRatingHTML += '<div class="rating-summ">' + rating.toFixed(2) + '</div>';
        starRatingHTML += '</div>';
        var logobgElement = boxElement.querySelector('.logobg');
        if (logobgElement) {
            logobgElement.innerHTML += starRatingHTML;
        }
    }
}

var boxesHolder = document.querySelector('.boxes-holder, .sitealternatesboxes');
if (boxesHolder) {
    for (var boxId in ratings) {
        addStarRating(boxId, ratings[boxId]);
    }
}
