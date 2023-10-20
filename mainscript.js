function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}


  function extractLanguageTagFromURL(pathname) {
    var matches = pathname.match(/^\/([a-z]{2})(\/|\.html)?/i);
    if (matches && matches.length > 1) {
      return matches[1];
    }
    return "";
  }

var languageTag = extractLanguageTagFromURL(window.location.pathname);

function translateURLs(parentElement, language) {
  console.log("Translating for language: ", language); // Убедимся, что функция вызывается с правильным языком
  var translations = {
    "hi": {
      "CSGO500 probably the best CS2 Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, संभवतः सर्वश्रेष्ठ CS2 जुआ साइट है। नियमित वर्षवृष्टि, गिफ्टवे और प्रोमोकोड्स। आप कई खेल और स्लॉट्स खेल सकते हैं।",
      "CSGO500 probably the best CS2 and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, संभवतः सर्वश्रेष्ठ CS2 जुआ साइट है। नियमित वर्षवृष्टि, गिफ्टवे और प्रोमोकोड्स। आप कई खेल और स्लॉट्स खेल सकते हैं।",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll एक लोकप्रिय साइटों में से एक है। जिसमें रूलेट, क्रैश और और भी कई खेल शामिल हैं। अब ई-स्पोर्ट्स बेटिंग का परीक्षण हो रहा है।",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire एक प्रसिद्ध साइटों में से एक है। जिसमें रूलेट और कॉइनफ्लिप शामिल हैं। 2016 से कार्यरत है। प्राथमिकता में मैच बेटिंग है।",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon CSGODouble की तरह एक पुरानी साइट है जिसमें क्लासिक रूलेट है, लेकिन डाइस, क्रैश, स्लॉट्स और इसी साथ ई-स्पोर्ट्स बेटिंग भी है!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino अपने भीतरी खेलों, अभिनव सामाजिक एंगेजमेंट, प्रमाणित निष्पक्ष तंत्र और ऑनलाइन गेमिंग में अच्छी प्रतिष्ठा के साथ विविधता प्रदान करने वाली एक प्लेटफॉर्म है।",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE एक प्रसिद्ध ई-स्पोर्ट्स बेटिंग साइट है जिसमें दिलचस्प कैशबैक सिस्टम है, आप स्किन या पैसे पर बेट कर सकते ह",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit एक नया कैसीनो साइट है जिसमें स्पोर्ट्स बेटिंग और रूलेट जैसे क्लासिक खेल शामिल हैं। रोजाना बोनस भी मिलते हैं!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "CSGOLuck एक लाइसेंसधारक CSGO स्किन जुआ साइट है जो कई जमा विधियों को स्वीकार करती है, विभिन्न खेल और एक उपयोगकर्ता-मित्रीपूर्ण डिज़ाइन प्रदान करती है।",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits एक सुरक्षित और लाइसेंस प्राप्त ऑनलाइन कैसीनो है जिसमें विभिन्न खेल, स्पोर्ट्स बेटिंग, ई-स्पोर्ट्स बेटिंग और तत्काल क्रिप्टोकरेंसी सौदों की सुविधा है।",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG एक ऑनलाइन प्लेटफॉर्म है जो पेशेवर डिज़ाइन की गई और सुविधाजनक एनिमेशन के साथ CSGO स्किन जुआ खेलने की विभिन्न गेम्स प्रदान करती है।",
      "Rustix - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - CS2 और Rust के लिए एक जुआ प्लेटफॉर्म है जिसमें मूलभूत खेल, निष्पक्ष गेमप्ले, बोनस और अद्भुत एनिमेशन शामिल हैं। 2023 में खुला है।",
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": "CSGO-Skins एक प्रमाणित ऑनलाइन प्लेटफॉर्म है जहां उपयोगकर्ता विशेष रूप से तैयार किए गए CS2 केस खोल सकते हैं और दैनिक गिवअवे में भाग ले सकते हैं।",
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": "एक ऑनलाइन प्लेटफॉर्म है जो उपयोगकर्ताओं को CS2 और Dota 2 के लिए केस खोलने की अनुमति देता है। 2017 में शुरू किए जाने के बाद, वेबसाइट विभिन्न सुविधाएं प्रदान करता है।",
      "KNIFEX is a CS2 gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX एक CS2 जुआ साइट है जो केस खोलने, केस युद्ध, कॉइनफ्लिप, क्रैश, क्लैश और बहुत कुछ जैसे खेल मोड्स की विभिन्नता प्रदान करता है!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS2. Its most prominent feature is the case-opening battles.": "DatDrop एक वेबसाइट है जो CS2 से स्किन्स शामिल करने वाले केस खोलने पर विशेषाधिकार रखती है। इसकी सबसे प्रमुख विशेषता केस खोलने की युद्ध है।",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins एक मान्य CSGO केस खोलने वेबसाइट है जो 2017 से संचालित हो रही है और इसमें केस खोलने, केस युद्ध और अपग्रेडर शामिल हैं।",
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg एक नया CS2 जुआ साइट है जिसमें रूलेट, अपग्रेडर, केस और बहुत कुछ जैसे बहुत सारे खेल शामिल हैं!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore एक प्लेटफॉर्म है जो मुद्रा और व्हील जैसे खेल मोड्स के माध्यम से CSGO स्किन बेटिंग में भाग लेने की सुविधा प्रदान करती है।",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": "Hellcase एक ऑनलाइन प्लेटफॉर्म है जो CS2, Dota 2 और Rust जैसे विभिन्न खेलों के लिए स्किन्स और आइटम्स से भरे हुए वर्चुअल केस खरीदने की अनुमति देती है।",
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG - CS2 स्किन्स के साथ जैकपॉट, कॉइनफ्लिप, रूलेट, केस और केस युद्ध जैसे खेल मोड्स के साथ एक जुआ साइट। 2015 में शुरू हुआ है।",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast एक CSGO स्किन्स जुआ साइट है जो विभिन्न अनन्य खेल मोड्स प्रदान करती है। सबसे पहले CSGO जुआ साइटों में से एक।",
      "CSGOLive is a safe and legitimate CS2 case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive एक सुरक्षित और वैध CS2 केस खोलने वेबसाइट है जिसमें कस्टम केस, दैनिक बोनस और एक Provably Fair सिस्टम है।",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins एक विश्वसनीय और लोकप्रिय ऑनलाइन प्लेटफॉर्म है जो अद्वितीय खेल, दैनिक रिवॉर्ड और एक सरल पंजीकरण प्रक्रिया प्रदान करता है।",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop एक प्रमुख ऑनलाइन जुआ प्लेटफॉर्म है जो केस युद्ध और अपग्रेडर के अलावा कस्टम CSGO स्किन केस भी प्रदान करता है।",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins एक प्रसिद्ध CSGO केस खोलने वेबसाइट है जो दैनिक रिवॉर्ड, प्रोमो कोड और केस युद्ध जैसी विशेषताएं प्रदान करती है।",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": "एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को इस्पोर्ट्स मैचों पर सट्टे लगाने की क्षमता प्रदान करती है, विशेष रूप से CS2, Dota 2, Valorant और बहुत सारे अन्य मैचों के लिए।",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!": "इस साइट को अपने समकक्षों के बीच लगभग अपूर्व कहा जा सकता है क्योंकि इसमें उच्च भुगतान और नियमित प्रचार की सुविधा होती है। रोजाना बोनस भी शामिल करें!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games.": "HowlGG एक Rust स्किन जुआ प्लेटफ़ॉर्म है जो जैकपॉट, कॉइनफ्लिप, स्लॉट्स और लाइव कैसीनो खेल समेत विभिन्न खेल प्रदान करता है।",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip.": "BanditCamp एक Rust स्किन जुआ वेबसाइट है जो व्हील ऑफ़ फ़ॉर्च्यून, केस अनबॉक्सिंग और कॉइनफ्लिप जैसे कई Rust थीम के खेल मोड प्रदान करती है।",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016.": "GCSkins एक प्रसिद्ध मोबाइल ऐप और वेबसाइट है जो ऑनलाइन कार्यों को पूरा करने के बदले में CSGO स्किन और आइटम प्रदान करती है। 2016 से उपलब्ध है।",
      "GrindBux is a trusted platform when you can earn some money by completing surveys or play mobile and desktop games.": "GrindBux एक विश्वसनीय प्लेटफ़ॉर्म है जहां आप सर्वेक्षण पूरा करके या मोबाइल और डेस्कटॉप खेलों का खेलकर कुछ पैसे कमा सकते हैं।",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games.": "2017 से चल रही एक Rust स्किन जुआ साइट। इस प्लेटफ़ॉर्म पर लोकप्रिय खेलों की एक विस्तृत विकल्प सुविधा है, जिसमें हाई-रोलर जैकपॉट और कॉइनफ्लिप खेल शामिल हैं।",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly.": "RustBet - विश्वसनीय जुआ साइट, पुरस्कार के रूप में Rust स्किन्स। जैकपॉट, कॉइनफ्लिप और स्किन अपग्रेडर खेल। साफ नाम, SSL एन्क्रिप्शन, उपयोगकर्ता के लिए सुविधाजनक।",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": "RustStake एक Rust स्किन जुआ प्लेटफ़ॉर्म है जो जैकपॉट और कॉइनफ्लिप समेत विभिन्न खेल प्रदान करता है। आसानी से खेलों से आइटम को दाखिल और निकाल सकते हैं।",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods.": "वास्तव में, स्टीम के माध्यम से कमाई के लिए साइटों का पितामह, इसके वापसी विधियों के विशाल चयन के लिए मशहूर है।",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable.": "RustyLoot व्हील, प्लिंको और अन्य खेल समेत विविधता प्रदान करता है। अपने पारदर्शी और सत्यापन योग्य सिस्टम के साथ, RustyLoot सुरक्षित और मजेदार है।",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.": "RustChance 2017 से संचालित हो रहा है और जैकपॉट, व्हील, कॉइनफ्लिप, क्रैश और लैंडमाइंस समेत कई लोकप्रिय खेल प्रदान करता है।",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.": "CrashGG Rust स्किन जुआ पर ध्यान केंद्रित होता है और इसमें इसकी प्रमुख विशेषता, क्रैश गेम मोड समेत विभिन्न खेल प्रदान करता है। यहां द्वंद्व, ब्लैकजैक और लॉटरी भी हैं।",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.": "HypeUp दो प्रसिद्ध बेटिंग साइटों, CSGORoll और HypeDrop के समान ऑपरेटर्स के द्वारा स्वामित्व में है। इसमें दो मूलभूत खेल और लाइव गेम के साथ स्लॉट्स प्रदान की जाती है।",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.": "वेबसाइट पर उचित संख्या में सर्वेक्षण प्रदाता और ऑफरवॉल साझेदार हैं जिन्हें चुना जा सकता है, और कमाई को निकासी के लिए कई विकल्प हैं।",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS2 and Rust. Owned and operated by RustySell.": "एक ऑनलाइन प्लेटफ़ॉर्म है जो खिलाड़ियों को CS: GO और Rust जैसे प्रसिद्ध खेलों के स्किन को विनिमय और बेचने की अनुमति देता है। RustySell द्वारा स्वामित्व और संचालित होता है।",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.": "CSGOSelly एक वेबसाइट है जो उपयोगकर्ताओं को विभिन्न भुगतान विधियों के माध्यम से अपने CSGO स्किन को पैसे में बदलने की अनुमति देती है। इसे 2021 में स्थापित किया गया था।",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.": "एक अद्वितीय साइट जहां आप विभिन्न मोबाइल गेमिंग साइबर विषयों में खेल जीतकर पैसे कमा सकते हैं। इसके अलावा कई ऑफरवॉल्स भी हैं।",
      "Mobile Games. Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"एक अद्वितीय साइट जहां आप विभिन्न मोबाइल गेमिंग साइबर विषयों में खेल जीतकर पैसे कमा सकते हैं। इसके अलावा कई ऑफरवॉल्स भी हैं।",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.": "RustMoment एक रस्ट स्किन प्रशंसकों के लिए एक जुआ साइट है जिसमें छह खेल, बोनस और एक रेकबैक सिस्टम होता है। इसमें मानक और क्रिप्टोकरेंसी भुगतान स्वीकार किए जाते हैं।",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos." : "Freeward एक GPT साइट है जो सर्वेक्षण और वीडियो देखकर जैसे कार्यों के माध्यम से उपयोगकर्ताओं को पुरस्कार कमाने के विभिन्न अवसर प्रदान करती है।",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe." : "Roobet एक ऑनलाइन कैसीनो है जो उपयोगकर्ताओं को क्रिप्टोकरेंसी का उपयोग करके खेल खेलने की अनुमति देता है। प्लेटफ़ॉर्म का विश्वासयोग्य और सुरक्षित होने का प्रमाण है।",
      "xplay is a platform that allows CS2 players to earn skins just by playing on their servers. The platform offers various servers and daily challenges." : "xplay एक प्लेटफ़ॉर्म है जो CS2 खिलाड़ियों को उनके सर्वर पर खेलकर स्किन कमाने की सुविधा प्रदान करता है। प्लेटफ़ॉर्म में विभिन्न सर्वर और दैनिक चुनौतियाँ होती हैं।",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations." : "2018 में स्थापित किया गया, यह जैकपॉट, कॉइनफ्लिप और रूलेट खेल प्रदान करता है जिनमें उन्नत सुविधाएं, साबित करने योग्य न्यायता और आकर्षक एनिमेशन होते हैं।",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers." : "GameTame एक GPT साइट है जो विभिन्न गतिविधियों और प्रस्तावों के पूरा करने के लिए पुरस्कार प्रदान करती है। प्लेटफ़ॉर्म विशेष रूप से गेमर्स के लिए डिज़ाइन किया गया है।",
      "Salad is a website that offers users the opportunity to mine wallet and buy giftcards and many more using their computer's processing power." : "Salad एक वेबसाइट है जो उपयोगकर्ताओं को अपने कंप्यूटर की प्रोसेसिंग पावर का उपयोग करके वॉलेट खनन और गिफ्टकार्ड्स खरीदने और बहुत कुछ करने का अवसर प्रदान करती है।",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings." : "Gamehag मालिकों की वेबसाइट। इसमें विभिन्न सर्वेक्षण प्रदाताओं और ऑफरवॉल पार्टनरों की एक अच्छी संख्या होती है जिनमें से चुनने के लिए, कमाई निकालने के लिए कई विकल्प होते हैं।",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources." : "SteamGifts एक वैध वेबसाइट है जो Steam गेम गिवअवे के लिए एक सहायक समुदाय और मददगार संसाधनों के साथ है।",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. By RustChance owners.":"RustCases एक भरोसेमंद Rust जुआ साइट है जिसमें विभिन्न खेल मोड, विशाल संख्या में केस, और स्किन निकासी के विकल्प होते हैं। RustChance के मालिकों द्वारा।",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more !":"RustClash एक नया Rust जुआ साइट है जिसमें रूलेट, अपग्रेडर, केस और अन्य कई खेल शामिल हैं!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.":"BC.Game एक ऑनलाइन कैसीनो और स्पोर्ट्सबुक है जिसे 2017 में लॉन्च किया गया था, जो स्वामित्व वाले और संभावित इंसाफ़ वाले गेम्स सहित 8,000 से अधिक गेम्स प्रदान करता है।",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.":"Primedice एक ऑनलाइन क्रिप्टो डाइस गेम कैसीनो है जो 2013 से संचालन में है। यह जुए के लिए क्रिप्टो का प्रयोग करने वाले पहले प्लेटफ़ॉर्मों में से एक था।",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.": "Tradeit एक ऑनलाइन व्यापार जगत है जो खिलाड़ियों को अवसर प्रदान करता है खेलों की विभिन्न प्रकारों के लिए स्किन व्यापार, खरीद और बेचने का। 2017 से काम कर रहा है।",
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.": "DMarket एक विश्वसनीय और लोकप्रिय बाजार है स्टीम आइटमों के लिए, जिसमें बहुत सारे आइटम उपलब्ध हैं और ट्रस्टपायलट पर सकारात्मक समीक्षाएं हैं।",
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.": "BitSkins एक ऑनलाइन बाजार है खेल की स्किनों के लिए, विशेष रूप से Counter-Strike 2, Dota 2 और Team Fortress 2 के लिए। 2015 में लॉन्च किया गया।",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": "Hellcase द्वारा स्वामित्व में रखा गया सुरक्षित P2P बाजार। SSL एन्क्रिप्टेड, KYC सत्यापन, मित्रतापूर्ण डिज़ाइन, प्रतिस्पर्धी मूल्य निर्धारण, विश्वसनीय व्यापार प्लेटफ़ॉर्म।",
      "BitSkins P2P is an online platform for buying and selling virtual items, with a focus on CS2 skins. The parent company, BitSkins.": "BitSkins P2P एक ऑनलाइन प्लेटफ़ॉर्म है आभासी आइटमों की खरीद और बेच करने के लिए, विशेष रूप से CS2 स्किनों पर ध्यान केंद्रित करता है। मूल कंपनी, BitSkins।",
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improve.": "विश्वसनीय CS2 स्किन प्लेटफ़ॉर्म जिसमें किराए पर मिलने वाली सेवाएं हैं, YouTubers द्वारा समर्थित। सुरक्षित, सीएस: जीओ स्किनों तक सीमित है, शुल्क लागू होता है, और उपयोगकर्ता समीक्षाएं सुधार के लिए संकेत करती हैं।",
      "GamerPay is a trusted platform for buying and selling CS2 skins, with a free selling option, secure transactions, and high-quality skin inspection tool.": "GamerPay एक विश्वसनीय प्लेटफ़ॉर्म है CS2 स्किन खरीद और बेचने के लिए, जिसमें एक मुफ्त बिक्री विकल्प, सुरक्षित लेन-देन और उच्च गुणवत्ता वाला स्किन जांच उपकरण है।",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.": "CSGO Market एक ऑनलाइन P2P बाजार है जो CS2 स्किन खरीद और बेचने के लिए एक सुरक्षित और सुरक्षित प्लेटफ़ॉर्म प्रदान करता है। 2015 में स्थापित किया गया।",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust and Dota 2 skins and items. The platform was founded in 2020.": "Lis-Skins एक लोकप्रिय बाजार है स्टीम आइटमों के लिए, विशेष रूप से CS2, Rust और Dota 2 स्किन और आइटम। प्लेटफ़ॉर्म का स्थापना 2020 में की गई थी।",
      "WhiteMarket is a P2P platform for CS2 skin trading. It offers secure trades, various deposit options, and community engagement.": "WhiteMarket CS2 स्किन ट्रेडिंग के लिए एक P2P प्लेटफ़ॉर्म है। इसमें सुरक्षित व्यापार, विभिन्न जमा विकल्प और समुदाय का सहयोग है।",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS2, Dota 2, Rust, and Team Fortress 2. Working since 2016.": "CS.Deals एक प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को CS2, Dota 2, Rust और Team Fortress 2 जैसे प्रसिद्ध खेलों से स्किन खरीदने, बेचने और व्यापार करने की अनुमति देता है। 2016 से काम कर रहा है।",
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": "SkinBid एक ऑनलाइन बाजार है CS2 स्किन और खेल की आइटमों के लिए, जो एक उपयोगकर्ता-मित्रतापूर्ण इंटरफ़ेस के साथ खरीदने, बेचने और नीलामी की सुविधाएं प्रदान करता है।",
      "Swap.gg is a website that allows users to buy, sell, and trade CS2, Rust , TF2 and other virtual items from various games. Working since 2017.": "Swap.gg एक वेबसाइट है जो उपयोगकर्ताओं को CS2, Rust, TF2 और अन्य विभिन्न खेलों की आभासी आइटम खरीदने, बेचने और व्यापार करने की अनुमति देती है। 2017 से काम कर रहा है।",
      "LOOT.Farm is an online platform that offers users the ability to Trade virtual items from popular games like CS2, Dota 2, Team Fortress 2, and Rust.": "LOOT.Farm एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को CS2, Dota 2, Team Fortress 2 और Rust जैसे प्रसिद्ध खेलों से आभासी आइटम व्यापार करने की क्षमता प्रदान करता है।",
      "SkinBaron is an online platform based in Germany that enables users to buy and sell their CS2 skins. The platform has gained a good reputation.": "SkinBaron जर्मनी में स्थित एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को उनकी CS2 स्किन खरीदने और बेचने की सुविधा प्रदान करता है। प्लेटफ़ॉर्म को एक अच्छी प्रतिष्ठा हासिल हुई है।",
      "Gamdom is one of the best CS2 Match Betting Sites. You can play Roulette, Wheel, Crash, Slots and many more!":"Gamdom एक बेहतरीन CS2 मैच बेटिंग साइटों में से एक है। आप रूलेट, व्हील, क्रैश, स्लॉट और बहुत कुछ खेल सकते हैं!",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS2, Dota 2, RUST, and TF2.": "Avan.Market एक ऑनलाइन प्लेटफ़ॉर्म है जो उपयोगकर्ताओं को CS2, Dota 2, RUST और TF2 जैसे प्रसिद्ध खेलों की गेमिंग स्किन बेचने का अवसर प्रदान करता है।",
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash एक प्रतिष्ठित प्लेटफ़ॉर्म है जिसके पास सकारात्मक समीक्षा, विश्वसनीय ग्राहक सहायता और छह साल से अधिक कार्यकाल है। मूल्य बेहतर नहीं है।",
      "SkinCashier is an online platform that allows players to Instant Sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier एक ऑनलाइन प्लेटफ़ॉर्म है जो खिलाड़ियों को अपने CS2, Rust, Dota 2 और TF2 स्किन को तत्काल बेचने की अनुमति देता है और वास्तविक धन के लिए। 2020 से संचालित हो रहा है।",
      "CYBERSHOKE is a website that provides servers for playing CS2. It offers various servers for players to choose.":"CYBERSHOKE एक वेबसाइट है जो CS2 खेलने के लिए सर्वर प्रदान करती है। यह खिलाड़ियों के लिए विभिन्न सर्वर प्रदान करता है जिन्हें चुनने के लिए।",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "यह साइट स्टीम को आसान बनाने के लिए बनाई गई है, आप स्टीम ट्रेडिंग कार्ड के लिए इमोजी और प्रोफ़ाइल बैकग्राउंड बेचकर तेजी से स्तर बढ़ा सकते हैं।",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "SteamLevelU एक विधि स्वरूपित प्लेटफ़ॉर्म है जिससे आप स्टीम खाता स्तरों को बढ़ाने के लिए स्टीम ट्रेडिंग कार्ड पैक खरीद सकते हैं, जो एसएच लेवल अप के साथ जुड़ा हुआ है।",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "SteamLevels एक उपयोगकर्ता मित्रपूर्ण वेबसाइट है जो आपके स्टीम खाता स्तर को बढ़ाने में मदद करती है। इसे कार्ड पैक खरीदकर और सीएसजीओ स्किन्स स्वीकार करके किया जा सकता है।",
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.":"iTrade.gg एक विश्वसनीय प्लेटफ़ॉर्म है जहां रस्ट स्किन्स की ट्रेडिंग की जा सकती है। उपयोगकर्ता-मित्रपूर्ण डिज़ाइन, मुफ़्त साइन-अप बोनस और दैनिक पुरस्कार एक सुगठित ट्रेडिंग अनुभव बनाते हैं।",
      "Shuffle.com is a comprehensive crypto casino with a unique registration process, original games, a VIP program, and plans for future expansion.":"Shuffle.com एक समग्र क्रिप्टो कैसीनो है जिसमें एक अद्वितीय पंजीकरण प्रक्रिया, मूल खेल, वीआईपी कार्यक्रम और भविष्य के विस्तार के लिए योजनाएं हैं।",
      "CashoutCSGO is a platform solely dedicated to selling CS2 skins for crypto or paypal, offering a convenient conversion service.":"CashoutCSGO एक प्लेटफ़ॉर्म है जो केवल सीएस:गो स्किन्स बेचने के लिए समर्पित है और सुविधाजनक परिवर्तन सेवा प्रदान करती है।",
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.":"महत्वपूर्ण ऑनलाइन बाजार, खेल से उपहार कार्ड तक विशाल विविधता, कम कीमतें, उत्कृष्ट प्रतिष्ठा, सूक्ष्म इंटरफेस, तक 98% छूट.",
      "Withdraw BTC, ETH, LTC or PayPal!":"BTC, ETH, LTC या PayPal निकालें!",
      "Withdraw Money, Skins or Devices!": "धन, स्किन या उपकरण निकालें!",
      "Withdraw BTC, LTC, ETH and many else!":"बीटीसी, एलटीसी, ईटीएच और बहुत सारे अन्य के निकास!",
      "Withdrawal of many types of cryptocurrencies !":"बहुत सारे प्रकार के क्रिप्टोकरेंसीज़ का निकास!",
      "Withdraw CS2 Skins, Crypto or Real Money!": "वापसी करें CS2 स्किन, क्रिप्टो या वास्तविक धन!",
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": "वापसी करें CS2, Dota 2, TF2 या Rust आइटम!",
      "Withdraw CS2 Skins, Crypto or Game Keys!": "वापसी करें CS2 स्किन, क्रिप्टो या गेम कुंजी!",
      "Withdraw CS2 Skins, Crypto or PayPal!": "वापसी करें CS2 स्किन, क्रिप्टो या PayPal!",
      "Withdraw Money, CS2, TF2 or Rust Skins!": "वापसी करें धन, CS2, TF2 या Rust स्किन!",
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": "वापसी करें CS2 स्किन, Dota 2 और H1Z1 आइटम!",
      "Withdraw CS2, Rust Skins and Dota 2 Items!": "वापसी करें CS2, Rust स्किन और Dota 2 आइटम!",
      "Withdraw CS2 Skins, Gift Cards or Crypto!": "CS2 स्किन, गिफ्ट कार्ड या क्रिप्टो को निकालें!",
      "Withdraw Rust Skins or Crypto!": "Rust स्किन या क्रिप्टो को निकालें!",
      "Withdraw Rust Skins and Items!": "Rust स्किन और आइटम को निकालें!",
      "Withdraw CS2 And Rust Skins or Crypto!": "वापसी करें CS2 और Rust स्किन या क्रिप्टो!",
      "Withdraw CS2 Skins or real Money!": "वापसी करें CS2 स्किन या वास्तविक धन!",
      "Withdraw Steam Trading cards or Games.": "वापसी करें Steam ट्रेडिंग कार्ड या गेम्स।",
      "1h, 24h and 7d Giveaways": "1 घंटा, 24 घंटे और 7 दिन के उपहार",
      "24h Giveaway": "24 घंटे का उपहार",
      "3h and 24h Giveaway": "3 घंटे और 24 घंटे का उपहार",
      "Buy Games, Gift Cards and many-many more.": "खेलें, उपहार कार्ड और बहुत-सारा और भी खरीदें।",
      "Daily and Weekly Giveaways": "प्रतिदिनिक और साप्ताहिक उपहार",
      "1h Giveaway": "1 घंटे का उपहार",
      "1h, 24h Giveaways": "1 घंटा, 24 घंटे के उपहार",
      "Rare Giveaways": "दुर्लभ उपहार",
      "Weekly Giveaways": "साप्ताहिक उपहार",
      "Daily Giveaways": "प्रतिदिनिक उपहार",
      "Deposit Required": "जमा आवश्यक",
      "Withdraw USDT, Skins or Real Money!": "वापसी करें USDT, स्किन या वास्तविक धन!",
      "Withdraw Crypto, gift cards or real money!": "क्रिप्टो, गिफ्ट कार्ड या वास्तविक धन को निकालें!",
      "Withdraw Money, CS2 or Rust Skins!": "वापसी करें धन, CS2 या Rust स्किन!",
      "Withdraw Money, Crypto or Skins!": "वापसी करें धन, क्रिप्टो या स्किन!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Rust स्किन, क्रिप्टो या PayPal निकालें!",
      "Withdraw CS2 Skins or Crypto!": "वापसी करें CS2 स्किन या क्रिप्टो!",
      "Withdraw Money, Crypto or PayPal!": "वापसी करें धन, क्रिप्टो या PayPal!",
      "WITHDRAW WITH P2P CS2 SKINS.": "P2P CS2 स्किन के साथ वापसी करें।",
      "Withdraw Real Money or Crypto!": "वापसी करें वास्तविक धन या क्रिप्टो!",
      "Withdraw BTC, ETH, USDT or Tron!": "वापसी करें BTC, ETH, USDT या Tron!",
      "Withdraw CS2 Skins or PayPal!": "वापसी करें CS2 स्किन या PayPal!",
      "Withdraw CS2 Skins and Items!": "वापसी करें CS2 स्किन और आइटम!",
      "Withdraw Steam Trading cards.": "Steam ट्रेडिंग कार्ड वापसी करें।",
      "Withdraw with many-many ways.": "बहुत-सारे तरीकों से निकालें।",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "बिटकॉइन, एथेरियम या लाइटकॉइन को निकालें!",
      "Withdraw Games, GiftCards and many more!": "गेम्स, गिफ्ट कार्ड्स और बहुत कुछ को निकालें!",
      "Withdraw Crypto or Real Money!": "क्रिप्टो या वास्तविक धन को निकालें!",
      "Withdraw Crypto and Gift Cards!": "क्रिप्टो और गिफ्ट कार्ड निकालें!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "BTC, LTC, USDT, USDC या ETH निकालें!",
      "Withdraw CS2 Skins or Items!": "CS2 स्किन या आइटम निकालें!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": "गेम्स, गिफ्ट कार्ड्स या Dota2 और TF2 आइटम निकालें!",
      "Withdraw Games, GiftCards or Donate to Charity!": "गेम्स, गिफ्ट कार्ड्स या चैरिटी को दान करें!",
      "Participate in Giveaways and win Steam Games.": "गिवअवे में भाग लें और स्टीम गेम जीतें।",
      "+360% Deposit Bonus": "+360% जमा बोनस",
      "+100% Deposit Bonus": "+100% जमा बोनस",
      "+10% Deposit Bonus": "+10% जमा बोनस",
      "+5% Deposit Bonus": "+5% जमा बोनस",
      "+1% Deposit Bonus": "+1% जमा बोनस",
      "70 Free Spins": "70 मुफ्त स्पिन",
      "Every 24h Reward": "प्रतिदिन 24 घंटे के बाद इनाम",
      "Daily Case": "प्रतिदिन केस",
      "Daily Faucet": "प्रतिदिन फॉसेट",
      "Daily Roll": "प्रतिदिन रोल",
      "Daily Coins": "प्रतिदिन सिक्के",
      "Faucet and Giveaways": "फॉसेट और उपहार",
      "Daily 0.02$": "प्रतिदिन 0.02$",
      "Daily 0.02$ + Free Case": "प्रतिदिन 0.02$ + मुफ्त केस",
      "360% Deposit Bonus":"360% जमा बोनस",
      "Deposit Bonus":"जमा बोनस",
      "Visit WebSite": "वेबसाइट पर जाएं",
      "Visit WebSite or Copy": "वेबसाइट पर जाएं",
      "100% deposit bonus": "100% जमा बोनस",
      "+3% Sell Bonus": "+3% बेचने का बोनस",
      "5% deposit bonus": "5% जमा बोनस",
      "5 Free Cases": "5 मुफ्त केस",
      "Free 50 Gems": "मुफ्त 50 गेम्स",
      "3 Free Cases": "3 मुफ्त केस",
      "1.5$ For Free": "1.5 डॉलर मुफ्त में",
      "5$ For Free": "5 डॉलर मुफ्त में",
      "Free 5€": "मुफ्त 5€",
      "Free 1.00$": "मुफ्त 1.00 डॉलर",
      "Free 0.90$": "मुफ्त 0.90 डॉलर",
      "Free 0.50$": "मुफ्त 0.50 डॉलर",
      "Free 0.40$": "मुफ्त 0.40 डॉलर",
      "Free 0.30$": "मुफ्त 0.30 डॉलर",
      "Free 0.25$": "मुफ्त 0.25 डॉलर",
      "Free 0.20$": "मुफ्त 0.20 डॉलर",
      "Free 0.15$": "मुफ्त 0.15 डॉलर",
      "Free 0.10$": "मुफ्त 0.10 डॉलर",
      "Free 0.05$": "मुफ्त 0.05 डॉलर",
      "Free Case": "मुफ्त केस",
      "Free 1$": "मुफ्त 1 डॉलर",
      "Big Daily Giveaways": "रोज़ाना बड़े हद तक दिए जाने वाले उपहार",
      "Free Case up to 250$": "250$ तक मुफ्त केस",
      "Daily Giveaway": "रोज़ाना बांटने का इंतेज़ाम",
      "Free 100 Diamonds": "100 मुफ्त हीरे",
      "500 coins": "500 सिक्के मुफ्त",
      "Daily Cases": "रोज़ाना केस",
      "3 Energy Points": "3 ऊर्जा अंक",
      "Free 200 Coins": "200 सिक्के मुफ्त",
      "some free coins": "कुछ मुफ्त सिक्के",
      "Free 2$": "मुफ्त 2 डॉलर",
      "Free spins": "मुफ्त स्पिन",
      "Offerwall": "ऑफरवॉल",
      "x2 Mining Rate": "x2 खनन दर",
      "Games Giveaways": "गेम्स गिवअवे"
    },
    "tr": {
      "CSGO500 probably the best CS2 Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, en iyi CS2 Kumar Sitesi. Düzenli yağmurlar, hediyeler ve promosyon kodları. Birçok oyun ve slot oynayabilirsiniz.",
      "CSGO500 probably the best CS2 and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, en iyi CS2 ve Rust Kumar Sitesi. Düzenli yağmurlar, hediyeler ve promosyon kodları. Birçok oyun ve slot oynayabilirsiniz.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll, en popüler sitelerden biridir. Rulet, crash ve çok daha fazlasını içerir. Şu anda e-spor bahisleri test ediliyor.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire, en popüler sitelerden biridir. Rulet ve coinflip içerir. 2016'dan beri faaliyet gösteriyor. Öncelikli olarak maç bahisleri.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon, klasik Rulet gibi efsanevi bir sitedir, ancak Zarlar, Crash, Slotlar ve hatta e-spor bahisleri de bulunur!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino, birçok içerideki oyun, yenilikçi sosyal etkileşim, ispat edilebilir adil sistem ve çevrimiçi oyunlarda iyi bir üne sahiptir.",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE, geri ödeme sistemine sahip popüler bir e-spor bahis sitesidir. Skinler veya para ile bahis yapabilirsiniz. Çeşitli ödeme seçenekleri mevcuttur.",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit, spor bahislerini ve rulet gibi birçok klasik oyunu içeren yeni bir Casino sitesidir. Günlük bonuslar içerir!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "CSGOLuck, birden fazla para yatırma yöntemini kabul eden lisanslı bir CSGO skin bahis sitesidir ve çeşitli oyunlar ile kullanıcı dostu bir tasarım sunar.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits, çeşitli oyunlar, spor bahisleri, e-spor bahisleri ve anında kripto para işlemleri sunan güvenli ve lisanslı bir çevrimiçi kumarhanedir.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG, profesyonel olarak tasarlanmış ve akıcı animasyonlara sahip bir dizi CSGO skin bahis oyunu sunan bir çevrimiçi platformdur.",
      "Rustix - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - CS2 ve Rust için orijinal oyunlar, adil oyun, bonuslar ve etkileyici animasyonlarla kumar platformu. 2023 yılında açıldı.",
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": "CSGO-Skins, kullanıcıların özel CS2 estuches açabileceği ve günlük çekilişlere katılabileceği saygın bir çevrimiçi platformdur.",
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": "FlameCases, CS2 ve Dota 2 için estuches açma imkanı sağlayan bir çevrimiçi platformdur. 2017'den bu yana hizmet vermektedir.",
      "KNIFEX is a CS2 gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX, kasa açma, kasa savaşları, coinflip, crash, çatışma gibi bir dizi oyun modu sunan bir CS2 kumar sitesidir!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS2. Its most prominent feature is the case-opening battles.": "DatDrop, CS2'dan skin içeren estuches açmaya özgü bir web sitesidir. En önemli özelliği estuche açma savaşlarıdır.",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins, 2017'den beri faaliyet gösteren geçerli bir CSGO estuche açma web sitesidir ve Estuche Açma, Estuche Savaşları ve Upgrader sunar.",
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg, Rulet, Upgrader, Estuches gibi birçok oyunu içeren yeni bir CS2 Kumar sitesidir!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore, Coinflip, Jackpot, Upgrader ve Wheel gibi oyun modlarıyla CSGO skin bahislerine katılmanızı sağlayan bir platformdur.",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": "Hellcase, CS2, Dota 2 ve Rust gibi oyunlar için skin ve eşya dolu sanal estuches satın almanıza olanak sağlayan bir çevrimiçi platformdur.",
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG - CS2 skinleri için Jackpot, Coinflip, Rulet, Estuches ve Estuche Savaşları gibi oyun modlarına sahip bir kumar sitesi. 2015 yılında açıldı.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast, geniş bir özel oyun modu yelpazesi sunan bir CSGO skin kumar sitesidir. En eski CSGO kumar sitelerinden biri.",
      "CSGOLive is a safe and legitimate CS2 case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive, özel estuches, günlük bonuslar ve İspat Edilebilir Adil sistemle güvenli ve yasal bir CS2 estuche açma web sitesidir.",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins, benzersiz oyunlar, günlük ödüller ve basit bir kayıt süreci sunan güvenilir ve popüler bir çevrimiçi platformdur.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop, Case Battles ve Upgrader gibi çeşitli etkinlikler sunan ve özel CSGO skin estuches'lerine sahip olan saygın bir çevrimiçi kumar platformudur.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins, 2016 yılından bu yana faaliyet gösteren, oyuncuların açabileceği geniş bir skin seçeneği sunan tanınmış bir CSGO estuche açma web sitesidir.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": "Bets4.pro, kullanıcılara özellikle CS2, Dota 2, Valorant ve daha birçok e-spor maçına bahis koyma imkanı sunan bir çevrimiçi platformdur.",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!" : "Bu site, yüksek ödemeleri ve sürekli promosyonları nedeniyle neredeyse efsanevi olarak adlandırılabilir. Günlük bonus dahil!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games." : "HowlGG, jackpot, coinflip, slots ve canlı casino oyunları dahil olmak üzere çeşitli oyunlar sunan bir Rust skin bahis platformudur.",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip." : "BanditCamp, tekerlek of fortune, estuche açma ve coinflip gibi Rust temalı oyun modlarını sağlayan bir Rust skin bahis sitesidir.",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016." : "GCSkins, CSGO skinleri ve eşyalarını ödül olarak sunan popüler bir mobil uygulama ve web sitesidir. 2016'dan beri hizmet vermektedir.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or play mobile and desktop games." : "GrindBux, anketleri tamamlayarak veya mobil ve masaüstü oyunları oynayarak para kazanabileceğiniz güvenilir bir platformdur.",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games." : "2017'den beri faaliyet gösteren bir Rust skin bahis sitesi. Platform, yüksek bahisçi jackpot ve coinflip gibi popüler oyunları sunar.",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly." : "RustBet - Güvenilir bir bahis sitesi, ödül olarak Rust skinleri. Jackpot, coinflip ve skin yükseltme oyunları. Temiz itibar, SSL şifreleme, kullanıcı dostu.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot and coinflip. Easily enter and withdraw items from games." : "RustStake, jackpot ve coinflip dahil olmak üzere çeşitli oyunlar sunan bir Rust skin bahis platformudur. Oyunlardan kolayca eşya girip çıkartabilirsiniz.",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods." : "Aslında, Steam üzerinden kazanç elde etmek için sitelerin öncüsü olan bu site, büyük çaplı çekim yöntemleri seçeneğiyle öne çıkmaktadır.",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable." : "RustyLoot, Tekerlek, Plinko ve daha fazlasını içeren çeşitli oyunlar sunar. Güvenli ve eğlenceli RustyLoot, şeffaf ve ispat edilebilir adil bir sistem sunar.",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.":"RustChance, 2017 yılından bu yana faaliyet gösteren ve Jackpot, Tekerlek, Coinflip, Crash ve Mayınlar gibi birçok popüler oyun sunan bir platformdur.",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.":"CrashGG, Rust skin bahislerine odaklanır ve başlıca özelliği olan crash oyun modu dahil olmak üzere çeşitli oyunlar sunar.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.":"HypeUp, CSGORoll ve HypeDrop'ın aynı operatörleri tarafından işletilen bir bahis sitesidir. Orijinal oyunlar ve Canlı Oyunlarla Slot oyunları sunar.",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.":"Web sitesi, seçilebilecek makul sayıda anket sağlayıcısı ve teklif duvarı ortağına sahiptir ve kazançları çekmek için birçok seçenek vardır.",      
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS2 and Rust. Owned and operated by RustySell.":"SkinSwap, CS2 ve Rust gibi popüler oyunlardan skinleri ticaret yapmanıza ve satmanıza izin veren bir çevrimiçi platformdur.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.":"CSGOSelly, CSGO skinlerini para olarak çekmek için kullanıcıların çeşitli ödeme yöntemlerini kullanabildiği bir web sitesidir. 2021'de kurulmuştur.",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Bu site, çeşitli mobil oyunlarda para kazanmanızı sağlayan birçok teklif duvarı gibi farklı mobil oyun disiplinlerinde gelir elde etmenizi sağlar.",
      "Mobile Games. Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Mobil Oyunlar. Bu site, çeşitli mobil oyunlarda para kazanmanızı sağlayan birçok teklif duvarı gibi farklı mobil oyun disiplinlerinde gelir elde etmenizi sağlar.",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.":"RustMoment, altı oyun, bonuslar ve rakeback sistemiyle Rust skin hayranları için bir bahis sitesidir. Standart ve kripto para ödemelerini kabul eder.",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos.": "Freeward, kullanıcıların anketler yaparak ve videolar izleyerek ödüller kazanabilecekleri çeşitli fırsatlar sunan bir GPT sitesidir.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet, kullanıcıların kripto para kullanarak oyun oynayabileceği bir çevrimiçi kumarhanedir. Platformun itibarı yasal ve güvenli olmasıyla bilinir.",
      "xplay is a platform that allows CS2 players to earn skins just by playing on their servers. The platform offers various servers and daily challenges.": "CS2 oyuncularının sunucularında oynayarak skin kazanmasını sağlayan bir platformdur. Çeşitli sunucular ve günlük meydan okumalar sunar.",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations.": "2018 yılında kurulan bu site, gelişmiş özelliklere, ispat edilebilir adalet sistemine ve çekici animasyonlara sahip jackpot, coinflip ve rulet oyunları sunar.",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers.": "GameTame, çeşitli aktiviteleri ve teklifleri tamamlamanın karşılığında ödüller sunan bir GPT sitesidir. Platform özellikle oyuncular için tasarlanmıştır.",
      "Salad is a website that offers users the opportunity to mine wallet and buy gift cards and many more using their computer's processing power.": "Salad, kullanıcılara cüzdan madenciliği yapma ve bilgisayarlarının işlem gücünü kullanarak hediye kartları ve daha fazlasını satın alma fırsatı sunan bir web sitesidir.",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings.": "Gamehag, birçok anket sağlayıcısı ve teklif duvarı ortağıyla birlikte kazançları çekmek için çeşitli seçenekler sunan bir site.",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources.": "SteamGifts, destekleyici bir topluma ve yardımcı kaynaklara sahip Steam Oyun Hediye Çekilişleri için güvenilir bir web sitesidir.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or playing mobile and desktop games.": "GrindBux, anketleri tamamlayarak veya mobil ve masaüstü oyunları oynayarak para kazanabileceğiniz güvenilir bir platformdur.",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. Owned by RustChance.": "RustCases, çeşitli oyun modlarına, geniş bir kutu seçeneğine ve skin çekme seçeneklerine sahip güvenilir bir Rust kumar sitesidir. RustChance tarafından sahiplenilmiştir.",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more!": "RustClash, Rulet, Yükseltici, Kutular ve daha birçok oyun gibi birçok oyun içeren yeni bir Rust Kumar sitesidir!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.": "BC.Game, 2017'de piyasaya sürülen bir çevrimiçi kumarhane ve spor kitabıdır. 8.000'den fazla oyun sunar ve mülkiyetindeki ve adil olduğu bilinir.",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.": "Primedice, 2013 yılından bu yana faaliyet gösteren bir çevrimiçi kripto zar oyunu kumarhanesidir. Kripto parayı kumar için kullanan ilk platformlardan biridir.",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.": "Tradeit, CS2 ve diğer oyunlar için skin takasını, alımını ve satımını sağlayan çevrimiçi bir pazardır. 2017'den beri hizmet vermektedir.",
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.": "DMarket, geniş bir ürün yelpazesine sahip olan ve Trustpilot'ta olumlu değerlendirmeler alan Steam ürünleri için güvenilir ve popüler bir pazardır.",
      "Swap.gg is a website that allows users to buy, sell, and trade CS2, Rust, TF2, and other virtual items from various games. Working since 2017.": "Swap.gg, kullanıcıların CS2, Rust, TF2 ve diğer çeşitli oyunlardan sanal ürünleri satın alma, satma ve takas etme imkanı sunan bir web sitesidir. 2017'den beri faaliyet gösteriyor.",    
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.": "BitSkins, CS2, Dota 2 ve Team Fortress 2 gibi oyunlardaki skinleri alıp satabileceğiniz çevrimiçi bir pazardır. 2015 yılında kurulmuştur.",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": "Hellcase'e ait güvenli P2P pazar. SSL şifrelemeli, KYC doğrulaması, kullanıcı dostu tasarım, rekabetçi fiyatlandırma, güvenilir ticaret platformu.",
      "BitSkins P2P is an online platform for buying and selling virtual items, with a focus on CS2 skins. The parent company, BitSkins.": "BitSkins P2P, CS2 skinlerine odaklanan sanal ürünlerin alınıp satılabildiği bir çevrimiçi platformdur. Ana şirket, BitSkins'tir.",
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improvement.": "YouTuber'lar tarafından desteklenen, güvenilir CS2 skin platformu. Güvenli, sadece CS2 skinlerine özgü, ücretler uygulanır ve kullanıcı yorumları geliştirme için potansiyel olduğunu gösterir.",
      "GamerPay is a trusted platform for buying and selling CS2 skins, with a free selling option, secure transactions, and high-quality skin inspection tool.": "GamerPay, CS2 skinlerinin alınıp satılabildiği güvenilir bir platformdur. Ücretsiz satış seçeneği, güvenli işlemler ve yüksek kaliteli skin kontrol aracı sunar.",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.": "CSGO Market, CS2 skinlerinin alınıp satılabildiği güvenli ve güvenli bir platform sunan çevrimiçi bir P2P pazarıdır. 2015 yılında kuruldu.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust, and Dota 2 skins and items. The platform was founded in 2020.": "Lis-Skins, özellikle CS2, Rust ve Dota 2 skinleri ve ürünleri için popüler bir Steam pazarıdır. Platform, 2020 yılında kurulmuştur.",
      "WhiteMarket is a P2P platform for CS2 skin trading. It offers secure trades, various deposit options, and community engagement.": "WhiteMarket, CS2 skin ticareti için bir P2P platformudur. Güvenli işlemler, çeşitli depozito seçenekleri ve topluluk katılımı sunar.",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS2, Dota 2, Rust, and Team Fortress 2. Working since 2016.": "CS.Deals, CS2, Dota 2, Rust ve Team Fortress 2 gibi oyunlardan skin alım ve satımını sağlayan bir platformdur. 2016'dan beri aktiftir.",
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": "SkinBid, CS2 skinleri ve oyun içi ürünler için bir çevrimiçi pazardır ve kullanıcı dostu bir arayüzle alım, satım ve açık artırma özellikleri sunar.",
      "LOOT.Farm is an online platform that offers users the ability to trade virtual items from popular games like CS2, Dota 2, Team Fortress 2, and Rust.": "LOOT.Farm, CS2, Dota 2, Team Fortress 2 ve Rust gibi popüler oyunlardan sanal eşyaları takas etme imkanı sunan bir çevrimiçi platformdur.",
      "SkinBaron is an online platform based in Germany that enables users to buy and sell their CS2 skins. The platform has gained a good reputation.": "SkinBaron, kullanıcıların CS2 skinlerini satın alıp satmalarını sağlayan Almanya merkezli bir çevrimiçi platformdur. Platform iyi bir üne sahiptir.",
      "Gamdom is one of the best CS2 match betting sites. You can play roulette, wheel, crash, slots, and many more!": "Gamdom, en iyi CS2 maç bahis sitelerinden biridir. Rulet, çark, crash, slotlar ve daha birçok oyunu oynayabilirsiniz!",
      "SkinCashier is an online platform that allows players to instantly sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier, oyuncuların CS2, Rust, Dota 2 ve TF2 skinlerini anında gerçek para karşılığında satmalarını sağlayan bir çevrimiçi platformdur. 2020 yılından beri faaliyet göstermektedir.",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS2, Dota 2, RUST, and TF2.": "Avan.Market, CS2, Dota 2, RUST ve TF2 gibi popüler oyunlardan oyun skinlerini satma fırsatı sunan bir çevrimiçi platformdur.",    
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash, güvenilir müşteri desteği sunan ve altı yılı aşkın süredir aktif olan bir platformdur, ancak fiyatlandırma en iyi değildir.",
      "CYBERSHOKE is a website that provides servers for playing CS2. It offers various servers for players to choose.": "CYBERSHOKE, CS2 oynamak için sunucular sağlayan bir web sitesidir. Oyuncuların seçebileceği çeşitli sunucular sunar.",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "Bu site, Steam seviyenizi hızla yükseltmek için tasarlandı. Steam Ticaret Kartlarından emoji ve profil arka planları satabilir, seviye atlayabilirsiniz.",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "SteamLevelU, Steam hesap seviyelerini yükseltmek için güvenilir bir platformdur. SH Level Up ile bağlantılıdır.",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "SteamLevels, kart paketleri satın alarak ve CSGO skinlerini kabul ederek Steam hesabınızın seviyesini artırmaya yardımcı olan kullanıcı dostu bir web sitesidir.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": "RustStake, jackpot ve coinflip gibi bir dizi oyun sunan bir Rust skin kumar platformudur. Oyundan kolayca öğeleri yatırabilir ve çekebilirsiniz.",
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.": "iTrade.gg, rostoların ticaretini yapmak için güvenilir bir platformdur. Kullanıcı dostu tasarım, ücretsiz kayıt bonusu ve günlük ödüller sorunsuz bir ticaret deneyimi sağlar.",
      "Shuffle.com is a comprehensive crypto casino with a unique registration process, original games, a VIP program, and plans for future expansion.": "Shuffle.com, benzersiz bir kayıt süreci, orijinal oyunlar, bir VIP programı ve gelecekteki genişleme planları olan kapsamlı bir kripto casino'dur.",
      "CashoutCSGO is a platform solely dedicated to selling CS2 skins for crypto or paypal, offering a convenient conversion service.":"CashoutCSGO, sadece CS2 skinleri satmaya adanmış bir platform olup, pratik bir dönüşüm hizmeti sunmaktadır.",
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.":"Dikkat çekici online pazar, oyunlardan hediye kartlarına geniş ürün yelpazesi, düşük fiyatlar, mükemmel itibar, sezgisel arayüz, %98'e varan indirimler.",
      "Withdraw BTC, ETH, LTC or PayPal!":"BTC, ETH, LTC veya PayPal çekin!",
      "Withdraw Money, Skins or Devices!": "Para, Skinler veya Cihazlar Çekin!",
      "Withdraw BTC, LTC, ETH and many else!": "BTC, LTC, ETH ve birçok şey çekin!",
      "Withdrawal of many types of cryptocurrencies !": "Birçok türde kripto paranın çekilmesi!",
      "Withdraw CS2 Skins, Crypto or Real Money!": "CS2 Skinleri, Kripto veya Gerçek Para Çekin!",
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": "CS2, Dota 2, TF2 veya Rust Eşyalarını Çekin!",
      "Withdraw CS2 Skins, Crypto or Game Keys!": "CS2 Skinleri, Kripto veya Oyun Anahtarları Çekin!",
      "Withdraw CS2 Skins, Crypto or PayPal!": "CS2 Skinleri, Kripto veya PayPal Çekin!",
      "Withdraw Money, CS2, TF2 or Rust Skins!": "Para, CS2, TF2 veya Rust Skinleri Çekin!",
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": "CS2 Skinleri, Dota 2 ve H1Z1 Eşyalarını Çekin!",
      "Withdraw CS2, Rust Skins and Dota 2 Items!": "CS2, Rust Skinleri ve Dota 2 Eşyalarını Çekin!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Rust Skinleri, Kripto veya PayPal Çekin!",
      "Withdraw Rust Skins or Crypto!": "Rust Skinleri veya Kripto Çekin!",
      "Withdraw Rust Skins and Items!": "Rust Skinleri ve Eşyaları Çekin!",
      "Buy Games, Gift Cards and many-many more.": "Oyunlar, Hediye Kartları ve daha fazlasını alın.",
      "Withdraw with many-many ways." : "Çok çok farklı şekillerde çekim yapın.",
      "Withdraw Crypto, gift cards or real money!" : "Kripto, hediye kartları ve gerçek para çekin!",
      "Withdraw CS2 Skins, Gift Cards or Crypto!" : "CS2 Skins, hediye kartları ve gerçek para çekin!",
      "Withdraw Bitcoin, Ethereum or Litecoin!" : "Bitcoin, Ethereum veya Litecoin çekin!",
      "Withdraw Games, GiftCards and many more!" : "Oyunlar, hediye kartları ve çok daha fazlasını çekin!",
      "Withdraw Crypto or Real Money!" : "Kripto para veya gerçek para çekin!",
      "Withdraw Crypto and Gift Cards!" : "Kripto para ve hediye kartları çekin!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!" : "BTC, LTC, USDT, USDC veya ETH çekin!",
      "Withdraw CS2 Skins or Items!" : "CS2 Skins veya eşyalar çekin!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!" : "Oyunlar, hediye kartları ve Dota 2 & TF2 eşyaları çekin!",
      "Withdraw Games, GiftCards or Donate to Charity!" : "Oyunlar, hediye kartları veya bağış yapın!",
      "Participate in Giveaways and win Steam Games." : "Çekilişlere katılın ve Steam oyunları kazanın.",
      "Withdraw CS2 And Rust Skins or Crypto!" : "CS2 ve Rust Skins veya kripto para çekin!",
      "Withdraw CS2 Skins or real Money!" : "CS2 Skins veya gerçek para çekin!",
      "Withdraw Steam Trading cards or Games." : "Steam Takas kartları veya oyunları çekin.",
      "Withdraw USDT, Skins or Real Money!" : "USDT, Skins veya gerçek para çekin!",
      "Withdraw Money, CS2 or Rust Skins!" : "Para, CS2 veya Rust Skins çekin!",
      "Withdraw Money, Crypto or Skins!" : "Para, kripto para veya Skins çekin!",
      "Withdraw CS2 Skins or Crypto!" : "CS2 Skins veya kripto para çekin!",
      "Withdraw Money, Crypto or PayPal!" : "Para, kripto para veya PayPal çekin!",
      "WITHDRAW WITH P2P CS2 SKINS." : "P2P CS2 SKINS ile çekin.",
      "Withdraw Real Money or Crypto!" : "Gerçek para veya kripto para çekin!",
      "Withdraw BTC, ETH, USDT or Tron!" : "BTC, ETH, USDT veya Tron çekin!",
      "Withdraw CS2 Skins or PayPal!" : "CS2 Skins veya PayPal çekin!",
      "Withdraw CS2 Skins and Items!" : "CS2 Skins ve eşyalar çekin!",
      "Withdraw Steam Trading cards." : "Steam Takas kartları çekin!",
      "1h, 24h and 7d Giveaways" : "1s, 24s ve 7g çekilişler",
      "24h Giveaway" : "24s çekiliş",
      "3h and 24h Giveaway" : "3s ve 24s çekiliş",
      "Daily and Weekly Giveaways" : "Günlük ve haftalık çekilişler",
      "1h Giveaway" : "1s çekiliş",
      "1h, 24h Giveaways" : "1s, 24s çekilişler",
      "Rare Giveaways" : "Nadir çekilişler",
      "Weekly Giveaways" : "Haftalık çekilişler",
      "Daily Giveaways" : "Günlük çekilişler",
      "Deposit Required" : "Depozito gerekiyor",
      "+360% Deposit Bonus" : "+360% Depozito Bonusu",
      "+100% Deposit Bonus" : "+100% Depozito Bonusu",
      "+10% Deposit Bonus" : "+10% Depozito Bonusu",
      "+5% Deposit Bonus" : "+5% Depozito Bonusu",
      "+1% Deposit Bonus" : "+1% Depozito Bonusu",
      "70 Free Spins" : "70 Ücretsiz Dönüş",
      "Every 24h Reward" : "Her 24 saatte bir ödül",
      "Daily Case" : "Günlük Kasa",
      "Daily Faucet" : "Günlük Musluk",
      "Daily Roll" : "Günlük Çark",
      "Daily Coins" : "Günlük Paralar",
      "Faucet and Giveaways" : "Musluk ve çekilişler",
      "Daily 0.02$" : "Günlük 0.02$",
      "Daily 0.02$ + Free Case" : "Günlük 0.02$ + Ücretsiz Kasa",
      "360% Deposit Bonus" : "360% Depozito Bonusu",
      "Deposit Bonus" : "Depozito Bonusu",
      "Visit WebSite" : "Web Sitesini Ziyaret Et",
      "Visit WebSite or Copy" : "Web Sitesini Ziyaret Et",
      "100% deposit bonus" : "100% Depozito Bonusu",
      "+3% Sell Bonus" : "+3% Satış Bonusu",
      "5% deposit bonus" : "5% Depozito Bonusu",
      "5 Free Cases" : "5 Ücretsiz Kasa",
      "Free 50 Gems" : "50 Ücretsiz Taş",
      "3 Free Cases" : "3 Ücretsiz Kasa",
      "Free 5€" : "5€ Bedava",
      "1.5$ For Free" : "Ücretsiz 1.5$",
      "5$ For Free" : "Ücretsiz 5$",
      "Free 1.00$" : "Ücretsiz 1.00$",
      "Free 0.90$" : "Ücretsiz 0.90$",
      "Free 0.50$" : "Ücretsiz 0.50$",
      "Free 0.40$" : "Ücretsiz 0.40$",
      "Free 0.30$" : "Ücretsiz 0.30$",
      "Free 0.25$" : "Ücretsiz 0.25$",
      "Free 0.20$" : "Ücretsiz 0.20$",
      "Free 0.15$" : "Ücretsiz 0.15$",
      "Free 0.10$" : "Ücretsiz 0.10$",
      "Free 0.05$" : "Ücretsiz 0.05$",
      "Free Case" : "Ücretsiz Kasa",
      "Free 1$" : "Ücretsiz 1$",
      "Free 2$" : "Ücretsiz 2$",
      "Big Daily Giveaways" : "Büyük Günlük Çekilişler",
      "Free Case up to 250$" : "Ücretsiz Kasa, 250$'a kadar",
      "Daily Giveaway" : "Günlük Çekiliş",
      "Free 100 Diamonds" : "Ücretsiz 100 Elmas",
      "500 coins" : "500 jeton",
      "Daily Cases" : "Günlük Kasa",
      "3 Energy Points" : "3 Enerji Puanı",
      "Free 200 Coins" : "Ücretsiz 200 Jeton",
      "some free coins" : "biraz ücretsiz jeton",
      "Free 2$" : "Ücretsiz 2$",
      "Free spins" : "Ücretsiz dönüşler",
      "Offerwall" : "Teklif Duvarı",
      "x2 Mining Rate" : "x2 Madencilik Oranı",
      "Games Giveaways" : "Oyun Çekilişleri"
    },
    "es": {
      "CSGO500 probably the best CS2 Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, el mejor sitio de apuestas de CS2. Lluvias, regalos y códigos promocionales. Juegos y tragamonedas disponibles.",
      "CSGO500 probably the best CS2 and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, el mejor sitio de apuestas de CS2. Lluvias, regalos y códigos promocionales. Juegos y tragamonedas disponibles.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll es uno de los sitios más populares. Incluye ruleta, crash y muchos más. Ahora probando las apuestas en e-sports.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire es uno de los sitios más populares. Incluye ruleta y coinflip. Trabajando desde 2016. Apuesta en partidas con prioridad.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon es un sitio legendario como CSGODouble con ruleta clásica, ¡pero también tiene Dados, Crash, Tragamonedas y apuestas en e-sports!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino ofrece juegos internos, participación social innovadora, sistema justo y buena reputación en juegos en línea.",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE es un famoso sitio de apuestas en e-sports con un interesante sistema de cashback, puedes apostar skins o dinero.",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit es un nuevo sitio de casino que incluye apuestas deportivas y muchos juegos clásicos como la ruleta. ¡Incluye bonos diarios!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "CSGOLuck es un sitio de apuestas de skins de CSGO con licencia que acepta múltiples métodos de depósito, ofrece varios juegos y un diseño fácil de usar.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits es un casino en línea seguro y con licencia que ofrece juegos, apuestas deportivas, e-sports y transacciones con criptomonedas.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG es una plataforma en línea que ofrece una variedad de juegos de apuestas de skins de CSGO con animaciones profesionales y fluidas.",
      "Rustix - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix: plataforma de apuestas para CS2 y Rust con juegos originales, juego justo, bonificaciones e impresionantes animaciones.",
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": "CSGO-Skins es una plataforma en línea confiable donde los usuarios pueden abrir estuches personalizados de CS2 y participar en sorteos diarios.",
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": "FlameCases es una plataforma en línea que permite abrir estuches para CS2 y Dota 2. Desde 2017, el sitio web ofrece varias funciones.",
      "KNIFEX is a CS2 gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX es un sitio de apuestas de CS2 con múltiples modos de juego, incluyendo apertura y batallas de estuches, coinflip, crash, clash y más.",
      "DatDrop is a website that specializes in opening cases that contain skins from CS2. Its most prominent feature is the case-opening battles.": "DatDrop es un sitio web especializado en abrir estuches que contienen skins de CS2. Su característica más destacada son las batallas de apertura de estuches.",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins es un sitio web de apertura de estuches de CSGO válido desde 2017 que ofrece Apertura de Estuches, Batallas de Estuches y Mejoras.",
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg es un nuevo sitio de apuestas de CS2 que incluye muchos juegos como la ruleta, upgrader, estuches ¡y muchos más!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore es una plataforma que permite a los usuarios apostar skins de CSGO en modos de juego como Coinflip, Jackpot, Upgrader y Wheel.",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": "Hellcase es una plataforma en línea donde puedes comprar estuches virtuales con skins y objetos para juegos como CS2, Dota 2 y Rust.",
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG: un sitio de apuestas de skins de CS2 con modos de juego como Jackpot, Coinflip, Ruleta, Estuches y Batallas de Estuches. Abrió en 2015.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast es un sitio de apuestas de skins de CSGO con diversos modos de juego exclusivos. Uno de los primeros sitios de apuestas de CSGO.",
      "CSGOLive is a safe and legitimate CS2 case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive es un sitio web seguro de apertura de estuches de CS2 con estuches personalizados, bonos diarios y un sistema justo.",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins es una plataforma en línea confiable y popular que ofrece juegos únicos, recompensas diarias y un proceso de registro sencillo.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop es una plataforma de apuestas en línea que ofrece actividades como Batallas de Cajas, Mejoras y estuches personalizados de skins de CSGO.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins es un sitio web de apertura de cajas de CSGO que opera desde 2016, ofreciendo una amplia selección de skins para desempaquetar.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": "Bets4.pro es una plataforma en línea que ofrece apuestas en partidos de deportes electrónicos, incluyendo CS2, Dota 2, Valorant y más.",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!" : "Este sitio puede considerarse casi legendario entre sus pares debido a sus altos pagos y promociones constantes. ¡Incluye bonificación diaria!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games." : "HowlGG es una plataforma de apuestas de skins de Rust que ofrece una variedad de juegos, incluyendo jackpot, coinflip, slots y juegos de casino en vivo.",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip." : "BanditCamp es un sitio web de apuestas de skins de Rust que ofrece modos de juego temáticos, como la rueda de la fortuna, la apertura de cajas y el coinflip.",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016." : "GCSkins es una popular aplicación móvil y sitio web que ofrece skins y objetos de CSGO como recompensa por completar tareas en línea. Disponible desde 2016.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or play mobile and desktop games." : "GrindBux es una plataforma confiable donde puedes ganar dinero completando encuestas o jugando juegos para dispositivos móviles y de escritorio.",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games." : "Sitio de apuestas de skins de Rust desde 2017. Ofrece juegos populares como jackpot y coinflip para grandes apostadores.",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly." : "RustBet: sitio confiable de apuestas de skins de Rust. Jackpot, coinflip y mejora de skins. Buena reputación, encriptación SSL, fácil de usar.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot and coinflip. Easily enter and withdraw items from games." : "RustStake: plataforma de apuestas de skins de Rust. Jackpot, coinflip y más. Fácil depósito y retiro de elementos del juego.",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods." : "De hecho, el precursor de los sitios para ganar a través de Steam se destaca por su gran selección de métodos de retiro.",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable." : "RustyLoot ofrece juegos como Ruleta y Plinko, asegurando diversión y seguridad con su sistema transparente y comprobable.",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.":"RustChance ha estado operando desde 2017 y ofrece varios juegos populares, incluyendo Jackpot, Ruleta, Cara o Cruz, Crash y Minas terrestres.",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.":"CrashGG: sitio de apuestas de skins de Rust. Juegos emocionantes como Crash, Duelos, Blackjack y Lotería. Gran variedad de opciones de apuestas.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.":"HypeUp es propiedad de los mismos operadores de CSGORoll y HypeDrop. Ofrece dos juegos originales y Tragamonedas con Juegos en Vivo.",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.":"El sitio web cuenta con varios proveedores de encuestas y socios de ofertas para elegir, y ofrece múltiples opciones para retirar las ganancias.",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS2 and Rust. Owned and operated by RustySell.":"SkinSwap es una plataforma en línea para intercambiar y vender skins de juegos populares como CS2 y Rust. Propiedad de RustySell.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.":"CSGOSelly es un sitio web que permite a los usuarios convertir sus skins de CSGO en dinero a través de varios métodos de pago. Fue fundado en 2021.",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Sitio único donde puedes ganar dinero ganando juegos en varias disciplinas cibernéticas de juegos móviles. También tiene muchos muros de ofertas.",
      "Mobile Games. Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Sitio único donde puedes ganar dinero ganando juegos en varias disciplinas cibernéticas de juegos móviles. También tiene muchos muros de ofertas.",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.":"RustMoment: sitio de apuestas de skins de Rust. 6 juegos, bonificaciones y sistema de rakeback. Acepta pagos estándar y criptomonedas.",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos.": "Freeward es un sitio GPT que ofrece diversas oportunidades para que los usuarios ganen recompensas mediante tareas como encuestas y ver videos.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet es un casino en línea seguro que acepta criptomonedas para jugar. Es conocido por su reputación legítima y seguridad.",
      "xplay is a platform that allows CS2 players to earn skins just by playing on their servers. The platform offers various servers and daily challenges.": "xplay es una plataforma que permite a los jugadores de CS2 ganar skins jugando en sus servidores. Ofrece diversos servidores y desafíos diarios.",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations.": "Establecido en 2018, ofrece juegos de jackpot, coinflip y ruleta con características mejoradas, equidad demostrable y animaciones atractivas.",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers.": "GameTame es un sitio GPT que ofrece recompensas por completar actividades y ofertas. Es especialmente diseñado para jugadores.",
      "Salad is a website that offers users the opportunity to mine wallet and buy gift cards and many more using their computer's processing power.": "Salad es un sitio web que ofrece a los usuarios la oportunidad de minar billeteras y comprar tarjetas de regalo y mucho más utilizando la potencia de procesamiento de su computadora.",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings.": "Sitio asociado a Gamehag con varias opciones de encuestas y ofertas para elegir, y múltiples opciones de retiro de ganancias.",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources.": "SteamGifts es un sitio web legítimo para sorteos de juegos de Steam con una comunidad solidaria y recursos útiles.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or playing mobile and desktop games.": "GrindBux es una plataforma confiable donde puedes ganar dinero completando encuestas o jugando juegos móviles y de escritorio.",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. Owned by RustChance.": "RustCases es un sitio de apuestas confiable para Rust con varios modos de juego, una amplia selección de cajas y opciones de retiro de skins. Propiedad de RustChance.",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more!": "RustClash es un nuevo sitio de apuestas de Rust que incluye muchos juegos como ruleta, upgrader, cajas y ¡muchos más!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.": "BC.Game es un casino en línea y casa de apuestas deportivas lanzado en 2017, ofreciendo más de 8,000 juegos, incluyendo juegos propietarios.",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.": "Primedice es un casino en línea que utiliza criptomonedas para juegos de dados. Lanzado en 2013, fue uno de los pioneros en esta forma de juego.",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.": "Tradeit es un mercado en línea que permite a los jugadores intercambiar, comprar y vender skins de varios juegos, como CS2. Funciona desde 2017.",
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.": "DMarket es un mercado confiable y popular para artículos de Steam, con una gran cantidad de artículos disponibles y reseñas positivas en Trustpilot.",
      "Swap.gg is a website that allows users to buy, sell, and trade CS2, Rust, TF2, and other virtual items from various games. Working since 2017.": "Swap.gg es un sitio web que permite a los usuarios comprar, vender e intercambiar skins de CS2, Rust, TF2 y otros objetos virtuales de varios juegos. Funciona desde 2017.",
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.": "BitSkins es un mercado en línea para skins de juegos, especialmente para Counter-Strike 2, Dota 2 y Team Fortress 2. Lanzado en 2015.",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": "Mercado P2P seguro de Hellcase. Encriptado SSL, verificación KYC, diseño amigable, precios competitivos, plataforma confiable.",
      "BitSkins P2P is an online platform for buying and selling virtual items, with a focus on CS2 skins. The parent company, BitSkins.": "BitSkins P2P es una plataforma en línea para comprar y vender artículos virtuales, con un enfoque en skins de CS2. La empresa matriz es BitSkins.",
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improvement.": "Plataforma confiable de skins de CS2 con alquileres, respaldada por YouTubers. Segura, limitada a skins de CS2, se aplican tarifas y las reseñas de los usuarios indican que hay margen de mejora.",
      "GamerPay is a trusted platform for buying and selling CS2 skins, with a free selling option, secure transactions, and high-quality skin inspection tool.": "GamerPay: plataforma confiable de compra y venta de skins de CS2. Venta gratuita, transacciones seguras y alta calidad en la inspección de skins.",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.": "CSGO Market es un mercado P2P en línea que ofrece una plataforma segura para comprar y vender skins de CS2. Establecido en 2015.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust, and Dota 2 skins and items. The platform was founded in 2020.": "Lis-Skins es un mercado popular para artículos de Steam, especialmente skins e items de CS2, Rust y Dota 2. La plataforma fue fundada en 2020.",
      "WhiteMarket is a P2P platform for CS2 skin trading. It offers secure trades, various deposit options, and community engagement.": "WhiteMarket: plataforma P2P para intercambio seguro de skins de CS2 con opciones de depósito y participación comunitaria.",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS2, Dota 2, Rust, and Team Fortress 2. Working since 2016.": "CS.Deals es una plataforma para comprar, vender y intercambiar skins de juegos populares como CS2, Dota 2, Rust y Team Fortress 2.",
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": "SkinBid: mercado en línea para skins de CS2 y objetos de juego con funciones de compra, venta y subasta y una interfaz intuitiva.",
      "LOOT.Farm is an online platform that offers users the ability to trade virtual items from popular games like CS2, Dota 2, Team Fortress 2, and Rust.": "LOOT.Farm es una plataforma en línea que ofrece a los usuarios la posibilidad de intercambiar objetos virtuales de juegos populares como CS2, Dota 2, Team Fortress 2 y Rust.",
      "SkinBaron is an online platform based in Germany that enables users to buy and sell their CS2 skins. The platform has gained a good reputation.": "SkinBaron es una plataforma en línea alemana para comprar y vender skins de CS2, reconocida por su excelente reputación.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust and Dota 2 skins and items. The platform was founded in 2020.":"Lis-Skins es un popular mercado para objetos de Steam, especialmente skins e ítems de CS2, Rust y Dota 2. La plataforma fue fundada en 2020.",
      "Gamdom is one of the best CS2 match betting sites. You can play roulette, wheel, crash, slots, and many more!": "Gamdom es uno de los mejores sitios de apuestas en partidas de CS2. ¡Puedes jugar a la ruleta, la rueda, el crash, las tragamonedas y mucho más!",
      "SkinCashier is an online platform that allows players to instantly sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier es una plataforma en línea que permite a los jugadores vender al instante sus skins de CS2, Rust, Dota 2 y TF2 por dinero real. Operando desde 2020.",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS2, Dota 2, RUST, and TF2.": "Avan.Market es una plataforma en línea que ofrece a los usuarios la oportunidad de vender skins de juegos populares como CS2, Dota 2, RUST y TF2.",
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash: plataforma confiable con buenas reseñas, soporte al cliente confiable y más de seis años de experiencia. Precios no óptimos.",
      "CYBERSHOKE is a website that provides servers for playing CS2. It offers various servers for players to choose.":"CYBERSHOKE es un sitio web que ofrece servidores para jugar CS2. Ofrece varios servidores para que los jugadores elijan.",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "Sube de nivel fácilmente en Steam. Vende emojis y fondos de perfil para Cartas de Intercambio de Steam y progresa rápidamente.",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "SteamLevelU es una plataforma confiable para mejorar los niveles de tu cuenta de Steam mediante la compra de paquetes de cartas de intercambio.",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "SteamLevels es un sitio web fácil de usar que te ayuda a aumentar el nivel de tu cuenta de Steam. Compra paquetes de cartas e intercambia skins de CSGO.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": "RustStake: Plataforma de apuestas de skins de Rust. Variedad de juegos, incluyendo jackpot y coinflip. Fácil retiro de elementos del juego.",
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.":"iTrade.gg es una plataforma confiable para el comercio de skins de Rust. Su diseño intuitivo, bono de registro gratuito y recompensas diarias crean una experiencia de comercio fluida.",
      "Shuffle.com is a comprehensive crypto casino with a unique registration process, original games, a VIP program, and plans for future expansion.":"Shuffle.com es un casino de criptomonedas completo con registro único, juegos originales, programa VIP y planes de expansión futura.",
      "CashoutCSGO is a platform solely dedicated to selling CS2 skins for crypto or paypal, offering a convenient conversion service.":"CashoutCSGO es una plataforma dedicada exclusivamente a la venta de skins de CS2, ofreciendo un servicio de conversión conveniente.",
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.":"Destacado mercado en línea, amplia oferta desde juegos hasta tarjetas de regalo, tarifas reducidas, reputación estelar, interfaz intuitiva.",
      "Withdraw BTC, ETH, LTC or PayPal!":"¡Retira BTC, ETH, LTC o PayPal!",
      "Withdraw Money, Skins or Devices!": "Retira dinero, skins o dispositivos!",
      "Withdraw BTC, LTC, ETH and many else!": "Retira BTC, LTC, ETH y muchos más!",
      "Withdrawal of many types of cryptocurrencies !": "¡Retiro de muchos tipos de criptomonedas!",
      "Withdraw CS2 Skins, Crypto or Real Money!": "Retira Skins de CS2, criptomonedas o dinero!",
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": "Retira items de CS2, Dota 2, TF2 o Rust!",
      "Withdraw CS2 Skins, Crypto or Game Keys!": "Retira skins de CS2, criptomonedas o juegos.",
      "Withdraw CS2 Skins, Crypto or PayPal!": "Retira Skins de CS2, criptomonedas o PayPal!",
      "Withdraw Money, CS2, TF2 or Rust Skins!": "Retira dinero, Skins de CS2, TF2 o Rust!",
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": "Retira Skins de CS2, Dota 2 y items de H1Z1!",
      "Withdraw CS2, Rust Skins and Dota 2 Items!": "Retira Skins de CS2, Rust y items de Dota 2!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Retira Skins de Rust, criptomonedas o PayPal!",
      "Withdraw Rust Skins or Crypto!": "Retira Skins de Rust o criptomonedas!",
      "Withdraw Rust Skins and Items!": "Retira Skins e items de Rust!",
      "Buy Games, Gift Cards and many-many more.": "¡Compra Juegos, Tarjetas y Mucho Más!",
      "Withdraw with many-many ways.": "Retira de muchas-muchas formas.",
      "Withdraw Crypto, gift cards or real money!": "Retira criptomonedas y tarjetas de regalo!",
      "Withdraw CS2 Skins, Gift Cards or Crypto!": "Retira Skins CS2, tarjetas regalo o criptomonedas!",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "Retira Bitcoin, Ethereum o Litecoin!",
      "Withdraw Games, GiftCards and many more!": "Retira juegos, tarjetas de regalo y mucho más!",
      "Withdraw Crypto or Real Money!": "Retira criptomonedas o dinero real!",
      "Withdraw Crypto and Gift Cards!": "Retira criptomonedas y tarjetas de regalo!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "Retira BTC, LTC, USDT, USDC o ETH!",
      "Withdraw CS2 Skins or Items!": "Retira Skins o items de CS2!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": "Retira juegos, tarjetas de regalo o items de Dota2 y TF2!",
      "Withdraw Games, GiftCards or Donate to Charity!": "Retira juegos, tarjetas de regalo o dona a caridad!",
      "Participate in Giveaways and win Steam Games.": "Participa en sorteos y gana juegos de Steam.",
      "Withdraw CS2 And Rust Skins or Crypto!": "Retira Skins de CS2 y Rust o criptomonedas!",
      "Withdraw CS2 Skins or real Money!": "Retira Skins de CS2 o dinero real!",
      "Withdraw Steam Trading cards or Games.": "Retira cartas o juegos de Steam!",
      "Withdraw USDT, Skins or Real Money!": "Retira USDT, Skins o dinero real!",
      "Withdraw Money, CS2 or Rust Skins!": "Retira dinero, Skins de CS2 o Rust!",
      "Withdraw Money, Crypto or Skins!": "Retira dinero, criptomonedas o Skins!",
      "Withdraw CS2 Skins or Crypto!": "Retira Skins de CS2 o criptomonedas!",
      "Withdraw Money, Crypto or PayPal!": "Retira dinero, criptomonedas o PayPal!",
      "WITHDRAW WITH P2P CS2 SKINS.": "RETIRA CON SKINS P2P DE CS2.",
      "Withdraw Real Money or Crypto!": "Retira dinero real o criptomonedas!",
      "Withdraw BTC, ETH, USDT or Tron!": "Retira BTC, ETH, USDT o Tron!",
      "Withdraw CS2 Skins or PayPal!": "Retira Skins de CS2 o PayPal!",
      "Withdraw CS2 Skins and Items!": "Retira Skins e items de CS2!",
      "Withdraw Steam Trading cards.": "Retira cartas de intercambio de Steam!",    
      "1h, 24h and 7d Giveaways": "Sorteos de 1h, 24h y 7d",
      "24h Giveaway": "Sorteo de 24h",
      "3h and 24h Giveaway": "Sorteos de 3h y 24h",
      "Daily and Weekly Giveaways": "Sorteos diarios y semanales",
      "1h Giveaway": "Sorteo de 1h",
      "1h, 24h Giveaways": "Sorteos de 1h y 24h",
      "Rare Giveaways": "Sorteos raros",
      "Weekly Giveaways": "Sorteos semanales",
      "Daily Giveaways": "Sorteos diarios",
      "Deposit Required": "Depósito requerido",
      "+360% Deposit Bonus": "+360% Bono de depósito",
      "+100% Deposit Bonus": "+100% Bono de depósito",
      "+10% Deposit Bonus": "+10% Bono de depósito",
      "+5% Deposit Bonus": "+5% Bono de depósito",
      "+1% Deposit Bonus": "+1% Bono de depósito",
      "70 Free Spins": "70 Giros gratis",
      "Every 24h Reward": "Recompensa cada 24 horas",
      "Daily Case": "Estuche diario",
      "Daily Faucet": "Grifo diario",
      "Daily Roll": "Tirada diaria",
      "Daily Coins": "Monedas diarias",
      "Faucet and Giveaways": "Grifo y sorteos",
      "Daily 0.02$": "0.02$ diarios",
      "Daily 0.02$ + Free Case": "0.02$ diarios + Estuche gratis",
      "360% Deposit Bonus":"360% Bono de depósito",
      "Deposit Bonus":"Bono de depósito",
      "Visit WebSite": "Visitar sitio web",
      "Visit WebSite or Copy": "Visitar sitio web o copiar",
      "100% deposit bonus": "Bono de depósito del 100%",
      "+3% Sell Bonus": "Bono de venta del +3%",
      "5% deposit bonus": "Bono de depósito del 5%",
      "5 Free Cases": "5 Estuches gratis",
      "Free 50 Gems": "50 Gemas gratis",
      "3 Free Cases": "3 Estuches gratis",
      "Free 5€": "5€ gratis",
      "1.5$ For Free": "1.5$ gratis",
      "5$ For Free": "5$ gratis",
      "Free 1.00$": "1.00$ gratis",
      "Free 0.90$": "0.90$ gratis",
      "Free 0.50$": "0.50$ gratis",
      "Free 0.40$": "0.40$ gratis",
      "Free 0.30$": "0.30$ gratis",
      "Free 0.25$": "0.25$ gratis",
      "Free 0.20$": "0.20$ gratis",
      "Free 0.15$": "0.15$ gratis",
      "Free 0.10$": "0.10$ gratis",
      "Free 0.05$": "0.05$ gratis",
      "Free Case": "Estuche gratis",
      "Free 1$": "1$ gratis",
      "Free 2$": "2$ gratis",
      "Big Daily Giveaways": "Sorteos diarios grandes",
      "Free Case up to 250$": "Estuche gratis de hasta 250$",
      "Daily Giveaway": "Sorteo diario",
      "Free 100 Diamonds": "100 Diamantes gratis",
      "500 coins": "500 monedas",
      "Daily Cases": "Estuches diarios",
      "3 Energy Points": "3 Puntos de energía",
      "Free 200 Coins": "200 Monedas gratis",
      "some free coins": "algunas monedas gratis",
      "Free 2$": "2$ gratis",
      "Free spins": "Giros gratis",
      "Offerwall": "Pared de ofertas",
      "x2 Mining Rate": "Tasa de minería x2",
      "Games Giveaways": "Sorteos de juegos"    
    },
    "pt": {
      "CSGO500 probably the best CS2 Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, provavelmente o melhor site de apostas de CS2. Chuvas regulares, brindes e códigos promocionais. Você pode jogar muitos jogos e caça-níqueis.",
      "CSGO500 probably the best CS2 and Rust Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, provavelmente o melhor site de apostas de CS2. Chuvas regulares, brindes e códigos promocionais. Você pode jogar muitos jogos e caça-níqueis.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll é um dos sites mais populares. Inclui roleta, crash e muitos outros. Agora testando apostas em e-sports.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire é um dos sites mais populares. Inclui roleta e coinflip. Trabalhando desde 2016. Aposta em partidas com prioridade.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon é um site lendário como o CSGODouble, com roleta clássica, mas tem dados, crash, caça-níqueis e até apostas em e-sports!",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Gamdom Casino oferece uma variedade de jogos internos, envolvimento social inovador, sistema comprovadamente justo e boa reputação nos jogos online.",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "Famoso site de apostas em e-sports com um sistema interessante de cashback, você pode apostar skins ou dinheiro. Possui várias opções de pagamento.",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit é um novo site de cassino que inclui apostas esportivas e muitos jogos clássicos como roleta. Inclui bônus diários!",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "É um site de apostas de skins de CSGO licenciado que aceita vários métodos de depósito, oferecendo diversos jogos e um design amigável para o usuário.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Um cassino online seguro e licenciado com jogos, apostas esportivas, apostas em e-sports e transações de criptomoedas instantâneas.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "Uma plataforma online que oferece jogos de apostas de skins de CSGO com animações profissionalmente projetadas e suaves.",
      "Rustix - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - plataforma de apostas para CS2 e Rust com jogos originais, jogabilidade justa, bônus e animações impressionantes. Aberto em 2023.",
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": "CSGO-Skins é uma plataforma online confiável onde os usuários podem abrir caixas personalizadas de CS2 e participar de brindes diários.",
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": "Uma plataforma online que permite aos usuários abrir caixas para CS2 e Dota 2 desde 2017, oferecendo várias funcionalidades.",
      "KNIFEX is a CS2 gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "Um site de apostas de CS2 com uma variedade de modos de jogo, incluindo abertura de caixas, batalhas de caixas, coinflip, crash, clash e muito mais!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS2. Its most prominent feature is the case-opening battles.": "DatDrop é um site que se especializa em abrir caixas que contêm skins do CS2. Sua característica mais proeminente são as batalhas de abertura de caixas.",      
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins é um site de abertura de caixas do CSGO que está em operação desde 2017 e oferece Aberturas de Caixas, Batalhas de Caixas e Upgrader.",  
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg é um novo site de apostas de CS2 que oferece uma ampla variedade de jogos emocionantes, como Roleta, Upgrader, Caixas e muito mais!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore é uma plataforma que permite aos usuários participarem de apostas de skins do CSGO através de modos de jogo como Coinflip, Jackpot e Roleta.",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": "Hellcase é uma plataforma que permite aos usuários comprar caixas virtuais preenchidas com skins e itens para vários jogos como CS2, Dota 2 e Rust.",
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "CSGOBIG - um site de apostas de skins do CS2 com modos de jogo como Jackpot, Coinflip, Roleta, Caixas e Batalhas de Caixas. Aberto em 2015.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast é um site de apostas de skins do CSGO que oferece uma ampla variedade de modos de jogo exclusivos. Um dos primeiros sites do CSGO.",
      "CSGOLive is a safe and legitimate CS2 case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive é um site seguro e legítimo de abertura de caixas do CS2 com caixas personalizadas, bônus diários e um sistema Provably Fair.",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins é uma plataforma online confiável e popular que oferece jogos únicos, recompensas diárias e um processo de registro simples.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop é uma plataforma de apostas online renomada que oferece Batalhas de Caixas, Upgrader e caixas de skins personalizadas do CSGO.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins é um conhecido site de abertura de caixas do CSGO, operando desde 2016, com ampla seleção de skins para os jogadores.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": "Bets4.pro é uma plataforma online para apostas em esportes eletrônicos, incluindo CS2, Dota 2, Valorant e mais.",
      "This site can be called almost legendary among peers due to its high payouts and constant promotions. Include daily bonus!" : "Este site pode ser considerado quase lendário entre os colegas devido aos seus pagamentos elevados e promoções constantes. Inclui bônus diário!",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games." : "HowlGG é uma plataforma de jogos de apostas de skins do Rust que oferece uma variedade de jogos, incluindo jackpot, coinflip, slots e jogos de cassino.",
      "BanditCamp is a Rust skin gambling website that provides several Rust-themed game modes like wheel of fortune, case unboxings, and coinflip." : "BanditCamp é um site de apostas de skins do Rust que oferece vários modos de jogo temáticos do Rust, como roda da fortuna, abertura de caixas e coinflip.",
      "GCSkins is a well-known mobile app and website that offers CSGO skins and items as rewards for completing online tasks. Available since 2016." : "GCSkins é um aplicativo móvel e um site bem conhecidos que oferecem skins e itens de CSGO como recompensa por completar tarefas online.",
      "GrindBux is a trusted platform where you can earn some money by completing surveys or play mobile and desktop games." : "GrindBux é uma plataforma confiável onde você pode ganhar dinheiro completando pesquisas ou jogando jogos para dispositivos móveis e desktop.",
      "Rust skin gambling site that has been around since 2017. The platform offers a range of popular games, including high-roller jackpot and coinflip games." : "Site de apostas de skins do Rust em operação desde 2017. Oferece variedade de jogos populares, incluindo jackpot e coinflip.",
      "RustBet - Trusted gambling site, Rust skins as rewards. Jackpot, coinflip, and skin upgrader games. Clean reputation, SSL encryption, user-friendly." : "RustBet - Site confiável de apostas com skins do Rust. Jogos de jackpot, coinflip e aprimoramento. Reputação sólida, criptografia SSL, interface amigável.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot and coinflip. Easily enter and withdraw items from games." : "RustStake é uma plataforma de jogos de apostas de skins do Rust que oferece uma variedade de jogos, incluindo jackpot e coinflip. Entre e retire itens dos jogos com facilidade.",
      "In fact, the progenitor of sites for earning through Steam, stands out for its huge selection of Withdrawal methods." : "Na verdade, o precursor de sites para ganhar dinheiro através do Steam, destaca-se pela enorme seleção de métodos de saque.",
      "RustyLoot offers a variety of games, including Wheel, Plinko, and more. With its transparent and provably fair system, RustyLoot is safe and enjoyable." : "RustyLoot oferece vários jogos, incluindo Roleta, Plinko e mais. Seguro e divertido, com sistema transparente e justo.",
      "RustChance has been operating since 2017 and offers several popular games, including Jackpot, Wheel, Coinflip, Crash, and Landmines.":"O RustChance está em operação desde 2017 e oferece vários jogos populares, incluindo Jackpot, Roleta, Cara ou Coroa, Queda e Campo Minado.",
      "CrashGG focuses on Rust skin gambling and offers various games, including its primary feature, the crash game mode. Also has Duels, Blackjack and Lottery.":"O CrashGG é especializado em apostas de skins do Rust, com vários jogos, incluindo o modo crash. Também tem Duelos, Blackjack e Loteria.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.":"O HypeUp é de propriedade dos operadores de CSGORoll e HypeDrop, oferece dois jogos originais e Slots com Jogos Ao Vivo.",
      "The website has a decent number of survey providers and offerwall partners to choose from, and there are plenty of options for withdrawing earnings.":"O site possui um número razoável de provedores de pesquisas e parceiros de oferta para escolher, e há muitas opções para sacar os ganhos.",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS2 and Rust. Owned and operated by RustySell.":"O SkinSwap é uma plataforma online para negociar e vender skins de jogos populares como CS2 e Rust, pertencente à RustySell.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.":"CSGOSelly é um site que permite aos usuários converter suas skins de CSGO em dinheiro através de vários métodos de pagamento. Foi fundado em 2021.",
      "Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Um site único onde você pode ganhar dinheiro ganhando jogos em várias disciplinas cibernéticas de jogos móveis. Também possui muitos offerwalls.",
      "Mobile Games. Unique site where you can earn money by winning games in various mobile gaming cyber disciplines. Also have many offerwalls.":"Um site único onde você pode ganhar dinheiro ganhando jogos em várias disciplinas cibernéticas de jogos móveis. Também possui muitos offerwalls.",
      "RustMoment is a gambling site for Rust skin enthusiasts with six games, bonuses, and a rakeback system. It accepts standard and cryptocurrency payments.":"RustMoment é um site de apostas para entusiastas de skins do Rust com seis jogos, bônus e pagamentos em moeda padrão e criptomoeda.",
      "Freeward is a GPT site that provides various opportunities for users to earn rewards through tasks like surveys and watching videos.": "Freeward é um site que oferece oportunidades para os usuários ganharem recompensas por meio de tarefas como pesquisas e vídeos.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet é um cassino online que permite aos usuários jogar jogos usando criptomoeda. A plataforma tem uma reputação de ser legítima e segura.",
      "xplay is a platform that allows CS2 players to earn skins just by playing on their servers. The platform offers various servers and daily challenges.": "xplay é uma plataforma que permite aos jogadores de CS2 ganhar skins jogando em seus servidores. Oferece vários servidores e desafios diários.",
      "Established in 2018, it offers jackpot, coinflip, and roulette games with enhanced features, provable fairness, and attractive animations.": "Estabelecido em 2018, oferece jogos de jackpot, coinflip e roleta com recursos aprimorados, justiça comprovável e animações atrativas.",
      "GameTame is a GPT site that provides rewards for completing various activities and offers. The platform is specifically designed for gamers.": "GameTame é um site que oferece recompensas por completar atividades e ofertas. É projetado especialmente para jogadores.",
      "Salad is a website that offers users the opportunity to mine wallet and buy giftcards and many more using their computer's processing power.": "Salad é um site que permite aos usuários minerar carteiras, comprar cartões-presente e muito mais usando o poder de processamento do computador.",
      "Site from Gamehag owners. Has a decent number of survey providers and offerwall partners to choose from, plenty of options for withdrawing earnings.": "Site dos proprietários do Gamehag. Oferece provedores de pesquisas, parceiros de oferta e opções de saque dos ganhos.",
      "SteamGifts is a legitimate website for Steam Game Giveaways with a supportive community and helpful resources.": "SteamGifts é um site legítimo para sorteios de jogos do Steam, com uma comunidade solidária e recursos úteis.",
      "GrindBux is a trusted platform when you can earn some money by completing surveys or play mobile and desktop games.": "GrindBux é uma plataforma confiável onde você pode ganhar dinheiro ao completar pesquisas ou jogar jogos móveis e de desktop.",
      "RustCases is a trusted Rust gambling site with various game modes, a wide range of cases, and skin withdrawal options. By RustChance owners.": "RustCases é um site confiável de apostas em Rust com diversos modos de jogo, uma ampla seleção de cases e opções de retirada de skins.",
      "RustClash is a new Rust Gambling site which includes many games like Roulette, Upgrader, Cases and many more !":"RustClash é um novo site de apostas de Rust que inclui muitos jogos como Roleta, Upgrader, Cases e muitos outros!",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.":"BC.Game é um cassino online e casa de apostas lançado em 2017, com mais de 8.000 jogos, incluindo jogos proprietários e provavelmente justos.",
      "Primedice is an online Crypto Dice Game Casino that has been in operation since 2013. It was one of the first platforms to use crypto for gambling.":"Primedice é um cassino de dados criptografados online em operação desde 2013, pioneiro no uso de criptomoedas em jogos de azar.",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.":"Tradeit é um mercado online de skins de jogos, incluindo CS2, onde os jogadores podem trocar, comprar e vender skins. Trabalhando desde 2017.",
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.":"DMarket é um mercado confiável e popular para itens do Steam, com uma grande quantidade de itens disponíveis e avaliações positivas no Trustpilot.",
      "Swap.gg is a website that allows users to buy, sell, and trade CS2, Rust , TF2 and other virtual items from various games. Working since 2017.":"Swap.gg é um site que permite aos usuários comprar, vender e trocar itens virtuais de CS2, Rust, TF2 e outros jogos. Trabalhando desde 2017.",
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.":"BitSkins é um mercado online para skins de jogos, especialmente para Counter-Strike 2, Dota 2 e Team Fortress 2. Lançado em 2015.",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.":"Mercado P2P seguro da Hellcase. Criptografado com SSL, verificação KYC, design amigável, preços competitivos, plataforma confiável.",
      "BitSkins P2P is an online platform for buying and selling virtual items, with a focus on CS2 skins. The parent company, BitSkins.":"BitSkins P2P é uma plataforma online para compra e venda de itens virtuais, com foco em skins de CS2. A empresa-mãe, BitSkins.",
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improve.":"Plataforma confiável de skins CS2 com aluguel, endossada por YouTubers. Segura, limitada a skins de CS2, taxas aplicáveis, avaliações indicam melhorias.",
      "GamerPay is a trusted platform for buying and selling CS2 skins, with a free selling option, secure transactions, and high-quality skin inspection tool.":"GamerPay é uma plataforma confiável para compra e venda de skins de CS2. Venda gratuita, transações seguras, inspeção de skins de alta qualidade.",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.":"CSGO Market é um mercado P2P online que oferece uma plataforma segura para comprar e vender skins de CS2. Estabelecido em 2015.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust and Dota 2 skins and items. The platform was founded in 2020.":"Lis-Skins é um mercado popular para itens do Steam, especialmente skins e itens de CS2, Rust e Dota 2. A plataforma foi fundada em 2020.",
      "WhiteMarket is a P2P platform for CS2 skin trading. It offers secure trades, various deposit options, and community engagement.":"WhiteMarket é uma plataforma P2P segura para negociação de skins de CS2 com opções de depósito e envolvimento da comunidade.",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS2, Dota 2, Rust, and Team Fortress 2. Working since 2016.":"CS.Deals é uma plataforma para comprar, vender e trocar skins de jogos populares como CS2, Dota 2, Rust e Team Fortress 2 desde 2016.",
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.":"SkinBid é um mercado online para skins de CS2 e itens de jogos, oferecendo recursos de compra, venda e leilão com uma interface amigável.",
      "LOOT.Farm is an online platform that offers users the ability to Trade virtual items from popular games like CS2, Dota 2, Team Fortress 2, and Rust.":"LOOT.Farm é uma plataforma online para negociação de itens virtuais de jogos populares como CS2, Dota 2, TF2 e Rust.",
      "SkinBaron is an online platform based in Germany that enables users to buy and sell their CS2 skins. The platform has gained a good reputation.":"SkinBaron é uma plataforma online alemã para compra e venda de skins de CS2 com boa reputação.",
      "Gamdom is one of the best CS2 Match Betting Sites. You can play Roulette, Wheel, Crash, Slots and many more!":"A Gamdom é um dos melhores sites de apostas em partidas de CS2. Você pode jogar Roleta, Roda da Sorte, Crash, Caça-níqueis e muitos outros!",
      "SkinCashier is an online platform that allows players to Instant Sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier é uma plataforma online de venda instantânea de skins de CS2, Rust, Dota 2 e TF2 por dinheiro real desde 2020.",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS2, Dota 2, RUST, and TF2.": "Avan.Market é uma plataforma online que oferece aos usuários a oportunidade de vender skins de jogos populares como CS2, Dota 2, RUST e TF2.",
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash é uma plataforma confiável com avaliações positivas e mais de seis anos de operação, mas preços não são os melhores.",
      "CYBERSHOKE is a website that provides servers for playing CS2. It offers various servers for players to choose.":"A CYBERSHOKE é um site que disponibiliza servidores para jogar CS2. Ele oferece vários servidores para os jogadores escolherem.",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "Este site facilita o aumento de nível no Steam. Venda emojis e fundos de perfil em troca de cartas de troca do Steam para subir de nível rapidamente.",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "O SteamLevelU é uma plataforma legítima para comprar pacotes de cartas de troca do Steam e aumentar o nível da sua conta Steam.",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "SteamLevels é um site fácil de usar que ajuda a aumentar o nível da sua conta Steam através da compra de pacotes de cartas e da aceitação de skins do CSGO.",
      "RustStake is a Rust skin gambling platform that offers a range of games, including jackpot, and coinflip. Easily enter and withdraw items from games.": "O RustStake é uma plataforma de apostas de skins de Rust com jogos como jackpot e coinflip. Fácil entrada e retirada de itens.",
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.":"Confiável para negociar skins de Rust. Design intuitivo, bônus de inscrição grátis e recompensas diárias para uma experiência de negociação tranquila.",
      "Shuffle.com is a comprehensive crypto casino with a unique registration process, original games, a VIP program, and plans for future expansion.":"O Shuffle.com é um cassino cripto completo com registro único, jogos originais e programa VIP, com planos de expansão.",
      "CashoutCSGO is a platform solely dedicated to selling CS2 skins for crypto or paypal, offering a convenient conversion service.":"O CashoutCSGO é uma plataforma exclusivamente dedicada à venda de skins do CS2, oferecendo um serviço de conversão conveniente.",
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.":"Notável mercado online, vasta oferta de jogos a cartões-presente, taxas reduzidas, reputação excelente, interface intuitiva.",
      "Withdraw BTC, ETH, LTC or PayPal!":"Retire BTC, ETH, LTC ou PayPal!",
      "Withdraw Money, Skins or Devices!":"Levantar dinheiro, skins ou dispositivos!",
      "Withdraw BTC, LTC, ETH and many else!":"Retire BTC, LTC, ETH e muito mais!",
      "Withdrawal of many types of cryptocurrencies !":"Retirada de vários tipos de criptomoedas!",
      "Withdraw CS2 Skins, Crypto or Real Money!": "Retirar Skins do CS2, Criptomoedas ou Dinheiro!",
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": "Retirar Itens do CS2, Dota 2, TF2 ou Rust!",
      "Withdraw CS2 Skins, Crypto or Game Keys!": "Retirar Skins do CS2, Criptomoedas ou Jogos!",
      "Withdraw CS2 Skins, Crypto or PayPal!": "Retirar Skins do CS2, Criptomoedas ou PayPal!",
      "Withdraw Money, CS2, TF2 or Rust Skins!": "Retirar Dinheiro, Skins do CS2, TF2 ou Rust!",
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": "Retirar Skins do CS2, Dota 2 e Itens do H1Z1!",
      "Withdraw CS2, Rust Skins and Dota 2 Items!": "Retirar Skins do CS2, Rust e Itens do Dota 2!",
      "Withdraw Rust Skins, Crypto or PayPal!": "Saque Skins do Rust, Criptomoedas ou PayPal!",
      "Withdraw Rust Skins or Crypto!": "Retire Skins do Rust ou Criptomoedas!",
      "Withdraw Rust Skins and Items!": "Retire Skins e Itens do Rust!",
      "Withdraw with many-many ways.": "Retirar de várias-muitas maneiras.",
      "Buy Games, Gift Cards and many-many more.": "Compre Jogos, Cartões e Muito Mais.",
      "Withdraw Crypto, gift cards or real money!": "Retire Crypto, cartões presente ou dinheiro!",
      "Withdraw CS2 Skins, Gift Cards or Crypto!": "Retire Skins, Cartões Presente ou Criptomoedas!",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "Retire Bitcoin, Ethereum ou Litecoin!",
      "Withdraw Games, GiftCards and many more!": "Retire Jogos, Cartões Presente e muito mais!",
      "Withdraw Crypto or Real Money!": "Retire Criptomoedas ou Dinheiro Real!",
      "Withdraw Crypto and Gift Cards!": "Levantar Criptomoedas e Cartões de Presente!",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "Levantar BTC, LTC, USDT, USDC ou ETH!",
      "Withdraw CS2 Skins or Items!": "Levantar Skins ou Itens de CS2!",
      "Withdraw Games, GiftCards or Dota2 & TF2 Items!": "Levantar Jogos ou Itens de Dota2 e TF2!",
      "Withdraw Games, GiftCards or Donate to Charity!": "Levantar Jogos, Cartões de Presente!",
      "Participate in Giveaways and win Steam Games.": "Participar em Sorteios e ganhar Jogos da Steam.",
      "Withdraw CS2 And Rust Skins or Crypto!": "Retirar Skins do CS2 e Rust ou Criptomoedas!",
      "Withdraw CS2 Skins or real Money!": "Retirar Skins do CS2 ou Dinheiro Real!",
      "Withdraw Steam Trading cards or Games.": "Retirar Cartas do Steam ou Jogos.",
      "Withdraw USDT, Skins or Real Money!": "Retirar USDT, Skins ou Dinheiro Real!",
      "Withdraw Money, CS2 or Rust Skins!": "Retirar Dinheiro, Skins do CS2 ou Rust!",
      "Withdraw Money, Crypto or Skins!": "Retirar Dinheiro, Criptomoedas ou Skins!",
      "Withdraw CS2 Skins or Crypto!": "Retirar Skins do CS2 ou Criptomoedas!",
      "Withdraw Money, Crypto or PayPal!": "Retirar Dinheiro, Criptomoedas ou PayPal!",
      "WITHDRAW WITH P2P CS2 SKINS.": "Retirar com Skins do CS2 P2P.",
      "Withdraw Real Money or Crypto!": "Retirar Dinheiro Real ou Criptomoedas!",
      "Withdraw BTC, ETH, USDT or Tron!": "Retirar BTC, ETH, USDT ou Tron!",
      "Withdraw CS2 Skins or PayPal!": "Retirar Skins do CS2 ou PayPal!",
      "Withdraw CS2 Skins and Items!": "Retirar Skins e Itens do CS2!",
      "Withdraw Steam Trading cards.": "Retirar Cartas de Negociação do Steam.",
      "1h, 24h and 7d Giveaways": "Sorteios de 1h, 24h e 7d",
      "24h Giveaway": "Sorteio de 24h",
      "3h and 24h Giveaway": "Sorteios de 3h e 24h",
      "Daily and Weekly Giveaways": "Sorteios Diários e Semanais",
      "1h Giveaway": "Sorteio de 1h",
      "1h, 24h Giveaways": "Sorteios de 1h e 24h",
      "Rare Giveaways": "Sorteios Raros",
      "Weekly Giveaways": "Sorteios Semanais",
      "Daily Giveaways": "Sorteios Diários",
      "Deposit Required": "Depósito Necessário",
      "+360% Deposit Bonus": "+360% Bónus de Depósito",
      "+100% Deposit Bonus": "+100% Bónus de Depósito",
      "+10% Deposit Bonus": "+10% Bónus de Depósito",
      "+5% Deposit Bonus": "+5% Bónus de Depósito",
      "+1% Deposit Bonus": "+1% Bónus de Depósito",
      "70 Free Spins": "70 Rodadas Grátis",
      "Every 24h Reward": "Recompensa a Cada 24 Horas",
      "Daily Case": "Caixa Diária",
      "Daily Faucet": "Faucet Diário",
      "Daily Roll": "Rolar Diário",
      "Daily Coins": "Moedas Diárias",
      "Faucet and Giveaways": "Faucet e Sorteios",
      "Daily 0.02$": "0,02$ Diários",
      "Daily 0.02$ + Free Case": "0,02$ Diários + Caixa Grátis",
      "360% Deposit Bonus":"360% Bónus de Depósito",
      "Deposit Bonus":"Bónus de Depósito",
      "Visit WebSite": "Visite o Site",
      "Visit WebSite or Copy": "Visite o Site ou Copie",
      "100% deposit bonus": "Bônus de depósito de 100%",
      "+3% Sell Bonus": "Bônus de venda de +3%",
      "5% deposit bonus": "Bônus de depósito de 5%",
      "5 Free Cases": "5 Caixas Grátis",
      "Free 50 Gems": "50 Gemas Grátis",
      "3 Free Cases": "3 Caixas Grátis",
      "Free 5€": "5€ Grátis",
      "1.5$ For Free": "1,5$ grátis",
      "5$ For Free": "5$ grátis",
      "Free 1.00$": "1,00$ grátis",
      "Free 0.90$": "0,90$ grátis",
      "Free 0.50$": "0,50$ grátis",
      "Free 0.40$": "0,40$ grátis",
      "Free 0.30$": "0,30$ grátis",
      "Free 0.25$": "0,25$ grátis",
      "Free 0.20$": "0,20$ grátis",
      "Free 0.15$": "0,15$ grátis",
      "Free 0.10$": "0,10$ grátis",
      "Free 0.05$": "0,05$ grátis",
      "Free Case": "Caixa Grátis",
      "Free 1$": "1$ grátis",
      "Free 2$": "2$ grátis",
      "Free 1$": "1$ grátis",
      "Big Daily Giveaways": "Grandes Sorteios Diários",
      "Free Case up to 250$": "Caixa Grátis até 250$",
      "Daily Giveaway": "Sorteio Diário",
      "Free 100 Diamonds": "100 Diamantes Grátis",
      "500 coins": "500 moedas",
      "Daily Cases": "Caixas Diárias",
      "3 Energy Points": "3 Pontos de Energia",
      "Free 200 Coins": "200 Moedas Grátis",
      "some free coins": "algumas moedas grátis",      
      "Free 2$": "2$ Grátis",
      "Free spins": "Rodadas Grátis",
      "Offerwall": "Parede de Ofertas",
      "x2 Mining Rate": "Taxa de Mineração x2",
      "Games Giveaways": "Distribuição de Jogos"
    },
    "ru": {
      "CSGO500 probably the best CS2 Gambling Site. Regular rains, giveaways and promocodes. You can play many games and slots.": "CSGO500, вероятно, является лучшим сайтом для азартных игр в CS2. Здесь регулярно проводятся раздачи и розыгрыши.",
      "CSGORoll is one of the most popular sites. Which includes roulette, crash and many more. Now testing e-sports betting.": "CSGORoll - один из самых популярных сайтов, который включает в себя рулетку, крэш и многие другие игры включая ставки на киберспорт.",
      "CSGOEmpire is one of the most popular site. Which includes roulette and coinflip. Working since 2016. Match Betting in priority.": "CSGOEmpire - один из самых популярных сайтов, предлагающий игру в Рулетку и Монетку. Кроме того, на сайте доступны ставки на матчи.",
      "CSGOPolygon is a legendary site like CSGODouble with classic Roulette, but have Dices, Crash, Slots and even Esports Betting!": "CSGOPolygon - это легендарный сайт, похожий на CSGODouble, с классической рулеткой, но имеющий еще множество режимов и ставки.",
      "Gamdom Casino offers a variety of in-house games, innovative social engagement, provably fair system, and good reputation in online gaming.": "Сайт Gamdom является одним из лучших сайтов для гемблинга в CS2. Здесь вы можете сыграть в рулетку, краш, слоты и многие другие игры!",
      "CSGOPOSITIVE is a famous esports betting site with interesting system of cashback, you can bet skins or money. Has various payments options.": "CSGOPOSITIVE - это известный сайт для ставок на киберспорт. Здесь вы можете делать ставки как скинами, так и настоящими деньгами!",
      "Rollbit is a new Casino site which includes Sport Betting and many classic games like roulette. Includes Daily Bonuses !": "Rollbit - новый сайт казино, который включает в себя ставки на спорт и множество классических игр, таких как рулетка и коинфлип.",
      "CSGOLuck is a licensed CSGO skin gambling site that accepts multiple deposit methods, offering various games and a user-friendly design.": "СSGOLuck - относительно новый сайт, где доступны игры в рулетку, Crash, мини-игры Mines и Towers, открытие кейсов и слоты.",
      "Duelbits is a safe and licensed online casino with a variety of games, sports betting, esports betting, and instant cryptocurrency transactions.": "Duelbits - это огромное крипто-казино с классическими азартными играми для сообщества CS2, такими как рулетка, монетка и другие.",
      "InsaneGG is an online platform that offers a range of CSGO skin gambling games with professionally designed and smooth animations.": "InsaneGG - это онлайн-платформа, которая предлагает широкий спектр игр на CS2 скины с красивыми и плавными анимациями.",
      "Rustix - gambling platform for CS2 and Rust with original games, fair gameplay, bonuses, and impressive animations. Opened in 2023.": "Rustix - игровая платформа для CS2 и Rust с оригинальными играми, честным геймплеем, бонусами и впечатляющей анимацией.",
      "CSGO-Skins is a reputable online platform where users can open custom CS2 cases and participate in daily Giveaways.": "CSGO-Skins - это надежная онлайн-платформа, где пользователи могут открывать индивидуальные кейсы CS2 и участвовать в раздачах.",
      "FlameCases is an online platform that permits users to open cases for CS2 and Dota 2. Since its launch in 2017, the website provides various features.": "FlameCases - это онлайн-платформа, которая позволяет пользователям открывать кейсы для CS2 и Dota 2. Работает еще с 2017.",
      "KNIFEX is a CS2 gambling site that offers a range of game modes, including case opening, case battles, coinflip, crash, clash and many more!": "KNIFEX - это сайт CS2 азартных игр, который предлагает различные режимы игры, включая открытие кейсов, битвы кейсов и многое другое!",
      "DatDrop is a website that specializes in opening cases that contain skins from CS2. Its most prominent feature is the case-opening battles.": "DatDrop - это сайт, специализирующийся на открытии кейсов со скинами из CS2. Основной режим кейс батл.",
      "DaddySkins is a valid CSGO case opening website that has been in operation since 2017, and it offers Case Openings, Case Battles, and Upgrader.": "DaddySkins - это легальный сайт открытия кейсов в CS2, который работает с 2017 года. На нем так же есть кейс батл и апгрейдер.",
      "Clash.gg is a new CS2 Gambling site which includes many games like Roulette, Upgrader, Cases and many more !": "Clash.gg - это новый сайт для азартных игр CS2, который включает в себя множество игр, таких как Рулетка, Апгрейдер, Кейсы и многие другие!",
      "HellStore is a platform that allows users to participate in CSGO skin betting through game modes like Coinflip, Jackpot, Upgrader, and Wheel.": "HellStore - это платформа, которая позволяет пользователям участвовать в ставках на скины CSGO через большое количество игровых режимов",
      "Hellcase is an online platform that allows users to purchase virtual cases filled with skins and items for various games such as CS2, Dota 2, and Rust.": "Платформа Hellcase предоставляет возможность пользователям приобретать виртуальные кейсы CS2, Dota 2 и Rust.",
      "CSGOBIG - a gambling site for CS2 skins with game modes like Jackpot, Coinflip, Roulette, Cases, and Case Battles. Opened in 2015.": "Сайт азартных игр с использованием скинов из игры CS2, включающий такие режимы, как Jackpot, Coinflip, Roulette, Cases и Case Battles.",
      "CSGOFast is a CSGO skin gambling site that offers a wide range of exclusive game modes. One of the earliest CSGO gambling sites.": "CSGOFast - это сайт для азартных игр на скины CSGO, который предлагает широкий выбор эксклюзивных игровых режимов.",
      "CSGOLive is a safe and legitimate CS2 case opening website with custom cases, daily bonuses, and a Provably Fair system.": "CSGOLive - это старый классический сайт открытия кейсов CS2, где вы можете создавать свои собственные кейсы. Включает ежедневные бонусы!",
      "WTFSkins is a reliable and popular online platform offering unique games, daily rewards, and a simple registration process.": "WTFSkins предоставляет классические игры азартного характера для CS2, такие как Джекпот, Рулетка и Крэш.",
      "Key-Drop is a reputable online gambling platform that offers various activities like Case Battles and Upgrader, as well as custom CSGO skin cases.": "Key-Drop - это надежная платформа для онлайн-гемблинга, которая предлагает различные игры, такие как битвы кейсов и апгрейдер.",
      "Farmskins is a well-known CSGO case opening website that has been operating since 2016, offering a wide selection of skins for players to unbox.": "Farmskins - это известный сайт для открытия кейсов в CS2, который работает с 2016 года и предлагает широкий выбор скинов для игроков.",
      "Bets4.pro is an online platform that offers users the ability to place bets on esports matches, particularly for CS2 , Dota 2, Valorant and many more.": "Bets4.pro - это онлайн-платформа, которая позволяет пользователям делать ставки на матчи в киберспорте, в особенности на CS2 и Dota 2.",
      "DMarket is a reliable and popular marketplace for Steam items, with a large number of items available and positive reviews on Trustpilot.": "DMarket - это надежный и популярный онлайн-маркетплейс для предметов Steam, с большим количеством товаров и положительными отзывами.",
      "BitSkins is an online marketplace for in-game skins, particularly for Counter-Strike 2, Dota 2, and Team Fortress 2. Launched in 2015.": "BitSkins - это онлайн-маркетплейс для игровых скинов, особенно для игр Counter-Strike 2, Dota 2 и TF 2. Он был запущен в 2015 году.",
      "Secure P2P marketplace owned by Hellcase. SSL-encrypted, KYC verification, friendly design, competitive pricing, trusted trading platform.": "Безопасная пиринговая площадка, принадлежащая Hellcase. Защита SSL, KYC-проверка, удобный дизайн, достойные цены, доверенный сайт.",
      "CSGO Market is an online P2P marketplace that provides a safe and secure platform for buying and selling CS2 skins. Established in 2015.": "CSGO Market - это онлайн-рынок P2P, который обеспечивает безопасную и защищенную платформу для покупки и продажи скинов в CS2.",
      "Lis-Skins is a popular marketplace for Steam items, especially CS2, Rust and Dota 2 skins and items. The platform was founded in 2020.": "Lis-Skins - это популярная торговая площадка для предметов Steam, особенно для скинов и предметов в играх CS2, Rust и Dota 2.",
      "CS.Deals is a platform that allows users to buy, sell, and trade skins from popular games such as CS2, Dota 2, Rust, and Team Fortress 2. Working since 2016.": "CS.Deals - это платформа, которая позволяет пользователям покупать, продавать и обменивать скины из CS2, Dota 2, Rust и Team Fortress 2.",
      "LOOT.Farm is an online platform that offers users the ability to Trade virtual items from popular games like CS2, Dota 2, Team Fortress 2, and Rust.": "LOOT.Farm - это онлайн-платформа, которая предоставляет услуги Обмена и Покупки предметов из CS2, Dota 2, Team Fortress 2 и Rust.",
      "SkinCashier is an online platform that allows players to Instant Sell their CS2, Rust, Dota 2, and TF2 skins for real money. Operating since 2020.": "SkinCashier - это сайт, который позволяет игрокам моментально продавать свои скины из CS2, Rust, Dota 2 и TF2 за настоящие деньги.",
      "Avan.Market is an online platform that offers users the opportunity to sell gaming skins from popular games like CS2, Dota 2, RUST, and TF2.": "Avan.Market - это онлайн-платформа, которая предоставляет возможность моментально продавать игровые скины из CS2, Dota 2, RUST и TF2.",
      "Skins.Cash is a reputable platform with positive reviews, reliable customer support, and over six years of operation. Pricing not the best one.": "Skins.Cash - надежная платформа с положительными отзывами, надежной поддержкой клиентов и более чем шестилетним опытом работы.",
      "This site was created for easy leveling up Steam, you can sell emojis and profile backgrounds for Steam Trading Cards to fast level up.": "Этот сайт был создан для упрощения процесса повышения уровня в Steam. Вы можете продавать предметы Steam за карточки, чтобы повысить уровень.",
      "SteamLevelU is a legitimate platform to buy Steam trading card packs for enhancing Steam account levels, associated with SH Level Up.": "SteamLevelU - это честный сайт, где можно купить наборы карточек Steam для повышения уровней аккаунта в Steam. Она связана с SH Level Up.",
      "SteamLevels is a user-friendly website that helps increase your Steam account level by purchasing card packs and accepting CSGO skins.": "Удобный сайт, который помогает повысить уровень вашей учетной записи Steam путем покупки наборов карточек, принимаются скины CS2.",
      "SkinBid is an online marketplace for CS2 skins and in-game items, offering buying, selling, and auctioning features with a user-friendly interface.": "Торговая Площадка для скинов и предметов CS2, предлагающая возможность покупки, продажи и аукциона с удобным интерфейсом.",
      "WhiteMarket is a P2P platform for CS2 skin trading. It offers secure trades, various deposit options, and community engagement.": "WhiteMarket - это P2P платформа для торговли скинами CS2. Безопасные сделки, различные варианты депозита и взаимодействие с сообществом.",
      "Trusted CS2 skin platform with rentals, endorsed by YouTubers. Secure, limited to CS2 skins, fees apply, and user reviews indicate room for improve.": "Надежная платформа для скинов CS2 с возможностью аренды, рекомендованная Ютуберами. Безопасная, с доступной комиссией.",
      "SkinSwap is an online platform that allows players to trade and sell skins from popular games such as CS2 and Rust. Owned and operated by RustySell.": "SkinSwap - онлайн-платформа, которая позволяет игрокам обменивать и продавать скины из популярных игр CS2 и Rust.",
      "Tradeit is an online marketplace that offers players the opportunity to trade, buy, and sell skins for a variety of games, including CS2. Working since 2017.": "Tradeit - это онлайн-маркетплейс, который предлагает игрокам возможность торговать, покупать и продавать скины для различных игр.",
      "CSGOSelly is a website that allows users to cash out their CSGO skins for money via various payment methods. It was founded in 2021.": "CSGOSelly - это сайт, который позволяет быстро продать свои скины CS2 за деньги через различные способы вывода. Основан в 2021 году.",
      "BC.Game is an online casino and sportsbook that was launched in 2017, offering over 8,000 games including proprietary and probably fair games.": "BC.Game - это онлайн-казино и букмекерская контора, запущенные в 2017 году. Они предлагают более 8000 игр с прозрачной системой.",
      "Roobet is an online casino that allows users to play games using cryptocurrency. The platform has a reputation for being legitimate and safe.": "Roobet - это онлайн-казино, которое позволяет пользователям играть в игры с использованием криптовалюты. Платформа с чистой репутацией.",
      "HypeUp is owned by the same operators of two popular betting sites, CSGORoll and HypeDrop. Offers two original games and Slots with Live Games.": "HypeUp принадлежит тем же операторам, что и два популярных сайта для ставок - CSGORoll и HypeDrop. Сайт предлагает Слоты.",
      "HowlGG is a Rust skin gambling platform that offers a range of games, including jackpot, coinflip, slots, and live casino games.": "HowlGG - это платформа для азартных игр с использованием скинов из игры Rust. Можно найти джекпот, Монетку, Слоты и Игры с живыми дилерами.",
      "iTrade.gg is a Trusted platform for trading rust skins. User-friendly design, free sign-up bonus, and daily rewards create a seamless trading experience.":"iTrade.gg - это надежная платформа для обмна скинами Rust. Удобный дизайн, Бонусы при регистрации и Ежедневные Награды.",
      "Shuffle.com is a comprehensive crypto casino with a unique registration process, original games, a VIP program, and plans for future expansion.":"Shuffle.com - это всеобъемлющее крипто-казино с оригинальными играми, VIP-программой и планами на будущее расширение.",
      "Notable online marketplace, vast offerings from games to gift cards, reduced rates, stellar reputation, intuitive interface, up to 98% discounts.":"Известный онлайн-магазин, огромный ассортимент от игр до подарочных карт, отличная репутация, удобный интерфейс, скидки до 98%.",
      "Withdraw CS2 Skins, Crypto or Real Money!": "Выводите скины CS2, криптовалюту или деньги!",
      "Withdraw CS2, Dota 2, TF2 or Rust Items!": "Выводите предметы CS2, Dota 2, TF2 или Rust!",
      "Withdraw CS2 Skins, Crypto or Game Keys!": "Выводите скины CS2, криптовалюту или Игры!",
      "Withdraw CS2 Skins, Crypto or PayPal!": "Выводите скины CS2, Криптовалюту или PayPal!",
      "Withdraw Money, CS2, TF2 or Rust Skins!": "Выводите Деньги, Скины CS2, TF2 или Rust!",
      "Withdraw CS2 Skins, Dota 2 and H1Z1 Items!": "Выводите предметы CS2, Dota 2 и H1Z1!",
      "Withdraw CS2, Rust Skins and Dota 2 Items!": "Выводите предметы CS2, Dota 2 и Rust!",
      "Withdraw Bitcoin, Ethereum or Litecoin!": "Выводите Bitcoin, Ethereum или Litecoin!",
      "Withdraw CS2 And Rust Skins or Crypto!": "Выводите скины CS2, Rust или Крипту!",
      "Withdraw CS2 Skins or real Money!": "Выводите скины CS2 или деньги на Карту!",
      "Withdraw Rust Skins and Items!": "Вывод только скинами Rust!",
      "Withdraw Steam Trading cards or Games.": "Выводите Steam Trading cards или Игры.",
      "Withdrawal of many types of cryptocurrencies !":"Вывод большинства видов крипто!",
      "Withdraw USDT, Skins or Real Money!": "Выводите USDT, Скины или Реальные Деньги",
      "Withdraw BTC, LTC, USDT, USDC or ETH!": "Выводите BTC, LTC, USDT, USDC или ETH!",
      "Buy Games, Gift Cards and many-many more.": "Покупайте игры и подарочные карты.",
      "Withdraw Money, CS2 or Rust Skins!": "Выводите Деньги, скины CS2 или Rust!",
      "Withdraw Money, Crypto or Skins!": "Выводите Деньги, Криптовалюту или Скины!",
      "Withdraw CS2 Skins or Crypto!": "Выводите скины CS2 или криптовалюту!",
      "Withdraw Money, Crypto or PayPal!": "Выводите Деньги, Крипту или PayPal!",
      "WITHDRAW WITH P2P CS2 SKINS.": "Вывод только скинами CS2 через P2P!",
      "Withdraw Rust Skins or Crypto!": "Выводите скины Rust или криптовалюту!",
      "Withdraw Real Money or Crypto!": "Выводите Реальные Деньги или Крипту!",
      "Withdraw BTC, ETH, USDT or Tron!": "Выводите BTC, ETH, USDT или Tron!",
      "Withdraw CS2 Skins or PayPal!": "Выводите скины CS2 или PayPal!",
      "Withdraw CS2 Skins and Items!": "Вывод только скинами CS2!",
      "Withdraw Steam Trading cards.": "Выводите Steam Trading cards.",
      "Visit WebSite": "Посетить Сайт",
      "Visit WebSite or Copy": "Посетить Сайт",
      "100% deposit bonus": "+100% к Пополнению",
      "+3% Sell Bonus": "+3% Бонус к Продаже",
      "5% deposit bonus": "+5% к Пополнению",
      "5 Free Cases": "5 Бесплатных Кейсов",
      "Free 50 Gems": "50 Камней Бесплатно",
      "3 Free Cases": "3 Бесплатных Кейса",
      "1.5$ For Free": "1.5$ Бесплатно",
      "5$ For Free": "5$ Бесплатно",
      "Free 0.90$": "0.90$ Бесплатно",
      "Free 0.50$": "0.50$ Бесплатно",
      "Free 0.40$": "0.40$ Бесплатно",
      "Free 0.30$": "0.30$ Бесплатно",
      "Free 0.25$": "0.25$ Бесплатно",
      "Free 0.05$": "0.05$ Бесплатно",
      "Free Case": "Бесплатный Кейс",
      "Free 1$": "1$ Бесплатно",
      "Free 2$": "2$ Бесплатно",
      "Free 1$": "1$ Бесплатно",
      "Free spins": "ФриСпины"
    }
  };
  console.log("Translation complete."); // Убедимся, что перевод завершен


  var currentTranslations = translations[languageTag] || {};

  var elements = parentElement.querySelectorAll(".box .content p, .box .logobg .best, .box .content button");
  for (var j = 0; j < elements.length; j++) {
    var text = elements[j].textContent.trim();
    if (currentTranslations.hasOwnProperty(text)) {
      elements[j].innerHTML = currentTranslations[text];
    }
  }
}

