const fs = require('fs');
const om = JSON.parse(fs.readFileSync('messages/om.json', 'utf8'));

om.TopHeader = {
  email: 'contact@beteseb.com',
  phone: '+49 (0) 123 456 789',
  suggestion: '{lang} fayyadamuu filattu? Jijjiiruuf?',
  switchBtn: 'Jijjiiri'
};

om.Footer = {
  tagline: 'ቤተሰብ | Beteseb - Gaa’ela Itiyoophiyaa Addunyaa Maraa',
  description: 'Aadaa, teeknoolojii fi oowwa maatii waliin maatii Itiyoophiyaa addunyaa mara haala gaariin walitti fiduuf hojanna.',
  connect: 'Qunnamtii',
  platform: 'Pilaatoformii',
  legal: 'Seera',
  vision: 'Mul’ata Keenya',
  classes: 'Kilaasota Gaa’elaa',
  start: 'Barnoota Jalqabi',
  terms: 'Haala Itti Fayyadamaa',
  privacy: 'Iccitii eeguu',
  admin: 'Balgala Admin',
  copyright: '© 2026 Beteseb (ቤተሰብ). Maatii Walitti Fiduu.',
  address: 'Harar, Itiyoophiyaa',
  community: 'Hawaasa'
};

om.Classes = {
  hero: {
    tagline: 'Adeemsa Gaa’elaa Qajeelfamaan',
    title1: 'Gaa’ela qofa miti.',
    title2: 'Ogummaa Jireenyaa.',
    subtitle: 'Leenjii fi kilaasota gaa’ela duraa keenya irratti hirmaadhaa.',
    cta: 'Galmaa’ii hunda argadhu'
  },
  list: {
    class1: { title: 'Abuushakir Hubachuu', desc: 'Ogummaa gaa’elaa Itiyoophiyaa durii hubachuu...', date: 'Kibxata hunda @ 7 PM', badge: 'BILISA' },
    class2: { title: 'Aadaa fi Maatii', desc: 'Jireenya ammayyaa keessatti aadaa eeggachuu...', date: 'Kamisa hunda @ 6 PM', badge: 'BEEKAMAA' },
    class3: { title: 'Adeemsa Mirkanaa’e', desc: 'Piroofayilii keessan akkamitti sirreessitu...', date: 'Sanbata @ 11 AM', badge: 'GALMAA’UU' }
  },
  counseling: {
    tagline: 'Gargaarsa Dhuunfaa',
    title1: 'Ogeeyyii Addunyaa.',
    title2: 'Isiniif qophaa’an.',
    subtitle: 'Gorsa dhuunfaa maatii keessaniif argadhu.',
    stat1Value: '500+',
    stat1Label: 'Ogeeyyii Hojii irra jiran',
    stat2Value: '100%',
    stat2Label: 'Iccitii',
    curriculumTitle: 'Qabiyyee Leenjii',
    topics: {
      t1: 'Hariiroo Aadaa Garaa Garaa',
      t2: 'Walitti bu’iinsa hiikuu',
      t3: 'Maallaqa bulchuu',
      t4: 'Gahee Aadaa fi Ammayyaa'
    }
  },
  footerMeta: 'Addunyaa Maraaf',
  footerCTA: 'Premium Jalqabi'
};

om.Constants = {
  Religions: { Orthodox: 'Ortodoksii', Protestant: 'Pirootestaantii', Catholic: 'Kaatoolikii', Muslim: 'Musliima', Other: 'Kan biraa' },
  Genders: { Male: 'Dhiira', Female: 'Dhalaa' },
  Marital: { Single: 'Hin fuune/hin heerumne', Divorced: 'Kan hiike/hiikte', Widow: 'Haadha manaa kan irraa du’e', Widower: 'Abbaa manaa kan irraa du’e' },
  Finance: { Spender: 'Baasii baasaa', Saver: 'Qusataa', Balanced: 'Giddu-galeessa', Frugal: 'Qusataa cimaa' },
  Values: { Traditional: 'Aadaa', Modern: 'Ammayyaa', Liberal: 'Libiraalii', 'Religious-Centric': 'Amantii' },
  Conflict: { 'Direct Discussion': 'Maree kallattiin', 'Indirect / Subtle': 'Maree kallattii hin taane', 'Silent Treatment': 'Callisuu', 'Mediation Required': 'Jaarsummaa' },
  Locations: { 'Addis Ababa': 'Finfinnee', 'Dire Dawa': 'Dirree Dhawaa', 'Mekelle': 'Maqalee', 'Adama': 'Adaamaa', 'Bahir Dar': 'Baahir Daar', 'Gondar': 'Gondar', 'Hawassa': 'Hawaasaa', 'Jimma': 'Jimmaa', 'Jijiga': 'Jijigaa', 'Other (International)': 'Biyya alaa' }
};

fs.writeFileSync('messages/om.json', JSON.stringify(om, null, 2));
