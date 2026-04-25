const fs = require('fs');

const om = {
  Index: {
    Hero: {
      tagline: 'Oowwa Aadaa, Akkaataa Ammayyaa',
      title1: 'Gaa’ela Jabaa',
      title2: 'Maatii Dhalootaaf',
      subtitle: 'Maatii Itiyoophiyaa cimsuu fi aadaa irratti hundaa’uun gaa’ela gaarii ijaaruuf carraaqna.',
      cta1: 'Hikaawuntii uumi',
      cta2: ' Mul’ata Keenya',
      verify1: 'Paaspoortii mirkanaa’e',
      verify2: 'Eenyummaa Mirkanaaa’e',
      verify3: 'Mootora Abuushakir'
    },
    Vision: {
      tagline: 'Dhaalmaya Keenya',
      title: 'Addunyaa Digitaalaa keessatti Maatii Tiksuu',
      subtitle: 'Mul’ata Beteseb keessatti ogummaa Abuushakir ni argama. Haala ammayyaan maatii keessan ijaaraa.',
      cta: 'Mul’ata Keenya Ilaalaa',
      stat: 'Sirrummaa Gaa’elaa'
    },
    modal: {
      step1: 'Tarkaanfii 1: Nageenya fi Gatii',
      where: 'Eessa jirtu?',
      currencyNote: 'Bakka jirtan irratti hundaa’uun gatii fi kaffaltii isiniif argisiisna.',
      localTitle: 'Itiyoophiyaa Keessa',
      localSub: 'Kaffaltii Qarshiin',
      globalTitle: 'Addunyaa Mara',
      globalSub: 'Kaffaltii Doolaaraan'
    }
  },
  Nav: {
    home: 'Mana',
    about: 'Waa’ee Keenya',
    classes: 'Kilaasota',
    signIn: 'Seenaa',
    signUp: 'Maatii Ta’aa',
    login: 'Seenuu / Galmaa’uu',
    logout: 'Ba’uu',
    settings: 'Sajataa',
    dashboard: 'Dasiboordii',
    chat: 'Tapha',
    community: 'Hawaasa',
    workshops: 'Leenjii',
    profile: 'Piroofayilii'
  },
  Dashboard: {
    welcome: 'Baga Nagaan Dhufte',
    subtitle: 'Hiriyaa jireenyaa kee barbaadi',
    trialExpired: 'Yeroon yaalii xumurameera',
    trialEnded: 'Yeroon yaalii kee guyyaa 3 xumurameera. Maaloo itti fufuuf kaffaltii raawwadhu.',
    upgradeNow: 'Ammuma Fooyyessi',
    backToDash: 'Gara Dasiboordiitti deebi’i',
    subscription: 'Kaffaltii',
    premium: { active: 'Piriimiyeemiin hojiirra jira', pending: 'Ilaalamaa jira', expired: 'Yeroon xumurameera', unlock: 'Piriimiyeemii banadhu' },
    matching: { title: 'Namoota Sitti dhiyaatan', viewAll: 'Hunda Ilaali', percent: 'Waliigaltee' }
  },
  Auth: {
    signIn: 'Seenaa',
    signUp: 'Galmaa’i',
    email: 'Imeelii',
    phone: 'Lakkoofsa Bilbilaa',
    password: 'Jecha Iccitii',
    forgot: 'Jecha iccitii irranfattee?',
    noAccount: 'Hikaawuntii hin qabduu?',
    haveAccount: 'Hikaawuntii qabduu?',
    phoneTab: 'Bilbila',
    countryCode: 'Koodii Biyyaa',
    processing: 'Hojatamaa jira...'
  },
  Chatbot: {
    welcome: 'Baga gara Beteseb nagaan dhufte!',
    status: 'Gargaaraa',
    botName: 'Beteseb AI',
    placeholder: 'Waan feete na gaafadhu...',
    faq: {
      abushakir: 'Mootirri keenya Abuushakir irratti hundaa’a',
      pricing: 'Gatii garaagaraa qabna',
      verified: 'Eenyummaa mirkaneessuun dirqama',
      hello: 'Akkam! Gargaaraa keeti',
      default: 'Waa’ee keenya hunda siif ibsuu danda’a'
    },
    btn: { abushakir: 'Abuushakir', pricing: 'Gatii', verified: 'Mirkaneessa' }
  },
  About: {
    tagline: 'Mul’ata Keenya',
    subtitle: 'Beteseb gaa’ela qofa miti',
    missionTitle: 'Ergaa Keenya',
    missionDesc: 'Fageenya maqsuuf hojanna...',
    joinStats: 'Maatii 1,000+ gammadanitti makamaa',
    ctaTitle: 'Dhaalmaya kanaan makamaa',
    ctaButton: 'Har’uma makamaa'
  },
  community: {
    communityTitle: 'Maree Maatii',
    communitySubtitle: 'Waa’ee aadaa fi gaa’elaa mari’adhaa',
    newPostPlaceholder: 'Yaada kee qoodi...',
    postButton: 'Hawaasaaf qoodi',
    moderated: 'Ilaalameera',
    topicDay: 'Mataduree Har’aa',
    loadingFeed: 'Feedii fe’aa jira...',
    safetyAlert: 'Yaadni kee ulaagaa keenya hin guunne. Maaloo kabajaan barreessi.'
  },
  Onboarding: {
    title: 'Balbala Maatii',
    personalDetails: 'Oduu Dhuunfaa',
    idVerification: {
      title: 'Eenyummaa Mirkaneessuu',
      subtitle: 'Waraqaan eenyummaa ni barbaadama',
      doc: 'Waraqaa Olfe’i',
      idType: 'Paaspoortii ykn ID',
      idCaptured: 'ID fudhatameera',
      takeSelfie: 'Suuraa ka’i',
      livePhoto: 'Suuraa qabatamaa',
      selfieCaptured: 'Suuraan fudhatameera',
      submitAI: 'AI-f ergi',
      rejected: 'Mirkaneessi kee hin fudhatamne.'
    },
    nav: { back: 'Deebi’i', continue: 'Itti fufi', finish: 'Xumuri', processing: 'Hojatamaa jira...' }
  }
};

fs.writeFileSync('messages/om.json', JSON.stringify(om, null, 2));