window.onload = function() {
  importDivContent();
};

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')  && !window.location.pathname.includes("/topic/") && !window.location.pathname.includes('/reviews/') && !window.location.pathname.includes('/mirrors/')) {
  function updateURLs(parentElement) {
    var links = parentElement.querySelectorAll('a[href]');
    var regex = /^(https?:\/\/[^/]+)?(\/.*)$/;
  
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      
      if (href.includes('vk.com')) {
        continue;
      }
      
      var match = href.match(regex);
      if (match) {
        var domain = match[1] || '';
        var path = match[2];
        var updatedHref = '/ru' + path;
        links[i].setAttribute('href', updatedHref);
      }
    }
  }

  var SitesList = document.querySelector('.boxes-holder');
  updateURLs(SitesList);
}

if (!window.location.pathname.startsWith("/rust") &&  !window.location.pathname.includes("/topic") && !window.location.pathname.includes("/reviews")) {

  function translateURLsMain(parentElement, languageTag) {
    var links = parentElement.querySelectorAll('a[href]');
    var supportedLanguages = ['hi', 'tr', 'pt', 'es', 'ru'];
    
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      
      if (!href) continue;
      
      var url = new URL(href, window.location.href);
      var path = url.pathname;
      var langIncluded = supportedLanguages.some(lang => {
        var langWithSlashes = '/' + lang + '/';
        return path.includes(langWithSlashes);
      });
      
      if (languageTag !== 'en') {
        if (!langIncluded && supportedLanguages.includes(languageTag)) {
          path = '/' + languageTag + path;
          url.pathname = path;
          links[i].setAttribute('href', url.href);
        }
      }
    }
  
    var translations = {
      "ru": {
        "CS2 Sites List": "Халява CS2",
        "Rust Sites List": "Халява Rust",
        "Dota 2 Sites List": "Халява Dota 2",
        "Crypto Sites List": "Крипто Халява",
        "Newest Sites": "Новые Сайты",
        "Freebies Only": "Вся Халява",
        "Earning Sites": "Заработок",
        "Steam Sites": "Сайты Steam",
        "Gambling Sites": "Игральные Сайты",
        "Earn by Play CS2": "Заработок на Игре в CS2",
        "All Sites": "Все Сайты",
        "Match Betting": "Ставки на Матчи",
        "Case Opening": "Кейсы",
        "Roulette": "Рулетка",
        "Coinflip": "Коинфлип",
        "Crash": "Краш",
        "Casino": "Казино",
        "Jackpot": "Джекпот",
        "Upgrader": "Апгрейдер",
        "Dice": "Кости",
        "Bonus Types": "Типы Халявы",
        "Sign Up Bonuses": "Бонус за Регистрацию",
        "Deposit Bonuses": "Бонус к Депозиту",
        "Daily Rewards": "Ежедневный Бонус",
        "Giveaways": "Розыгрыши",
        "Offerwall Sites": "Задания",
        "Earn by Play Sites": "Заработок на Игре",
        "Buy or Sell Skins": "Купить/Продать Скины",
        "Buy or Sell Items": "Купить/Продать Предметы",
        "Marketplaces": "Торговые Площадки",
        "Instant Sell": "Моментальная Продажа",
        "Buy Items": "Купить Предметы",
        "Sell Items": "Продать Предметы",
        "Trade Items": "Обменять Предметы",
        "Buy Skins": "Купить Скины",
        "Sell Skins": "Продать Скины",
        "Trade Skins": "Обменять Скины",
        "Steam Level Up": "Увеличить Уровень Steam",
        "Buy Steam Games": "Купить Игры Steam"
      },
      "hi": {
        "CS2 Sites List": "CS2 साइटों की सूची",
        "CS2 Sites List": "CS2 साइटों की सूची",
        "Rust Sites List": "Rust साइटों की सूची",
        "Dota 2 Sites List": "डोटा 2 साइटों की सूची",
        "Crypto Sites List": "क्रिप्टो साइटों की सूची",
        "Newest Sites": "सबसे नई साइटें",
        "Freebies Only": "केवल मुफ्त आइटम",
        "Earning Sites": "आमदनी वाली साइटें",
        "Steam Sites": "स्टीम से संबंधित साइटें",
        "Gambling Sites": "जुआ खेलने के लिए साइटें",
        "Earn by Play CS2": "CS2 खेलकर कमाएं",
        "All Sites": "सभी साइटें",
        "Match Betting": "मैच पर शर्त लगाएं",
        "Case Opening": "केस खोलें",
        "Roulette": "रूलेट",
        "Coinflip": "कॉइनफ्लिप",
        "Crash": "क्रैश",
        "Casino": "कैसीनो",
        "Jackpot": "जैकपॉट",
        "Upgrader": "अपग्रेडर",
        "Dice": "पासा",
        "Bonus Types": "बोनस के प्रकार",
        "Sign Up Bonuses": "साइन अप के बोनस",
        "Deposit Bonuses": "जमा करने के बोनस",
        "Daily Rewards": "रोज़ाना की पुरस्कार",
        "Giveaways": "उपहार",
        "Offerwall Sites": "ऑफ़रवॉल से संबंधित साइटें",
        "Earn by Play Sites": "खेलकर कमाने वाली साइटें",
        "Buy or Sell Skins": "स्किन खरीदें या बेचें",
        "Buy or Sell Items": "आइटम खरीदें या बेचें",
        "Marketplaces": "मार्केटप्लेस",
        "Instant Sell": "तत्काल बेचें",
        "Buy Items": "आइटम खरीदें",
        "Sell Items": "आइटम बेचें",
        "Trade Items": "आइटम विनिमय करें",
        "Buy Skins": "स्किन खरीदें",
        "Sell Skins": "स्किन बेचें",
        "Trade Skins": "स्किन विनिमय करें",
        "Steam Level Up": "स्टीम स्तर बढ़ाएं",
        "Buy Steam Games": "स्टीम गेम्स खरीदें"
      },
      "pt": {
        "CS2 Sites List": "Sites de CS2",
        "Rust Sites List": "Sites de Rust",
        "Dota 2 Sites List": "Sites de Dota 2",
        "Crypto Sites List": "Sites de Crypto",
        "Newest Sites": "Sites Mais Recentes",
        "Freebies Only": "Apenas Brindes",
        "Earning Sites": "Sites para Ganhar",
        "Steam Sites": "Sites do Steam",
        "Gambling Sites": "Sites de Jogos de Azar",
        "Earn by Play CS2": "Ganhe Jogando CS2",
        "All Sites": "Todos os Sites",
        "Match Betting": "Apostas em Jogos",
        "Case Opening": "Abertura de Caixas",
        "Roulette": "Roleta",
        "Coinflip": "Cara ou Coroa",
        "Crash": "Crash",
        "Casino": "Cassino",
        "Jackpot": "Jackpot",
        "Upgrader": "Upgrader",
        "Dice": "Dados",
        "Bonus Types": "Tipos de Bônus",
        "Sign Up Bonuses": "Bônus de Cadastro",
        "Deposit Bonuses": "Bônus de Depósito",
        "Daily Rewards": "Recompensas Diárias",
        "Giveaways": "Doações",
        "Offerwall Sites": "Sites de Ofertas",
        "Earn by Play Sites": "Sites para Ganhar Jogando",
        "Buy or Sell Skins": "Comprar ou Vender Skins",
        "Buy or Sell Items": "Comprar ou Vender Itens",
        "Marketplaces": "Mercados",
        "Instant Sell": "Venda Imediata",
        "Buy Items": "Comprar Itens",
        "Sell Items": "Vender Itens",
        "Trade Items": "Trocar Itens",
        "Buy Skins": "Comprar Skins",
        "Sell Skins": "Vender Skins",
        "Trade Skins": "Trocar Skins",
        "Steam Level Up": "Subir de Nível no Steam",
        "Buy Steam Games": "Comprar Jogos do Steam"
      },
      "tr": {
        "CS2 Sites List": "CS2 Siteleri Listesi",
        "Rust Sites List": "Rust Siteleri Listesi",
        "Dota 2 Sites List": "Dota 2 Siteleri Listesi",
        "Crypto Sites List": "Kripto Siteleri Listesi",
        "Newest Sites": "En Yeni Siteler",
        "Freebies Only": "Sadece Bedava Hediyeler",
        "Earning Sites": "Para Kazanma Siteleri",
        "Steam Sites": "Steam Siteleri",
        "Gambling Sites": " Kumar Siteleri",
        "Earn by Play CS2": "CS2 Oynayarak Kazan",
        "All Sites": "Tüm Siteler",
        "Match Betting": "Maç Bahisleri",
        "Case Opening": "Kasa Açma",
        "Roulette": "Rulet",
        "Coinflip": "Tura-Yazı",
        "Crash": "Çökme",
        "Casino": "Kumarhane",
        "Jackpot": "Jackpot",
        "Upgrader": "Yükseltici",
        "Dice": "Zar",
        "Bonus Types": "Bonus Türleri",
        "Sign Up Bonuses": "Kayıt Bonusları",
        "Deposit Bonuses": "Yatırım Bonusları",
        "Daily Rewards": "Günlük Ödüller",
        "Giveaways": "Hediyeler",
        "Offerwall Sites": "Teklif Duvarı Siteleri",
        "Earn by Play Sites": "Oyun Oynayarak Kazan Siteleri",
        "Buy or Sell Skins": "Skins Satın Al veya Sat",
        "Buy or Sell Items": "Eşya Satın Al veya Sat",
        "Marketplaces": "Pazar Yerleri",
        "Instant Sell": "Anında Satış",
        "Buy Items": "Eşya Satın Al",
        "Sell Items": "Eşya Sat",
        "Trade Items": "Eşya Takas Et",
        "Buy Skins": "Skins Satın Al",
        "Sell Skins": "Skins Sat",
        "Trade Skins": "Skins Takas Et",
        "Steam Level Up": "Steam Seviye Atlama",
        "Buy Steam Games": "Steam Oyunları Satın Al"
      },
      "es": {
        "CS2 Sites List": "Lista de sitios de CS2",
        "Rust Sites List": "Lista de sitios de Rust",
        "Dota 2 Sites List": "Lista de sitios de Dota 2",
        "Crypto Sites List": "Lista de sitios de criptomonedas",
        "Newest Sites": "Sitios Más Nuevos",
        "Freebies Only": "Solo regalos gratis",
        "Earning Sites": "Sitios para ganar dinero",
        "Steam Sites": "Sitios de Steam",
        "Gambling Sites": "Sitios de apuestas",
        "Earn by Play CS2": "Gana jugando CS2",
        "All Sites": "Todos los sitios",
        "Match Betting": "Apuestas de partidos",
        "Case Opening": "Apertura de estuches",
        "Roulette": "Ruleta",
        "Coinflip": "Lanzamiento de moneda",
        "Crash": "Choque",
        "Casino": "Casino",
        "Jackpot": "Bote",
        "Upgrader": "Actualizador",
        "Dice": "Dados",
        "Bonus Types": "Tipos de bonos",
        "Sign Up Bonuses": "Bonos de registro",
        "Deposit Bonuses": "Bonos de depósito",
        "Daily Rewards": "Recompensas diarias",
        "Giveaways": "Regalos",
        "Offerwall Sites": "Sitios de oferta",
        "Earn by Play Sites": "Sitios para ganar jugando",
        "Buy or Sell Skins": "Comprar o vender skins",
        "Buy or Sell Items": "Comprar o vender objetos",
        "Marketplaces": "Mercados",
        "Instant Sell": "Venta instantánea",
        "Buy Items": "Comprar objetos",
        "Sell Items": "Vender objetos",
        "Trade Items": "Intercambiar objetos",
        "Buy Skins": "Comprar skins",
        "Sell Skins": "Vender skins",
        "Trade Skins": "Intercambiar skins",
        "Steam Level Up": "Aumentar nivel de Steam",
        "Buy Steam Games": "Comprar juegos de Steam"
      }
    };
  
    var elements = document.querySelectorAll('.category-box-content span, ul .submenu li a');
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations[languageTag] && translations[languageTag].hasOwnProperty(text)) {
        if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
          elements[j].innerHTML = translations[languageTag][text] + ' <i class="bi bi-caret-right-fill"></i>';
        } else {
          elements[j].innerHTML = translations[languageTag][text];
        }
      }
    }
  }
  
  var categorySelector = document.querySelector('.category-selector');
  translateURLsMain(categorySelector, languageTag);
  }

