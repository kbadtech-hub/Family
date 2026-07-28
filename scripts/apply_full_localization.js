const fs = require('fs');
const path = require('path');

const updates = {
  am: {
    Nav: {
      academy: "የቤተሰብ አካዳሚ",
      counseling: "የምክር አገልግሎቶች"
    },
    Dashboard: {
      profile: {
        saveChanges: "ለወጦችን አስቀምጥ",
        defaultCity: "አዲስ አበባ",
        roles: {
          user: "የሐበሻ አባል",
          admin: "የቤተሰብ አድሚን"
        },
        alerts: {
          avatarFailed: "የፕሮፋይል ምስል መስቀል አልተሳካም",
          uploadFailed: "መጫን አልተሳካም",
          deleteFailed: "ማሰረዝ አልተሳካም",
          usernameTaken: "ይህ የተጠቃሚ ስም ተይዟል። እባክዎን ሌላ ይምረጡ።",
          updateSuccess: "ፕሮፋይልዎ በተሳካ ሁኔታ ተሻሽሏል!",
          updateFailed: "ማሻሻል አልተሳካም"
        }
      },
      paymentSuccess: {
        coinsTitle: "ኮይኖች ተገዝተዋል!",
        coinsBody: "ኮይኖችዎ ወደ መለያዎ ገብተዋል። ስጦታዎችን በመላክ እና አዳዲስ ባህሪያትን በመክፈት ይደሰቱ!",
        vipTitle: "የVIP አገልግሎት ተነቃቅቷል!",
        vipBody: "የVIP አባልነትዎ አሁን ንቁ ሆኗል። በልዩ አገልግሎቶች እና ፕሪሚየም ባህሪያት ይደሰቱ!",
        premiumTitle: "ፕሪሚየም ተነቃቅቷል!",
        premiumBody: "የፕሪሚየም ምዝገባዎ አሁን ንቁ ሆኗል። ሁሉንም ልዩ ባህሪያት ይጎብኙ!"
      },
      paymentError: {
        title: "የክፍያ ማረጋገጫ አልተሳካም",
        body: "ክፍያዎን ማረጋገጥ አልቻልንም። እባክዎን የትራንዛክሽን ቁጥርዎን በመያዝ ድጋፍ ሰጪ ቡድንን ያነጋግሩ።"
      }
    },
    Chat: {
      loading: "የቤተሰብ ወግ በመጫን ላይ...",
      title: "የተጣመሩ",
      searchPlaceholder: "የተጣመሩትን ፈልግ...",
      noMatches: "እስካሁን የተጣመሩ የሉም። መፈለግዎን ይቀጥሉ!",
      premiumTitle: "የፕሪሚየም አገልግሎት",
      premiumSub: "ከተጣመሩ ሰዎች ጋር ቀጥታ መልእክት መለዋወጥ የፕሪሚየም አገልግሎት ነው። ጉዞዎን ለመጀመር አሁኑኑ ያሳድጉ።",
      upgradeNow: "አሁኑኑ ያሳድጉ",
      activeNow: "አሁን መስመር ላይ",
      compatibilityTitle: "የአቡሻኪር ስምምነትዎ ከፍተኛ ነው!",
      compatibilitySub: "በባህላዊ እሴቶች ላይ የተመሰረተ ወግ ይጀምሩ።",
      translate: "ወደ {lang} ተርጉም",
      original: "ዋናውን አሳይ",
      iceBreaker: "የAI መክፈቻ ጥያቄ ሀሳብ",
      typePlaceholder: "በአክብሮት መልእክት ይጻፉ...",
      selectMatchTitle: "የተጣመረ ሰው ይምረጡ",
      selectMatchSub: "በቤተሰብ ማህበረሰብ ውስጥ ከተመረጡ አጋርዎ ጋር ይገናኙ። የተጠበቀ፣ ፈጣን እና ምስጢራዊነት ያለው መልእክት።",
      encrypted: "የተጠበቀ",
      private: "ግላዊ"
    },
    Classes: {
      general: "አጠቃላይ ጥበብ",
      premiumOnly: "ለልዩ አባላት ብቻ"
    },
    Friendship: {
      addFriend: "ወዳጅ ጨምር",
      requestSent: "ጥያቄ ተልኳል",
      pending: "ማረጋገጫ በመጠበቅ ላይ",
      accept: "ጥያቄውን ተቀበል",
      decline: "ጥያቄውን ውደቅ",
      friends: "ወዳጆች",
      alreadyFriends: "አስቀድመው ወዳጆች ናችሁ!",
      notification: "አዲስ የጓደኝነት ጥያቄ ከ {name}",
      noRequests: "ምንም የሚጠብቅ የጓደኝነት ጥያቄ የለም።",
      about: "ስለ",
      interests: "ፍላጎቶች",
      contactInfo: "የመገናኛ መረጃ",
      directEmail: "ቀጥታ ኢሜይል",
      premiumOnly: "ለፕሪሚየም አባላት ብቻ",
      openChat: "ወግ ጀምር",
      startConnection: "ግንኙነት ጀምር",
      upgradeToRead: "ሙሉ መግለጫውን ለማንበብ ወደ ፕሪሚየም ያሳድጉ",
      noBio: "ምንም መግለጫ አልተጻፈም።",
      premiumFriendsOnly: "ለፕሪሚየም ወይም ለወዳጆች ብቻ",
      upgradeOrFriendSub: "ወግ ለመጀመር ወደ ፕሪሚየም ያሳድጉ ወይም በወዳጅነት ተቀባይነት ያግኙ።",
      upgradeNow: "አሁኑኑ ያሳድጉ"
    },
    Constants: {
      Months: {
        Meskerem: "መስከረም",
        Tikemt: "ጥቅምት",
        Hidar: "ህዳር",
        Tahsas: "ታህሳስ",
        Tir: "ጥር",
        Yekatit: "የካቲት",
        Megabit: "መጋቢት",
        Miazia: "ሚያዝያ",
        Genbot: "ግንቦት",
        Sene: "ሰኔ",
        Hamle: "ሐምሌ",
        Nehase: "ነሐሴ",
        Pagume: "ጳጉሜ"
      },
      Locations: {
        "Addis Ababa": "አዲስ አበባ",
        "Dire Dawa": "ድሬዳዋ",
        "Mekelle": "መቀሌ",
        "Adama": "አዳማ",
        "Bahir Dar": "ባህር ዳር",
        "Gondar": "ጎንደር",
        "Hawassa": "ሀዋሳ",
        "Jimma": "ጂማ",
        "Jijiga": "ጅጅጋ"
      },
      Requirements: {
        "Traditional Values": "ባህላዊ እሴቶች"
      },
      Countries: {
        Qatar: "ካታር"
      }
    },
    Contact: {
      hqAddress: "ለንደን፣ እንግሊዝ"
    }
  },

  om: {
    Nav: {
      academy: "Akkaadaamii Beteseb",
      counseling: "Mata-dureewwan Gorsa"
    },
    Dashboard: {
      profile: {
        saveChanges: "Jijjiirama Galmeessi",
        defaultCity: "Finfinnee",
        roles: {
          user: "Miseensa Habashaa",
          admin: "Bulchaa Beteseb"
        },
        alerts: {
          avatarFailed: "Fakkiin piroofaayilii ol-fe'uu hin dandamne",
          uploadFailed: "Fe'umsi hin milkaa'ine",
          deleteFailed: "Haqamuun hin milkaa'ine",
          usernameTaken: "Maqaan fayyadamaa kana dura qabatameera. Maaloo kan biraa filadhaa.",
          updateSuccess: "Piroofaayiliin keessan milkaa'inaan haaromeera!",
          updateFailed: "Haaromsuun hin milkaa'ine"
        }
      },
      paymentSuccess: {
        coinsTitle: "Koyinoonni bitamaniiru!",
        coinsBody: "Koyinoonni keessan akkaanti keessanitti galaniiru. Kennaa erguufi tajaajila addaa banachuun gammadaa!",
        vipTitle: "Tajaajilli VIP banameera!",
        vipBody: "Miseensummaan VIP keessan amma hojiirra jira. Tajaajila addaafi dandeettii piriimiyamii fayyadamaa!",
        premiumTitle: "Piriimiyamiin banameera!",
        premiumBody: "Kaffaltiin piriimiyamii keessan amma hojiirra jira. Tajaajiloota addaa hunda daawwadhaa!"
      },
      paymentError: {
        title: "Mirkanneessi Kaffaltii Hin Milkaa'ine",
        body: "Kaffaltii keessan mirkaneessuu hin dandeenye. Maaloo lakk. daddabarsa keessan qabachuun deeggarsa qunnamaa."
      }
    },
    Chat: {
      loading: "Haasaa maatii fe'aa jira...",
      title: "Walgitansaan",
      searchPlaceholder: "Walgitansaan barbaadi...",
      noMatches: "Hanga ammaatti walgitansaan hin jiru. Barbaaduu itti fufaa!",
      premiumTitle: "Tajaajila Piriimiyamii",
      premiumSub: "Walgitansaa keessan wajjin kallattiin ergaa waljijjiiruun tajaajila piriimiyamiiti. Amma haaromsa imala keessan jalqabaa.",
      upgradeNow: "Amma Haaromsaa",
      activeNow: "Amma Hojii On",
      compatibilityTitle: "Walgitansaan Abushakir keessan olaanaadha!",
      compatibilitySub: "Aadaafi duudhaa irratti hundaa'uun haasaa jalqabaa.",
      translate: "Gara {lang}tti hiiki",
      original: "Madaallii Jalqabaa Agarsiisi",
      iceBreaker: "Yad-yaada Haasaa AI",
      typePlaceholder: "Kabajaan ergaa barreessaa...",
      selectMatchTitle: "Walgitansaa filadhaa",
      selectMatchSub: "Maatii Beteseb keessatti hiriyaa keessan kaadhimamaa wajjin walqunnamaa. Eegumsa, yeroo ariifachiisaa fi iccitii kan eeggate.",
      encrypted: "Iccitiin Eegame",
      private: "Dhuunfaa"
    },
    Classes: {
      general: "Ogummaa Gamtaa",
      premiumOnly: "Miseensota Addaatiif Qofa"
    },
    Friendship: {
      addFriend: "Hiriyaa Dabali",
      requestSent: "Gaaffiin Ergameera",
      pending: "Mirkanneessa Eegaa Jira",
      accept: "Gaaffii Fudhadhu",
      decline: "Gaaffii Didi",
      friends: "Hiriyoota",
      alreadyFriends: "Isin kani dura hiriyoota!",
      notification: "Gaaffii hiriyaa haarawa {name} irraa",
      noRequests: "Gaaffiin hiriyaa eegaa jiru hin jiru.",
      about: "Waa'ee",
      interests: "Fedhiilee",
      contactInfo: "Odeeffannoo Quunnamtii",
      directEmail: "Imeelii Kallattii",
      premiumOnly: "Piriimiyamii Qofaaf",
      openChat: "Haasaa Banii",
      startConnection: "Walqunnamtii Jalqabaa",
      upgradeToRead: "Odeeffannoo guutuu dubbisuuf gara Piriimiyamitti haaromsaa",
      noBio: "Odeeffannoon dhuunfaa hin jiru.",
      premiumFriendsOnly: "Piriimiyamii ykn Hiriyoota Qofaaf",
      upgradeOrFriendSub: "Haasaa jalqabuuf gara Piriimiyamitti haaromsaa ykn akka hiriyaatti fudhatama argadhaa.",
      upgradeNow: "Amma Haaromsaa"
    },
    Constants: {
      Months: {
        Meskerem: "Meskerem",
        Tikemt: "Tikemt",
        Hidar: "Hidar",
        Tahsas: "Tahsas",
        Tir: "Tir",
        Yekatit: "Yekatit",
        Megabit: "Megabit",
        Miazia: "Miazia",
        Genbot: "Genbot",
        Sene: "Sene",
        Hamle: "Hamle",
        Nehase: "Nehase",
        Pagume: "Pagume"
      },
      Locations: {
        "Addis Ababa": "Finfinnee",
        "Dire Dawa": "Diri Dhabaa",
        "Mekelle": "Maqale",
        "Adama": "Adaamaa",
        "Bahir Dar": "Baahir Daar",
        "Gondar": "Gondar",
        "Hawassa": "Hawaasaa",
        "Jimma": "Jimmaa",
        "Jijiga": "Jijiga"
      },
      Requirements: {
        "Traditional Values": "Duudhaalee Aadaa"
      },
      Countries: {
        Qatar: "Qataar"
      }
    },
    Contact: {
      hqAddress: "Landan, Ingilaand"
    }
  },

  ti: {
    Nav: {
      academy: "ቤተሰብ አካደሚ",
      counseling: "ምክሪ ሰሲናት"
    },
    Dashboard: {
      profile: {
        saveChanges: "ለውጥታትን ኣስቀምጥ",
        defaultCity: "አዲስ አበባ",
        roles: {
          user: "ኣባል ሓበሻ",
          admin: "ቤተሰብ ኣድሚን"
        },
        alerts: {
          avatarFailed: "ስእሊ ፕሮፋይል ምጽዓን ኣይተኻእለን",
          uploadFailed: "ምጽዓን ኣይተኻእለን",
          deleteFailed: "ምስራዝ ኣይተኻእለን",
          usernameTaken: "እዚ መታወቂ ስም ተታሒዙ እዩ። እባክኹም ኻልእ ሕረዩ።",
          updateSuccess: "ፕሮፋይልካ ብዓወት ተመሓይሹ አሎ!",
          updateFailed: "ምምሕያሽ ኣይተኻእለን"
        }
      },
      paymentSuccess: {
        coinsTitle: "ኮይናት ተዓዲጎም!",
        coinsBody: "ኮይናትካ ናብ ኣካውንትካ ኣትዮም ኣለው። ህያባት ብምልኣኽን ፍሉያት ኣገልግሎታት ብምክፋትን ተሓጎስ!",
        vipTitle: "VIP ኣገልግሎት ተበጊሱ ኣሎ!",
        vipBody: "VIP ኣባልነትካ ሕዚ ንቁ ኮይኑ ኣሎ። ብፍሉያት ኣገልግሎታትን ፕሪምየም መደባትን ተሓጎስ!",
        premiumTitle: "ፕሪምየም ተበጊሱ ኣሎ!",
        premiumBody: "ፕሪምየም ምዝገባኻ ሕዚ ንቁ ኮይኑ ኣሎ። ኩሎም ፍሉያት ኣገልግሎታት ዳህስስ!"
      },
      paymentError: {
        title: "ምርግጋጽ ክፍሊት ኣይተኻእለን",
        body: "ክፍሊትካ ክነረጋግፅ ኣይከኣልናን። እባክኹም ናይ መወከሲ ቑፅሪ ብምሓዝ ሓገዝቲ ኣዘራርቡ።"
      }
    },
    Chat: {
      loading: "ናይ ቤተሰብ ዕልል ይፅዕን ኣሎ...",
      title: "ተጣመርቲ",
      searchPlaceholder: "ተጣመርቲ ድለ...",
      noMatches: "ክሳብ ሕዚ እተጣመሩ የለዉን። ምድላይካ ቀፅል!",
      premiumTitle: "ፕሪምየም ኣገልግሎት",
      premiumSub: "ምስ እተጣመሩ ሰባት ብቀጥታ መልእኽቲ ምልዋጥ ናይ ፕሪምየም ኣገልግሎት እዩ። ጉዕዞኻ ንምጅማር ሕዚ ኣማህይሽ።",
      upgradeNow: "ሕዚ ኣማህይሽ",
      activeNow: "ሕዚ ኣብ መስመር",
      compatibilityTitle: "ናይ አቡሻኪር ምስማዕካ ላዕለዋይ እዩ!",
      compatibilitySub: "ብባህላዊ እሴታት እተመስረተ ዕልል ጀምር።",
      translate: "ናብ {lang} ተርጉም",
      original: "ዋና ኣርእስቲ ኣርእይ",
      iceBreaker: "ናይ AI መበገሲ ሓሳብ",
      typePlaceholder: "ብክብሪ መልእኽቲ ጽሓፍ...",
      selectMatchTitle: "እተጣመረ ሰብ ሕረይ",
      selectMatchSub: "ኣብ ናይ ቤተሰብ ማሕበረሰብ ምስ ተሓራይ ሓጋዚኻ ተራኸብ። እተሓለወ፣ ቀጥታን ምስጢራውነት እተሓለወን መልእኽቲ።",
      encrypted: "እተሓለወ",
      private: "ግላዊ"
    },
    Classes: {
      general: "ሓፈሻዊ ጥበብ",
      premiumOnly: "ንፍሉያት ኣባላት ጥራሕ"
    },
    Friendship: {
      addFriend: "ዓርኪ ወስኽ",
      requestSent: "ሕቶ ተላኢኹ ኣሎ",
      pending: "ምርግጋፅ ይጽበ ኣሎ",
      accept: "ሕቶ ተቀበል",
      decline: "ሕቶ ኣይተቀበልን",
      friends: "ኣዕሩኽ",
      alreadyFriends: "ድሮ ኣዕሩኽ ኢኹም!",
      notification: "ሓዲሽ ናይ ዓርክነት ሕቶ ብ {name}",
      noRequests: "ዝኾነ ዝጽበ ናይ ዓርክነት ሕቶ የለን።",
      about: "ብዛዕባ",
      interests: "ተገዳስነት",
      contactInfo: "ሓበሬታ ርክብ",
      directEmail: "ቀጥታ ኢሜይል",
      premiumOnly: "ንፕሪምየም ጥራሕ",
      openChat: "ዕልል ጀምር",
      startConnection: "ርክብ ጀምር",
      upgradeToRead: "ምሉእ መግለፂ ንምብራህ ናብ ፕሪምየም ኣማህይሽ",
      noBio: "ዝኾነ መግለፂ ኣይተፅሓፈን።",
      premiumFriendsOnly: "ንፕሪምየም ወይ ንኣዕሩኽ ጥራሕ",
      upgradeOrFriendSub: "ዕልል ንምጅማር ናብ ፕሪምየም ኣማህይሽ ወይ ብዓርክነት ተቀባልነት ረከብ።",
      upgradeNow: "ሕዚ ኣማህይሽ"
    },
    Constants: {
      Months: {
        Meskerem: "መስከረም",
        Tikemt: "ጥቅምቲ",
        Hidar: "ሕዳር",
        Tahsas: "ታሕሳስ",
        Tir: "ጥሪ",
        Yekatit: "የካቲት",
        Megabit: "መጋቢት",
        Miazia: "ሚያዝያ",
        Genbot: "ግንቦት",
        Sene: "ሰኔ",
        Hamle: "ሐምለ",
        Nehase: "ነሐሰ",
        Pagume: "ጳጉሜ"
      },
      Locations: {
        "Addis Ababa": "አዲስ አበባ",
        "Dire Dawa": "ድሬዳዋ",
        "Mekelle": "መቐለ",
        "Adama": "አዳማ",
        "Bahir Dar": "ባሕር ዳር",
        "Gondar": "ጎንደር",
        "Hawassa": "ሀዋሳ",
        "Jimma": "ጂማ",
        "Jijiga": "ጅጅጋ"
      },
      Requirements: {
        "Traditional Values": "ባህላዊ እሴታት"
      },
      Countries: {
        Qatar: "ካታር"
      }
    },
    Contact: {
      hqAddress: "ለንደን፣ እንግሊዝ"
    }
  },

  so: {
    Nav: {
      academy: "Akademiiga Beteseb",
      counseling: "Kulamada La-talinta"
    },
    Dashboard: {
      profile: {
        saveChanges: "Kaydi Wax-ka-beddelka",
        defaultCity: "Addis Ababa",
        roles: {
          user: "Xubinta Habesha",
          admin: "Maamulaha Beteseb"
        },
        alerts: {
          avatarFailed: "Upload-ka sawirka wuu suurtagali waayay",
          uploadFailed: "Upload-ku wuu suurtagali waayay",
          deleteFailed: "Tiridu wey faashilantay",
          usernameTaken: "Magacan isticmaalaha waa la qaatay. Tafadhali dooro mid kale.",
          updateSuccess: "Profile-kaaga si successfully ah ayaa loo cusbooneysiiyay!",
          updateFailed: "Cusbooneysiintu wey faashilantay"
        }
      },
      paymentSuccess: {
        coinsTitle: "Qadaadadka Waa La Beecsaday!",
        coinsBody: "Qadaadadkaaga waxaa lagu shubay akownkaaga. Kuを楽し shubista hadyadaha iyo furida sifooyinka!",
        vipTitle: "VIP Access-ka Waa La Active-yeeyay!",
        vipBody: "Xubinnimadaada VIP-da waa active hadda. Ku kaydi helitaanka gaarka ah iyo sifooyinka premium-ka!",
        premiumTitle: "Premium-ka Waa La Active-yeeyay!",
        premiumBody: "Is-dortadaada premium-ka waa active hadda. Bahar sifooyinka gaarka ah oo dhan!"
      },
      paymentError: {
        title: "Xaqiijinta Lacag Bixinta Wey Faashilantay",
        body: "Lacag bixintaada ma xaqiijin karin. Tafadhali la xiriir taageerada iyadoo la raacayo tixraacaaga."
      }
    },
    Chat: {
      loading: "Wada-hadalka qoyska ayaa la soo gelinayaa...",
      title: "Is-fitiinada",
      searchPlaceholder: "Raadi is-fitiinada...",
      noMatches: "Waliina is-fitiin ma jiraan. Sii wad raadinta!",
      premiumTitle: "Sifada Premium-ka",
      premiumSub: "Fariinta tooska ah ee lammaanahaaga waa sifo premium ah. Cusboonaysii hadda si aad u start-gareeyso safarkaaga.",
      upgradeNow: "Cusboonaysii Hadda",
      activeNow: "Kuma Jira Hadda",
      compatibilityTitle: "Is-waafaq Abushakir-kaaga waa sarreeyaa!",
      compatibilitySub: "Ku billow wada-hadal qiyaas dhaqameed ah.",
      translate: "U tarjum {lang}",
      original: "Muuji Asalka",
      iceBreaker: "Soo jeedi AI Ice-Breaker",
      typePlaceholder: "Ku qor fariin si xushmad leh...",
      selectMatchTitle: "Dooro Lammaane",
      selectMatchSub: "Kula xiriir lammaanahaaga suurtagalka ah ee qoyska Beteseb. Fariimaha amniga ah, waqtiga dhabta ah, iyo nabadgelyada diiradda lagu saarayo.",
      encrypted: "Enkriibti ah",
      private: "Garaa ah"
    },
    Classes: {
      general: "Xikmad Guud",
      premiumOnly: "Keliya Xubnaha Gaarka Ah"
    },
    Friendship: {
      addFriend: "Ku dar Saaxiib",
      requestSent: "Codsigii Waa La Diray",
      pending: "Wuxuu Dhowraya Anshaxa",
      accept: "Aqbal Codsiga",
      decline: "Diid Codsiga",
      friends: "Saaxiibada",
      alreadyFriends: "Subhanallah, waa saaxiib noqoteen!",
      notification: "Codsi Saaxiibnimo Cusub oo ka yimid {name}",
      noRequests: "Ma jiraan codsiyo saaxiibnimo oo dhowrayo.",
      about: "Warbixin",
      interests: "Danta",
      contactInfo: "Xogta Lagula Xiriiro",
      directEmail: "Email-ka Tooska ah",
      premiumOnly: "Keliya Premium-ka",
      openChat: "Fura Wada-hadalka",
      startConnection: "Billow Xiriirka",
      upgradeToRead: "Kordhi Premium si aad u akhrido muujinta buuxda",
      noBio: "Warbixin ma tayari hadda.",
      premiumFriendsOnly: "Keliya Premium ama Saaxiibada",
      upgradeOrFriendSub: "Kordhi Premium ama lagaa aqbalo saaxiibnimo si aad u start-gareeyso wada-hadalka.",
      upgradeNow: "Cusboonaysii Hadda"
    },
    Constants: {
      Months: {
        Meskerem: "Meskerem",
        Tikemt: "Tikemt",
        Hidar: "Hidar",
        Tahsas: "Tahsas",
        Tir: "Tir",
        Yekatit: "Yekatit",
        Megabit: "Megabit",
        Miazia: "Miazia",
        Genbot: "Genbot",
        Sene: "Sene",
        Hamle: "Hamle",
        Nehase: "Nehase",
        Pagume: "Pagume"
      },
      Locations: {
        "Addis Ababa": "Addis Ababa",
        "Dire Dawa": "Dire Dawa",
        "Mekelle": "Mekelle",
        "Adama": "Adama",
        "Bahir Dar": "Bahir Dar",
        "Gondar": "Gondar",
        "Hawassa": "Hawassa",
        "Jimma": "Jimma",
        "Jijiga": "Jijiga"
      },
      Requirements: {
        "Traditional Values": "Qiyam Dhaqameed"
      },
      Countries: {
        Qatar: "Qatar"
      }
    },
    Contact: {
      hqAddress: "London, England"
    }
  },

  ar: {
    Nav: {
      academy: "أكاديمية بيتسب",
      counseling: "جلسات الاستشارة"
    },
    Dashboard: {
      profile: {
        saveChanges: "حفظ التغييرات",
        defaultCity: "أديس أبابا",
        roles: {
          user: "عضو حبشي",
          admin: "مشرف بيتسب"
        },
        alerts: {
          avatarFailed: "فشل تحميل الصورة الشخصية",
          uploadFailed: "فشل التحميل",
          deleteFailed: "فشل الحذف",
          usernameTaken: "اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم آخر.",
          updateSuccess: "تم تحديث الملف الشخصي بنجاح!",
          updateFailed: "فشل التحديث"
        }
      },
      paymentSuccess: {
        coinsTitle: "تم شراء العملات!",
        coinsBody: "تمت إضافة العملات إلى حسابك. استمتع بإرسال الهدايا وفتح الميزات!",
        vipTitle: "تم تفعيل الوصول الممتاز VIP!",
        vipBody: "عضويتك الممتازة VIP نشطة الآن. استمتع بالوصول الحصري والميزات المتقدمة!",
        premiumTitle: "تم تفعيل الاشتراك الممتاز!",
        premiumBody: "اشتراكك الممتاز نشط الآن. استكشف جميع الميزات الحصرية!"
      },
      paymentError: {
        title: "فشل التحقق من الدفع",
        body: "لم نتمكن من التحقق من عملية الدفع الخاصة بك. يرجى الاتصال بالدعم مع رقم المرجع الخاص بك."
      }
    },
    Chat: {
      loading: "جاري تحميل محادثة العائلة...",
      title: "التطابقات",
      searchPlaceholder: "البحث في التطابقات...",
      noMatches: "لا توجد تطابقات حتى الآن. استمر في الاستكشاف!",
      premiumTitle: "ميزة ممتازة",
      premiumSub: "المراسلة المباشرة مع تطابقاتك هي ميزة ممتازة. ترقية الآن لبدء رحلتك.",
      upgradeNow: "الترقية الآن",
      activeNow: "نشط الآن",
      compatibilityTitle: "توافق أبوشاكر الخاص بك مرتفع!",
      compatibilitySub: "ابدأ محادثة بالقيم التقليدية.",
      translate: "ترجمة إلى {lang}",
      original: "إظهار النص الأصلي",
      iceBreaker: "اقتراح كاسر الجليد بالذكاء الاصطناعي",
      typePlaceholder: "اكتب رسالة باحترام...",
      selectMatchTitle: "اختر تطابقاً",
      selectMatchSub: "تواصل مع شريكك المحتمل داخل عائلة بيتسب. مراسلة آمنة وفورية ومحفوظة الخصوصية.",
      encrypted: "مشفر",
      private: "خاص"
    },
    Classes: {
      general: "حكمة عامة",
      premiumOnly: "للأعضاء المميزين فقط"
    },
    Friendship: {
      addFriend: "إضافة صديق",
      requestSent: "تم إرسال الطلب",
      pending: "في انتظار الموافقة",
      accept: "قبول الطلب",
      decline: "رفض الطلب",
      friends: "أصدقاء",
      alreadyFriends: "أنتم أصدقاء بالفعل!",
      notification: "طلب صداقة جديد من {name}",
      noRequests: "لا توجد طلبات صداقة معلقة.",
      about: "عن",
      interests: "الاهتمامات",
      contactInfo: "معلومات الاتصال",
      directEmail: "البريد الإلكتروني المباشر",
      premiumOnly: "للمشتركين المميزين فقط",
      openChat: "فتح المحادثة",
      startConnection: "بدء التواصل",
      upgradeToRead: "قم بالترقية إلى الحساب الممتاز لقراءة السيرة الذاتية الكاملة",
      noBio: "لا توجد سيرة ذاتية متوفرة بعد.",
      premiumFriendsOnly: "للمشتركين المميزين أو الأصدقاء فقط",
      upgradeOrFriendSub: "قم بالترقية إلى الحساب الممتاز أو احصل على قبول كصديق لبدء المحادثة.",
      upgradeNow: "الترقية الآن"
    },
    Constants: {
      Months: {
        Meskerem: "ميسكيريم",
        Tikemt: "تيقمت",
        Hidar: "هيدار",
        Tahsas: "تحساس",
        Tir: "طير",
        Yekatit: "يكاتيت",
        Megabit: "ميجابيت",
        Miazia: "ميازيا",
        Genbot: "جينبوت",
        Sene: "سني",
        Hamle: "هملي",
        Nehase: "نيهاسي",
        Pagume: "باجومي"
      },
      Locations: {
        "Addis Ababa": "أديس أبابا",
        "Dire Dawa": "ديرة داوا",
        "Mekelle": "ميكيلي",
        "Adama": "أداما",
        "Bahir Dar": "بحر دار",
        "Gondar": "غوندار",
        "Hawassa": "هاواسا",
        "Jimma": "جيما",
        "Jijiga": "جيجيجا"
      },
      Requirements: {
        "Traditional Values": "القيم التقليدية"
      },
      Countries: {
        Qatar: "قطر"
      }
    },
    Contact: {
      hqAddress: "لندن، إنجلترا"
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const lang of Object.keys(updates)) {
  const filePath = path.join('messages', `${lang}.json`);
  let content = {};
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  deepMerge(content, updates[lang]);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated ${lang}.json successfully.`);
}