if (!window.location.pathname.startsWith("/rust")) {

  function translateURLs2(parentElement, languageTag) {
    var supportedLanguages = ['hi', 'tr', 'pt', 'es', 'ru'];
    var langWithSlashes = supportedLanguages.map(lang => '/' + lang + '/');
  
    var links = parentElement.querySelectorAll('a[href]');
    for (var i = 0, len = links.length; i < len; i++) {
      var href = links[i].getAttribute('href');
  
      if (!href) continue;
  
      var url = new URL(href, window.location.href);
      var path = url.pathname;
  
      if (languageTag !== 'en') {
        var langIncluded = langWithSlashes.some(lang => path.includes(lang));
        if (!langIncluded && supportedLanguages.includes(languageTag)) {
          path = '/' + languageTag + path;
          url.pathname = path;
          links[i].setAttribute('href', url.href);
        }
      }
    }

    var translations = {
      ru: {
        "CS2 Sites List": "Халява CS2",
        "Rust Sites List": "Халява Rust",
        "Dota 2 Sites List": "Халява Dota 2",
        "Crypto Sites List": "Крипто Халява",
        "Newest Sites": "Новые Сайты",
        "Freebies Only": "Вся Халява",
        "Earning Sites": "Заработок",
        "Steam Sites": "Сайты Steam",
        "Gambling Sites": "Игральные Сайты",
        "Earn by Play CS2": "Заработок на Игре в CS2",
        "All Sites": "Все Сайты",
        "Match Betting": "Ставки на Матчи",
        "Case Opening": "Кейсы",
        "Roulette": "Рулетка",
        "Coinflip": "Коинфлип",
        "Crash": "Краш",
        "Casino": "Казино",
        "Jackpot": "Джекпот",
        "Upgrader": "Апгрейдер",
        "Dice": "Кости",
        "Bonus Types": "Типы Халявы",
        "Sign Up Bonuses": "Бонус за Регистрацию",
        "Deposit Bonuses": "Бонус к Депозиту",
        "Daily Rewards": "Ежедневный Бонус",
        "Giveaways": "Розыгрыши",
        "Offerwall Sites": "Задания",
        "Earn by Play Sites": "Заработок на Игре",
        "Buy or Sell Skins": "Купить/Продать Скины",
        "Buy or Sell Items": "Купить/Продать Предметы",
        "Marketplaces": "Торговые Площадки",
        "Instant Sell": "Моментальная Продажа",
        "Buy Items": "Купить Предметы",
        "Sell Items": "Продать Предметы",
        "Trade Items": "Обменять Предметы",
        "Buy Skins": "Купить Скины",
        "Sell Skins": "Продать Скины",
        "Trade Skins": "Обменять Скины",
        "Steam Level Up": "Увеличить Уровень Steam",
        "Buy Steam Games": "Купить Игры Steam",
      },
      hi: {
        "CS2 Sites List": "CS2 साइटों की सूची",
        "CS2 Sites List": "CS2 साइटों की सूची",
        "Rust Sites List": "Rust साइटों की सूची",
        "Dota 2 Sites List": "डोटा 2 साइटों की सूची",
        "Crypto Sites List": "क्रिप्टो साइटों की सूची",
        "Newest Sites": "सबसे नई साइटें",
        "Freebies Only": "केवल मुफ्त आइटम",
        "Earning Sites": "आमदनी वाली साइटें",
        "Steam Sites": "स्टीम से संबंधित साइटें",
        "Gambling Sites": "जुआ खेलने के लिए साइटें",
        "Earn by Play CS2": "CS2 खेलकर कमाएं",
        "All Sites": "सभी साइटें",
        "Match Betting": "मैच पर शर्त लगाएं",
        "Case Opening": "केस खोलें",
        "Roulette": "रूलेट",
        "Coinflip": "कॉइनफ्लिप",
        "Crash": "क्रैश",
        "Casino": "कैसीनो",
        "Jackpot": "जैकपॉट",
        "Upgrader": "अपग्रेडर",
        "Dice": "पासा",
        "Bonus Types": "बोनस के प्रकार",
        "Sign Up Bonuses": "साइन अप के बोनस",
        "Deposit Bonuses": "जमा करने के बोनस",
        "Daily Rewards": "रोज़ाना की पुरस्कार",
        "Giveaways": "उपहार",
        "Offerwall Sites": "ऑफ़रवॉल से संबंधित साइटें",
        "Earn by Play Sites": "खेलकर कमाने वाली साइटें",
        "Buy or Sell Skins": "स्किन खरीदें या बेचें",
        "Buy or Sell Items": "आइटम खरीदें या बेचें",
        "Marketplaces": "मार्केटप्लेस",
        "Instant Sell": "तत्काल बेचें",
        "Buy Items": "आइटम खरीदें",
        "Sell Items": "आइटम बेचें",
        "Trade Items": "आइटम विनिमय करें",
        "Buy Skins": "स्किन खरीदें",
        "Sell Skins": "स्किन बेचें",
        "Trade Skins": "स्किन विनिमय करें",
        "Steam Level Up": "स्टीम स्तर बढ़ाएं",
        "Buy Steam Games": "स्टीम गेम्स खरीदें",
      },
      pt: {
        "CS2 Sites List": "Sites de CS2",
        "Rust Sites List": "Sites de Rust",
        "Dota 2 Sites List": "Sites de Dota 2",
        "Crypto Sites List": "Sites de Crypto",
        "Newest Sites": "Sites Mais Recentes",
        "Freebies Only": "Apenas Brindes",
        "Earning Sites": "Sites para Ganhar",
        "Steam Sites": "Sites do Steam",
        "Gambling Sites": "Sites de Jogos de Azar",
        "Earn by Play CS2": "Ganhe Jogando CS2",
        "All Sites": "Todos os Sites",
        "Match Betting": "Apostas em Jogos",
        "Case Opening": "Abertura de Caixas",
        "Roulette": "Roleta",
        "Coinflip": "Cara ou Coroa",
        "Crash": "Crash",
        "Casino": "Cassino",
        "Jackpot": "Jackpot",
        "Upgrader": "Upgrader",
        "Dice": "Dados",
        "Bonus Types": "Tipos de Bônus",
        "Sign Up Bonuses": "Bônus de Cadastro",
        "Deposit Bonuses": "Bônus de Depósito",
        "Daily Rewards": "Recompensas Diárias",
        "Giveaways": "Doações",
        "Offerwall Sites": "Sites de Ofertas",
        "Earn by Play Sites": "Sites para Ganhar Jogando",
        "Buy or Sell Skins": "Comprar ou Vender Skins",
        "Buy or Sell Items": "Comprar ou Vender Itens",
        "Marketplaces": "Mercados",
        "Instant Sell": "Venda Imediata",
        "Buy Items": "Comprar Itens",
        "Sell Items": "Vender Itens",
        "Trade Items": "Trocar Itens",
        "Buy Skins": "Comprar Skins",
        "Sell Skins": "Vender Skins",
        "Trade Skins": "Trocar Skins",
        "Steam Level Up": "Subir de Nível no Steam",
        "Buy Steam Games": "Comprar Jogos do Steam",
      },
      tr: {
        "CS2 Sites List": "CS2 Siteleri Listesi",
        "Rust Sites List": "Rust Siteleri Listesi",
        "Dota 2 Sites List": "Dota 2 Siteleri Listesi",
        "Crypto Sites List": "Kripto Siteleri Listesi",
        "Newest Sites": "En Yeni Siteler",
        "Freebies Only": "Sadece Bedava Hediyeler",
        "Earning Sites": "Para Kazanma Siteleri",
        "Steam Sites": "Steam Siteleri",
        "Gambling Sites": " Kumar Siteleri",
        "Earn by Play CS2": "CS2 Oynayarak Kazan",
        "All Sites": "Tüm Siteler",
        "Match Betting": "Maç Bahisleri",
        "Case Opening": "Kasa Açma",
        "Roulette": "Rulet",
        "Coinflip": "Tura-Yazı",
        "Crash": "Çökme",
        "Casino": "Kumarhane",
        "Jackpot": "Jackpot",
        "Upgrader": "Yükseltici",
        "Dice": "Zar",
        "Bonus Types": "Bonus Türleri",
        "Sign Up Bonuses": "Kayıt Bonusları",
        "Deposit Bonuses": "Yatırım Bonusları",
        "Daily Rewards": "Günlük Ödüller",
        "Giveaways": "Hediyeler",
        "Offerwall Sites": "Teklif Duvarı Siteleri",
        "Earn by Play Sites": "Oyun Oynayarak Kazan Siteleri",
        "Buy or Sell Skins": "Skins Satın Al veya Sat",
        "Buy or Sell Items": "Eşya Satın Al veya Sat",
        "Marketplaces": "Pazar Yerleri",
        "Instant Sell": "Anında Satış",
        "Buy Items": "Eşya Satın Al",
        "Sell Items": "Eşya Sat",
        "Trade Items": "Eşya Takas Et",
        "Buy Skins": "Skins Satın Al",
        "Sell Skins": "Skins Sat",
        "Trade Skins": "Skins Takas Et",
        "Steam Level Up": "Steam Seviye Atlama",
        "Buy Steam Games": "Steam Oyunları Satın Al",
      },
      es: {
        "CS2 Sites List": "Lista de sitios de CS2",
        "Rust Sites List": "Lista de sitios de Rust",
        "Dota 2 Sites List": "Lista de sitios de Dota 2",
        "Crypto Sites List": "Lista de sitios de criptomonedas",
        "Newest Sites": "Sitios Más Nuevos",
        "Freebies Only": "Solo regalos gratis",
        "Earning Sites": "Sitios para ganar dinero",
        "Steam Sites": "Sitios de Steam",
        "Gambling Sites": "Sitios de apuestas",
        "Earn by Play CS2": "Gana jugando CS2",
        "All Sites": "Todos los sitios",
        "Match Betting": "Apuestas de partidos",
        "Case Opening": "Apertura de estuches",
        "Roulette": "Ruleta",
        "Coinflip": "Lanzamiento de moneda",
        "Crash": "Choque",
        "Casino": "Casino",
        "Jackpot": "Bote",
        "Upgrader": "Actualizador",
        "Dice": "Dados",
        "Bonus Types": "Tipos de bonos",
        "Sign Up Bonuses": "Bonos de registro",
        "Deposit Bonuses": "Bonos de depósito",
        "Daily Rewards": "Recompensas diarias",
        "Giveaways": "Regalos",
        "Offerwall Sites": "Sitios de oferta",
        "Earn by Play Sites": "Sitios para ganar jugando",
        "Buy or Sell Skins": "Comprar o vender skins",
        "Buy or Sell Items": "Comprar o vender objetos",
        "Marketplaces": "Mercados",
        "Instant Sell": "Venta instantánea",
        "Buy Items": "Comprar objetos",
        "Sell Items": "Vender objetos",
        "Trade Items": "Intercambiar objetos",
        "Buy Skins": "Comprar skins",
        "Sell Skins": "Vender skins",
        "Trade Skins": "Intercambiar skins",
        "Steam Level Up": "Aumentar nivel de Steam",
        "Buy Steam Games": "Comprar juegos de Steam",
      },
    };

    var elements = document.querySelectorAll('.nav-bar .category-box-content span, .nav-bar ul .submenu li a');
    for (var j = 0; j < elements.length; j++) {
      var text = elements[j].textContent.trim();
      if (translations[languageTag] && translations[languageTag].hasOwnProperty(text)) {
        if (elements[j].innerHTML.includes('<i class="bi bi-caret-right-fill"></i>')) {
          elements[j].innerHTML = translations[languageTag][text] + ' <i class="bi bi-caret-right-fill"></i>';
        } else {
          elements[j].innerHTML = translations[languageTag][text];
        }
      }
    }
  }

  function applyTranslation(element, languageTag) {
    translateURLs2(element, languageTag);
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          var addedElement = mutation.addedNodes[0];
          if (addedElement.classList && addedElement.classList.contains('category-selector')) {
            translateURLs2(addedElement, languageTag);
          }
        }
      });
    });

    observer.observe(element, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var navBarContainer = document.createElement('div');

    
    fetch('/code-parts/nav-bar.html')
      .then(response => response.text())
      .then(data => {
        navBarContainer.innerHTML = data;

        var header = document.querySelector('header');

        if (!header) return;

        header.insertAdjacentElement('afterend', navBarContainer.firstChild);

        var categorySelector = document.querySelector('.category-selector');
        if (categorySelector) {
          applyTranslation(categorySelector, languageTag);
        }

        var menuToggle = document.querySelector('.menu-toggle');
        var navBar = document.querySelector('.nav-bar');

        if (menuToggle && navBar) {
          menuToggle.addEventListener('click', function() {
            navBar.classList.toggle('active');
          });

          navBar.addEventListener('click', function() {
            navBar.classList.remove('active');
          });
        }
      });
  });

}

function translateTextElements(translations) {
  var siteprosElements = document.querySelectorAll('.sitedetails .sitepros span');
  for (var i = 0; i < siteprosElements.length; i++) {
    var text = siteprosElements[i].textContent.trim();
    if (translations.hasOwnProperty(text)) {
      siteprosElements[i].innerHTML = translations[text] + ' <i class="bi bi-caret-down-fill"></i>';
    }
  }

  var ratingwayElements = document.querySelectorAll('.ratingthings .ratingway span, .content button, .boxreview .plusminus .criteria .par h2, .features .featuresbox .typesinside a, .instruction li');
  for (var j = 0; j < ratingwayElements.length; j++) {
    var text = ratingwayElements[j].textContent.trim();
    if (translations.hasOwnProperty(text)) {
      ratingwayElements[j].innerHTML = translations[text];
    }
  }
}

if (window.location.pathname.includes('/ru/reviews/') || window.location.pathname.includes('/ru/mirrors/')) {
  var translations = {
    "Deposit Methods": "Способы Пополнения",
    "Withdraw Methods": "Способы Вывода",
    "Sign Up Bonus": "Бонус за Регистрацию",
    "Faucet System": "Система Кранов",
    "Daily Rewards": "Ежедневные Награды",
    "Daily Giveaways": "Ежедневные Розыгрыши",
    "No Bonus": "Нет Бонуса",
    "Deposit Bonus": "Бонус к Пополнению",
    "Rain System": "Дожди",
    "Rakeback System": "Рейкбек",
    "Pros": "Плюсы",
    "Price": "Цены",
    "Cons": "Минусы",
    "Trust": "Доверие",
    "Support": "Поддержка",
    "Payments": "Деп/Вывод",
    "Functional": "Функционал",
    "Playability": "Режимы",
    "Sign up via Steam": "Залогиньтесь через Steam ",
    "Enjoy !": "Наслаждайтесь !",
    "Visit WebSite": "Посетить Сайт"
  };
  translateTextElements(translations);

  var links = document.getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    
    // Check if the link is not inside div.box
    if (!link.closest('div.siteblock div.box, ol li a, nav .socials')) {
      if (!link.classList.contains('lang-switch') && !link.closest('.instruction-mirrors')) {
        var path = link.pathname;

        if (!path.includes('/ru/') && path.indexOf('/ru') !== 0) {
          if (path !== '/') {
            link.pathname = '/ru' + path;
          } else {
            link.href = link.href.replace('csgobroker.co/', 'csgobroker.co/ru/');
          }
        }
      }     
    }
  }
}

if (window.location.pathname.includes('/pl/reviews/')) {
  var translations = {
    "Deposit Methods": "Metody Depozytu",
    "Withdraw Methods": "Metody Wypłaty",
    "Sign Up Bonus": "Bonus Rejestracyjny",
    "No Bonus": "Brak Bonusu",
    "Pros": "Zalety",
    "Price": "Cena",
    "Cons": "Wady",
    "Trust": "Zaufanie",
    "Support": "Wsparcie",
    "Payments": "Płatności",
    "Functional": "Funkcjonalność",
    "Sign up via Steam": "Zarejestruj się za pomocą Steam",
    "Enjoy !": "Ciesz się!",
    "Visit WebSite": "Odwiedź stronę internetową"
  };
  translateTextElements(translations);
}

document.addEventListener('DOMContentLoaded', function() {
if (!window.location.pathname.includes("/reviews/") && !window.location.pathname.includes("/mirrors/") && !window.location.pathname.includes("/topic")) {
  const boxContainer = document.querySelector('.category-selector');
  const buttonsContainer = document.createElement('div');
  const prevButtonContainer = document.createElement('button');
  const nextButtonContainer = document.createElement('button');
  const boxes = boxContainer.querySelectorAll('.category-box');
  const boxWidth = boxes[0].offsetWidth + (2 * 9);
  const containerWidth = boxWidth * 4;
  let scrollPosition = 0;
  let buttonScrollPosition = 0;

  buttonsContainer.classList.add('buttons-container');
  prevButtonContainer.classList.add('controls-button');
  prevButtonContainer.innerHTML = '<i class="bi bi-chevron-left"></i>';
  nextButtonContainer.classList.add('controls-button');
  nextButtonContainer.innerHTML = '<i class="bi bi-chevron-right"></i>';

  buttonsContainer.appendChild(prevButtonContainer);
  buttonsContainer.appendChild(nextButtonContainer);

  boxContainer.parentNode.insertBefore(buttonsContainer, boxContainer);

  boxContainer.style.width = `${containerWidth}px`;

  prevButtonContainer.addEventListener('click', () => {
    scrollPosition -= boxWidth;
    scrollPosition = Math.max(scrollPosition, 0);
    boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
    buttonScrollPosition = scrollPosition;
  });

  nextButtonContainer.addEventListener('click', () => {
    scrollPosition += boxWidth;
    scrollPosition = Math.min(scrollPosition, boxContainer.scrollWidth - containerWidth);
    boxContainer.scroll({ left: scrollPosition, behavior: 'smooth' });
    buttonScrollPosition = scrollPosition;
  });

  let isMouseDown = false;
  let startX = 0;
  let scrollLeft = 0;

  boxContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isMouseDown = true;
    startX = e.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  boxContainer.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 0.6;
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft;
  });

  boxContainer.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  boxContainer.addEventListener('mouseleave', () => {
    isMouseDown = false;
  });

  boxContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    isMouseDown = true;
    startX = touch.pageX - boxContainer.offsetLeft;
    scrollLeft = boxContainer.scrollLeft;
  });

  boxContainer.addEventListener('touchmove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.pageX - boxContainer.offsetLeft;
    const walk = (x - startX) * 1.2;
    const newScrollLeft = scrollLeft - walk;
    boxContainer.scrollLeft = newScrollLeft;
    buttonScrollPosition = newScrollLeft;
  });

  boxContainer.addEventListener('touchend', () => {
    isMouseDown = false;
  });

  var categorySelector = document.querySelector('div.category-selector');
  var ulElements = categorySelector.querySelectorAll('div.category-selector > ul');
  var ulArray = Array.from(ulElements);

  ulArray.sort(function(a, b) {
    var aIsActive = a.querySelector('li a.category-box').classList.contains('active');
    var bIsActive = b.querySelector('li a.category-box').classList.contains('active');
  
    if (aIsActive && !bIsActive) {
      return -1;
    } else if (!aIsActive && bIsActive) {
      return 1;
    } else if (a.querySelector('li a.category-box').classList.contains('last')) {
      return 1;
    } else if (b.querySelector('li a.category-box').classList.contains('last')) {
      return -1;
    } else {
      return Math.random() - 0.5;
    }
  });  

  while (categorySelector.firstChild) {
    categorySelector.removeChild(categorySelector.firstChild);
  }

  ulArray.forEach(function (ul) {
    categorySelector.appendChild(ul);
  });

  buttonsContainer.scrollLeft = buttonScrollPosition;
}

function translateURLsSlider(parentElement, languageTag) {
  var links = parentElement.querySelectorAll('a[href]');
  var supportedLanguages = ['hi', 'tr', 'pt', 'es', 'ru'];
  
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    
    if (!href) continue;
    
    var url = new URL(href, window.location.href);
    var path = url.pathname;
    var langIncluded = supportedLanguages.some(lang => {
      var langWithSlashes = '/' + lang + '/';
      return path.includes(langWithSlashes);
    });
    
    if (languageTag !== 'en') {
      if (langIncluded) {
        path = path.replace(/\/(hi|tr|pt|es|ru)\//, '/' + languageTag + '/');
        url.pathname = path;
        links[i].setAttribute('href', url.href);
      } else if (supportedLanguages.includes(languageTag)) {
        path = '/' + languageTag + path;
        url.pathname = path;
        links[i].setAttribute('href', url.href);
      }
    }
  }
}

(function() {
  var insertAfter = function(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  };

  let currentSlide = 0;
  var slideInterval;
  var slideShowActive = true; // Добавляем флаг
  var isTransitioning = false; // Флаг для блокировки анимации

  function showSlide(index) {
    const slides = document.querySelectorAll('.slider-banner');
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    if (slideShowActive && !isTransitioning) { // Проверяем флаги перед сменой слайда
      isTransitioning = true; // Устанавливаем флаг анимации

      setTimeout(function() {
        isTransitioning = false; // Сбрасываем флаг анимации
      }, 6000); // Устанавливаем длительность анимации в миллисекундах (здесь 500 мс)

      currentSlide = (currentSlide + 1) % 3;
      showSlide(currentSlide);
    }
  }

  function startSlideShow() {
    slideShowActive = true;
    slideInterval = setInterval(nextSlide, 6000);
  }

  function stopSlideShow() {
    slideShowActive = false;
    clearInterval(slideInterval);
  }

  startSlideShow();

  var path = window.location.pathname;
  var existingSliderPlacer = document.querySelector('.slider-placer');

  if (existingSliderPlacer) {
    existingSliderPlacer.parentNode.removeChild(existingSliderPlacer);
  }

  var sliderPlacer = document.createElement('div');
  sliderPlacer.classList.add('slider-placer');

  var controlsContainer = document.createElement('div');
  controlsContainer.classList.add('controls');

  var prevButton = document.createElement('button');
  prevButton.classList.add('prev-button');
  prevButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
  controlsContainer.appendChild(prevButton);
  
  var nextButton = document.createElement('button');
  nextButton.classList.add('next-button');
  nextButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
  controlsContainer.appendChild(nextButton);  

  var slider1 = document.createElement('a');
  slider1.href = '/';
  slider1.classList.add('slider-banner', 'active');
  var img1 = document.createElement('img');
  img1.src = '/img/best-gambling-sites-slide.png';
  img1.alt = 'Best Gambling Sites';
  slider1.appendChild(img1);

  var slider2 = document.createElement('a');
  slider2.href = '/earning/offerwalls';
  slider2.classList.add('slider-banner');
  var img2 = document.createElement('img');
  img2.src = '/img/earn-skins-slider.png';
  img2.alt = 'Best Offerwall Sites';
  slider2.appendChild(img2);

  var slider3 = document.createElement('a');
  slider3.href = '/rust';
  slider3.classList.add('slider-banner');
  var img3 = document.createElement('img');
  img3.src = '/img/best-rust-sites-slide.png';
  img3.alt = 'Best Rust Sites';
  slider3.appendChild(img3);

  sliderPlacer.appendChild(controlsContainer);
  sliderPlacer.appendChild(slider1);
  sliderPlacer.appendChild(slider2);
  sliderPlacer.appendChild(slider3);

  var languageTag = path.match(/\/(hi|tr|pt|es|ru)(\.html)?/);
  if (languageTag) {
    languageTag = languageTag[1];
    translateURLsSlider(sliderPlacer, languageTag);
  }

  if (path.includes('/mirrors/')) {
    var sitealternatesboxes = document.querySelector('.sitealternatesboxes');
    if (sitealternatesboxes) {
      insertAfter(sliderPlacer, sitealternatesboxes);
    }
  } else if (path.includes('/reviews/')) {
    var ratingsumm = document.querySelector('div.ratingsumm');
    if (ratingsumm) {
      insertAfter(sliderPlacer, ratingsumm);
    }
  } else {
    var footer = document.querySelector('footer');
    footer.parentNode.insertBefore(sliderPlacer, footer);
  }

  var slideElements = document.querySelectorAll('.slider-banner');
  slideElements.forEach(function(slideElement) {
    slideElement.addEventListener('mouseenter', function() {
      stopSlideShow();
    });

    slideElement.addEventListener('mouseleave', function() {
      startSlideShow();
    });
  });

  nextButton.addEventListener('click', function() {
    currentSlide = (currentSlide + 1) % 3; // Updated to % 3
    showSlide(currentSlide);
  });
  
  prevButton.addEventListener('click', function() {
    currentSlide = (currentSlide - 1 + 3) % 3; // Updated to % 3
    showSlide(currentSlide);
  });

})();



if (
  !window.location.pathname.includes("/reviews/") &&
  !window.location.pathname.includes("/mirrors/") &&
  window.location.pathname !== "/ru" &&
  window.location.pathname !== "/pt" &&
  window.location.pathname !== "/es" &&
  window.location.pathname !== "/tr" &&
  window.location.pathname !== "/hi" &&
  !window.location.pathname.endsWith("ru.html") &&
  !window.location.pathname.endsWith("pt.html") &&
  !window.location.pathname.endsWith("es.html") &&
  !window.location.pathname.endsWith("tr.html") &&
  !window.location.pathname.endsWith("hi.html") &&
  !window.location.pathname.endsWith("index.html")
) {
  var currentLanguage = "";

  var languageMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
  if (languageMatch && languageMatch[1]) {
    currentLanguage = languageMatch[1];
  } else {
    currentLanguage = "en";
  }

  var langMenuDiv = document.querySelector(".lang-menu");

  var newContent = '<div class="selected-lang">';
  if (currentLanguage === "en") {
    newContent += "EN";
  } else if (currentLanguage === "ru") {
    newContent += "RU";
  } else if (currentLanguage === "pt") {
    newContent += "PT";
  } else if (currentLanguage === "es") {
    newContent += "ES";
  } else if (currentLanguage === "tr") {
    newContent += "TR";
  } else if (currentLanguage === "hi") {
    newContent += "HI";
  }
  newContent += "</div><ul>";
  if (currentLanguage !== "en") {
    newContent +=
      '<li><a href="' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="en">EN</a></li>';
  }
  if (currentLanguage !== "ru") {
    newContent +=
      '<li><a href="/ru' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="ru">RU</a></li>';
  }
  if (currentLanguage !== "pt") {
    newContent +=
      '<li><a href="/pt' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="pt">PT</a></li>';
  }
  if (currentLanguage !== "es") {
    newContent +=
      '<li><a href="/es' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="es">ES</a></li>';
  }
  if (currentLanguage !== "tr") {
    newContent +=
      '<li><a href="/tr' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="tr">TR</a></li>';
  }
  if (currentLanguage !== "hi") {
    newContent +=
      '<li><a href="/hi' +
      window.location.pathname.replace(/^\/[a-z]{2}\//, "/") +
      '" class="lang-switch" data-lang="hi">HI</a></li>';
  }
  newContent += "</ul>";

  langMenuDiv.innerHTML = newContent;
}

const backToTopButton = document.querySelector("#back-to-top-btn");

window.addEventListener("scroll", scrollFunction);

function scrollFunction() {
  if (window.pageYOffset > 300) {
    if(!backToTopButton.classList.contains("btnEntrance")) {
      backToTopButton.classList.remove("btnExit");
      backToTopButton.classList.add("btnEntrance");
      backToTopButton.style.display = "block";
    }
  }
  else { //
    if(backToTopButton.classList.contains("btnEntrance")) {
      backToTopButton.classList.remove("btnEntrance");
      backToTopButton.classList.add("btnExit");
      setTimeout(function() {
        backToTopButton.style.display = "none";
      }, 250);
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
  t /= d/2;
  if (t < 1) return c/2*t*t*t + b;
  t -= 2;
  return c/2*(t*t*t + 2) + b;
}

var siteList = document.getElementById('site-list');
var searchInput = document.getElementById('search-input'); 
var isRussianPage = window.location.pathname.includes('/ru');
var sites = [
  '<li><a href="/topic/skins/red-skins">Red Skins</a></li>',
  '<li><a href="/topic/skins/yellow-skins">Yellow Skins</a></li>',
  '<li><a href="/topic/skins/blue-skins">Blue Skins</a></li>',
  '<li><a href="/topic/skins/purple-skins">Purple Skins</a></li>',
  '<li><a href="/topic/skins/green-skins">Green Skins</a></li>',
  '<li><a href="/reviews/idle-empire">Idle-empire</a></li>',
  '<li><a href="/reviews/insanegg">Insanegg</a></li>',
  '<li><a href="/reviews/key-drop">Key-drop</a></li>',
  '<li><a href="/reviews/knifex">Knifex</a></li>',
  '<li><a href="/reviews/lis-skins">Lis-skins</a></li>',
  '<li><a href="/reviews/lootbear">Lootbear</a></li>',
  '<li><a href="/reviews/lootfarm">Lootfarm</a></li>',
  '<li><a href="/reviews/primedice">Primedice</a></li>',
  '<li><a href="/reviews/rollbit">Rollbit</a></li>',
  '<li><a href="/reviews/roobet">Roobet</a></li>',
  '<li><a href="/reviews/rustbet">Rustbet</a></li>',
  '<li><a href="/reviews/rustcases">Rustcases</a></li>',
  '<li><a href="/reviews/rustchance">Rustchance</a></li>',
  '<li><a href="/reviews/rustclash">Rustclash</a></li>',
  '<li><a href="/reviews/rustix">Rustix</a></li>',
  '<li><a href="/reviews/rustmoment">Rustmoment</a></li>',
  '<li><a href="/reviews/ruststake">Ruststake</a></li>',
  '<li><a href="/reviews/rustyloot">Rustyloot</a></li>',
  '<li><a href="/reviews/rustypot">Rustypot</a></li>',
  '<li><a href="/reviews/salad">Salad</a></li>',
  '<li><a href="/reviews/shadowpay">Shadowpay</a></li>',
  '<li><a href="/reviews/skinbaron">Skinbaron</a></li>',
  '<li><a href="/reviews/skinbet">Skinbet</a></li>',
  '<li><a href="/reviews/skincashier">Skincashier</a></li>',
  '<li><a href="/reviews/skinscash">Skinscash</a></li>',
  '<li><a href="/reviews/skinswap">Skinswap</a></li>',
  '<li><a href="/reviews/steamgifts">Steamgifts</a></li>',
  '<li><a href="/reviews/steamlvlup">Steamlvlup</a></li>',
  '<li><a href="/reviews/swapgg">Swapgg</a></li>',
  '<li><a href="/reviews/tradeit">Tradeit</a></li>',
  '<li><a href="/reviews/vvvgamers">Vvvgamers</a></li>',
  '<li><a href="/reviews/wtfskins">Wtfskins</a></li>',
  '<li><a href="/reviews/xplay">Xplay</a></li>',
  '<li><a href="/reviews/avanmarket">Avanmarket</a></li>',
  '<li><a href="/reviews/banditcamp">Banditcamp</a></li>',
  '<li><a href="/reviews/bcgame">Bcgame</a></li>',
  '<li><a href="/reviews/bets4pro">Bets4pro</a></li>',
  '<li><a href="/reviews/bitskins">Bitskins</a></li>',
  '<li><a href="/reviews/bitskins-p2p">Bitskins p2p</a></li>',
  '<li><a href="/reviews/clashgg">Clashgg</a></li>',
  '<li><a href="/reviews/crashgg">Crashgg</a></li>',
  '<li><a href="/reviews/csdeals">CsDeals</a></li>',
  '<li><a href="/reviews/csgo500">CSGO500</a></li>',
  '<li><a href="/reviews/csgobig">CSGOBig</a></li>',
  '<li><a href="/reviews/csgoempire">CSGOEmpire</a></li>',
  '<li><a href="/reviews/csgofast">CSGOFast</a></li>',
  '<li><a href="/reviews/csgolive">CSGOLive</a></li>',
  '<li><a href="/reviews/csgoluck">CSGOLuck</a></li>',
  '<li><a href="/reviews/csgo-market">CSGO-Market</a></li>',
  '<li><a href="/reviews/csgopolygon">CSGOPolygon</a></li>',
  '<li><a href="/reviews/csgopositive">CSGOPositive</a></li>',
  '<li><a href="/reviews/csgoroll">CSGORoll</a></li>',
  '<li><a href="/reviews/csgoselly">CSGOSelly</a></li>',
  '<li><a href="/reviews/csgo-skins">CSGO-Skins</a></li>',
  '<li><a href="/reviews/cybershoke">Cybershoke</a></li>',
  '<li><a href="/reviews/daddyskins">Daddyskins</a></li>',
  '<li><a href="/reviews/datdrop">Datdrop</a></li>',
  '<li><a href="/reviews/dmarket">Dmarket</a></li>',
  '<li><a href="/reviews/duelbits">Duelbits</a></li>',
  '<li><a href="/reviews/earnweb">Earnweb</a></li>',
  '<li><a href="/reviews/farmskins">Farmskins</a></li>',
  '<li><a href="/reviews/flamecases">Flamecases</a></li>',
  '<li><a href="/reviews/freecash">Freecash</a></li>',
  '<li><a href="/reviews/freeward">Freeward</a></li>',
  '<li><a href="/reviews/gamdom">Gamdom</a></li>',
  '<li><a href="/reviews/gamehag">Gamehag</a></li>',
  '<li><a href="/reviews/gamerpay">Gamerpay</a></li>',
  '<li><a href="/reviews/gametame">Gametame</a></li>',
  '<li><a href="/reviews/gcskins">Gcskins</a></li>',
  '<li><a href="/reviews/grindbux">Grindbux</a></li>',
  '<li><a href="/reviews/hellcase">Hellcase</a></li>',
  '<li><a href="/reviews/hellstore">Hellstore</a></li>',
  '<li><a href="/reviews/howlgg">Howlgg</a></li>',
  '<li><a href="/reviews/skinbid">SkinBid</a></li>',
  '<li><a href="/reviews/shuffle">Shuffle</a></li>',
  '<li><a href="/reviews/steamlevels">SteamLevels</a></li>',
  '<li><a href="/reviews/steamlevelu">SteamLevelU</a></li>',
  '<li><a href="/reviews/whitemarket">White.Market</a></li>',
  '<li><a href="/reviews/hypeup">Hypeup</a></li>',
];

function compareSites(a, b) {
  var siteNameA = a.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var siteNameB = b.match(/<a href=".*?">(.*?)<\/a>/)[1].toLowerCase();
  var searchTerm = searchInput.value.toLowerCase();

  if (
    siteNameA.charAt(0) === searchTerm.charAt(0) &&
    siteNameB.charAt(0) !== searchTerm.charAt(0)
  ) {
    return -1;
  } else if (
    siteNameA.charAt(0) !== searchTerm.charAt(0) &&
    siteNameB.charAt(0) === searchTerm.charAt(0)
  ) {
    return 1;
  } else {
    return siteNameA.localeCompare(siteNameB);
  }
}

function updateSiteList() {
  siteList.innerHTML = '';
  sites.sort(compareSites);

  sites.forEach(function(site) {
    var li = document.createElement('li');
    li.className = 'site-item';
    li.style.display = 'none';
    li.innerHTML = site;
    
    var link = li.querySelector('a');
    
    if (isRussianPage) {
      var href = link.getAttribute('href');
      var newHref = href.replace('/', '/ru/');
      link.setAttribute('href', newHref);
    }
    
    li.innerHTML = '';
    li.appendChild(link);
    
    siteList.appendChild(li);
  });
}


function hideAllSites(siteItems) {
  for (var i = 0; i < siteItems.length; i++) {
      var siteItem = siteItems[i];
      hideSite(siteItem);
  }
}

function hideSite(siteItem) {
  siteItem.style.display = 'none';
}

function showSite(siteItem) {
  siteItem.style.display = 'flex';
}

function handleSearchInput() {
  var searchTerm = searchInput.value.toLowerCase();
  var siteItems = siteList.getElementsByClassName('site-item');

  if (searchTerm === '') {
      hideAllSites(siteItems);
      siteList.style.display = 'none';
      return;
  }

  for (var i = 0; i < siteItems.length; i++) {
      var siteItem = siteItems[i];
      var siteName = siteItem.textContent.toLowerCase();

      if (siteName.startsWith(searchTerm)) {
          showSite(siteItem);
      } else {
          hideSite(siteItem);
      }
  }

  siteList.style.display = 'block';
}

searchInput.addEventListener('input', handleSearchInput);

searchInput.addEventListener('focus', function() {
  if (searchInput.value === '') {
      siteList.style.display = 'none';
  } else {
      siteList.style.display = 'block';
  }
});

searchInput.addEventListener('blur', function() {
  setTimeout(function() {
      siteList.style.display = 'none';
  }, 150);
});

updateSiteList();

var slides = document.getElementsByClassName("slide");
var triggersContainer = document.querySelector(".screens");

var currentIndex = 0;
var slideInterval;
var startX = 0;
var threshold = 100;

var prevButton = document.querySelector(".prev-button");
var nextButton = document.querySelector(".next-button");

if (window.location.pathname.includes("/reviews/")) {
  function removeAllTriggers() {
    var existingTriggers = triggersContainer.querySelectorAll(
      "input[type='radio'], label"
    );
    existingTriggers.forEach(function (trigger) {
      triggersContainer.removeChild(trigger);
    });
  }
  
  function createTrigger(index) {
    var trigger = document.createElement("input");
    trigger.type = "radio";
    trigger.id = "trigger" + (index + 1);
    trigger.name = "slider";
    if (index === currentIndex) {
      trigger.checked = true;
    }
  
    trigger.addEventListener("change", function () {
      var previousSlide = slides[currentIndex];
      previousSlide.classList.remove("active");
      currentIndex = index;
      showSlide(currentIndex, null);
      startSlideShow();
    });
  
    var label = document.createElement("label");
    label.setAttribute("for", trigger.id);
  
    triggersContainer.appendChild(trigger);
    triggersContainer.appendChild(label);
  }
  
  function createTriggers() {
    removeAllTriggers();
    for (var i = 0; i < slides.length; i++) {
      createTrigger(i);
    }
  }
  
  function showSlide(index, direction) {
    var currentSlide = slides[currentIndex];
    var nextSlide = slides[index];
  
    currentSlide.classList.remove("active", "next", "previous");
    nextSlide.classList.add("active");
  
    if (direction === "next") {
      nextSlide.classList.add("next");
    } else if (direction === "previous") {
      nextSlide.classList.add("previous");
    }
  
    currentIndex = index;
  
    var triggerLabels = triggersContainer.querySelectorAll("label");
    triggerLabels.forEach(function (label, labelIndex) {
      if (labelIndex === index) {
        label.classList.add("active");
      } else {
        label.classList.remove("active");
      }
    });
  
    if (currentIndex === 0) {
      prevButton.disabled = true;
      nextButton.disabled = false;
    } else if (currentIndex === slides.length - 1) {
      prevButton.disabled = false;
      nextButton.disabled = true;
    } else {
      prevButton.disabled = false;
      nextButton.disabled = false;
    }
  }
  
  createTriggers();
  
  triggersContainer.addEventListener("touchstart", function (event) {
    startX = event.touches[0].clientX;
  });
  
  triggersContainer.addEventListener("touchend", function (event) {
    var endX = event.changedTouches[0].clientX;
    var deltaX = endX - startX;
  
    if (deltaX > threshold) {
      previousSlide();
      startSlideShow();
    } else if (deltaX < -threshold) {
      nextSlide();
      startSlideShow();
    }
  });
  
  triggersContainer.addEventListener("mouseenter", function () {
    stopSlideShow();
  });
  
  triggersContainer.addEventListener("mouseleave", function () {
    startSlideShow();
  });
  
  
  function startSlideShow() {
    stopSlideShow();
    slideInterval = setInterval(nextSlide, 5000);
  }
  
  function stopSlideShow() {
    clearInterval(slideInterval);
  }
  
  function nextSlide() {
    var nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex, "next");
  }
  
  function previousSlide() {
    var previousIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(previousIndex, "previous");
  }
  
  showSlide(currentIndex);
  startSlideShow();
  
  prevButton.addEventListener("click", function () {
    if (currentIndex !== 0) {
      previousSlide();
      startSlideShow();
    }
  });
  
  nextButton.addEventListener("click", function () {
    if (currentIndex !== slides.length - 1) {
      nextSlide();
      startSlideShow();
    }
  });
}

if ((window.location.pathname.startsWith('/ru/') || window.location.pathname === '/ru' || window.location.pathname === '/ru.html')) {


        // Создаем новый div элемент
        var newDiv = document.createElement("div");
        newDiv.className = "vpn";
        newDiv.textContent = "Нужен VPN";

        // Массив айди, на которые нужно добавлять .vpn
        var allowedIds = ["CSGORoll", "Clash", "HowlGG", "RustyPot", "RustChance", "Rollbit", "Duelbits", "FlameCases", "BCGame", "Roobet", "DaddySkins", "CSGOLive", "WTFSkins", "Key-Drop", "gcskins", "FarmSkins", "vvvgamers"];

        // Находим все элементы .box
        var boxElements = document.querySelectorAll(".box");

        // Проходим по всем элементам .box и добавляем новый div в нужные элементы
        boxElements.forEach(function(boxElement) {
            var boxId = boxElement.id;
            if (allowedIds.includes(boxId)) {
                var logobgElement = boxElement.querySelector(".logobg");
                if (logobgElement) {
                    var clonedDiv = newDiv.cloneNode(true);
                    logobgElement.appendChild(clonedDiv);
                } else {
                    console.error("Не удалось найти элемент .logobg внутри .box");
                }
            }
        });
      }});