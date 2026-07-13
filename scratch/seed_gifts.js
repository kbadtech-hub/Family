const { createClient } = require('@supabase/supabase-js');

// Load env variables
const supabaseUrl = 'https://mpreyyjclfklvofzfosc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcmV5eWpjbGZrbHZvZnpmb3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzExNzYyMywiZXhwIjoyMDkyNjkzNjIzfQ.uplICXpCoqzPZZb55yKhoWa-srZhNOyhqzBfI_SSEMk';

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Cannot seed gifts.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const giftCatalogItems = [
  // 1. Luxury Chocolate Cake (የተመረጠ ቸኮሌት ኬክ)
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name_en: "Luxury Chocolate Cake",
    name_am: "የተመረጠ ቸኮሌት ኬክ",
    name_om: "Keekii Cokoleetii Kabaa",
    name_ti: "ፍሉይ ቸኮሌት ኬክ",
    name_so: "Keega Shukulaatada Qaaliga ah",
    name_ar: "كعكة الشوكولاتة الفاخرة",
    image_url: "luxury_cake",
    coin_price: 120,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 15.00
  },
  // 2. Movie & Popcorn Ticket (የሲኒማ መግቢያ ካርድ)
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name_en: "Movie & Popcorn Ticket",
    name_am: "የሲኒማ መግቢያ ካርድ",
    name_om: "Tikkee Tiyaatiraa fi Poppikoornii",
    name_ti: "ቲኬት ሲነማን ፖፕኮርንን",
    name_so: "Tikitka Filimada iyo Boodhka",
    name_ar: "تذكرة السينما والفشار",
    image_url: "movie_ticket",
    coin_price: 40,
    is_active: true,
    category: "coupons",
    unlock_level: 1,
    commission_rate: 0.10,
    base_delivery_fee: 0.00
  },
  // 3. Romantic Dinner Coupon (የራት ግብዣ ካርድ)
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name_en: "Romantic Dinner Coupon",
    name_am: "የራት ግብዣ ካርድ",
    name_om: "Kupoonii Irbaata Dhiiraa",
    name_ti: "ኩፖን ሮማንቲክ ድራር",
    name_so: "Koonbka Cashada Jaceylka",
    name_ar: "قسيمة عشاء رومانسي",
    image_url: "dinner_coupon",
    coin_price: 150,
    is_active: true,
    category: "coupons",
    unlock_level: 2,
    commission_rate: 0.15,
    base_delivery_fee: 0.00
  },
  // 4. Love Postcard Set (የፍቅር ፖስት ካርድ)
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name_en: "Love Postcard Set",
    name_am: "የፍቅር ፖስት ካርድ",
    name_om: "Kaardii Jaalalaa",
    name_ti: "ካርድ ፍቕሪ",
    name_so: "Kaararka Boostada ee Jaceylka",
    name_ar: "بطاقات بريدية للحب",
    image_url: "love_postcard",
    coin_price: 10,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 5.00
  },
  // 5. Premium Chocolate Box (የጥራት ቸኮሌት ሳጥን)
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name_en: "Premium Chocolate Box",
    name_am: "የጥራት ቸኮሌት ሳጥን",
    name_om: "Saanduqa Cokoleetii Kabaa",
    name_ti: "ሳንዱቕ ቸኮሌት",
    name_so: "Sanduuqa Shukulaatada Premium",
    name_ar: "علبة شوكولاتة فاخرة",
    image_url: "chocolate_box",
    coin_price: 60,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 10.00
  },
  // 6. Traditional Coffee Rekebot (የሀበሻ ረክቦት)
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    name_en: "Traditional Coffee Rekebot",
    name_am: "የሀበሻ ረክቦት",
    name_om: "Rekebot Bunaa",
    name_ti: "ረክቦት ቡን",
    name_so: "Rakeebotka Bunka Dhaqanka",
    name_ar: "ركبوت القهوة التقليدي",
    image_url: "coffee_rekebot",
    coin_price: 250,
    is_active: true,
    category: "cultural",
    unlock_level: 3,
    commission_rate: 0.15,
    base_delivery_fee: 25.00
  },
  // 7. Traditional Gold Ring (የወርቅ ቀለበት)
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    name_en: "Traditional Gold Ring",
    name_am: "የወርቅ ቀለበት",
    name_om: "Qubee Meetii",
    name_ti: "ቀለበት ወርቂ",
    name_so: "Fargalka Dahabka ee Dhaqanka",
    name_ar: "خاتم ذهبي تقليدي",
    image_url: "gold_ring",
    coin_price: 600,
    is_active: true,
    category: "cultural",
    unlock_level: 4,
    commission_rate: 0.15,
    base_delivery_fee: 30.00
  },
  // 8. Love Poetry Book (የፍቅር ግጥም መጽሐፍ)
  {
    id: 'c8888888-8888-8888-8888-888888888888',
    name_en: "Love Poetry Book",
    name_am: "የፍቅር ግጥም መጽሐፍ",
    name_om: "Kitaaba Walaloo Jaalalaa",
    name_ti: "መፅሓፍ ግጥሚ ፍቕሪ",
    name_so: "Buugga Gabayada Jaceylka",
    name_ar: "كتاب شعر الحب",
    image_url: "poetry_book",
    coin_price: 30,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 5.00
  },
  // 9. Habesha Coffee Sini (የሀበሻ ሲኒ)
  {
    id: '11111111-1111-1111-1111-111111111111',
    name_en: "Habesha Coffee Sini",
    name_am: "የሀበሻ ሲኒ",
    name_om: "Sini Buna Habeshaa",
    name_ti: "ፅዋ ቡን ሓበሻ",
    name_so: "Koobka Bunka Xabashida",
    name_ar: "فنجان قهوة حبشية",
    image_url: "sini_coffee",
    coin_price: 20,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 0.00
  },
  // 10. Shamma Candle (የፍቅር ሻማ)
  {
    id: '33333333-3333-3333-3333-333333333333',
    name_en: "Shamma Candle",
    name_am: "የፍቅር ሻማ",
    name_om: "Shamaa Habeshaa",
    name_ti: "ሽምዓ ሓበሻ",
    name_so: "Shamaa Xabashida",
    name_ar: "شمعة حبشية",
    image_url: "shamma_candle",
    coin_price: 15,
    is_active: true,
    category: "cultural",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 0.00
  },
  // 11. Jebena Pot (የሀበሻ ጀበና)
  {
    id: '44444444-4444-4444-4444-444444444444',
    name_en: "Jebena Pot",
    name_am: "የሀበሻ ጀበና",
    name_om: "Jabanaa Habeshaa",
    name_ti: "ጀበና ሓበሻ",
    name_so: "Kettle Xabashida",
    name_ar: "جبنة حبشية",
    image_url: "jebena_pot",
    coin_price: 100,
    is_active: true,
    category: "cultural",
    unlock_level: 2,
    commission_rate: 0.15,
    base_delivery_fee: 10.00
  },
  // 12. Habesha Flower (የማር አበባ)
  {
    id: '22222222-2222-2222-2222-222222222222',
    name_en: "Habesha Flower",
    name_am: "የማር አበባ",
    name_om: "Abaaroo Habeshaa",
    name_ti: "ዕምባባ ሓበሻ",
    name_so: "Ubaxa Xabashida",
    name_ar: "وردة حبشية",
    image_url: "habesha_flower",
    coin_price: 50,
    is_active: true,
    category: "flowers",
    unlock_level: 1,
    commission_rate: 0.15,
    base_delivery_fee: 0.00
  },
  // 13. Premium Boxed Flowers (በቅንጡ ሳጥን አበባዎች)
  {
    id: '88888888-8888-8888-8888-888888888888',
    name_en: "Premium Boxed Flowers",
    name_am: "በቅንጡ ሳጥን አበባዎች",
    name_om: "Abaaroo Luxury Box",
    name_ti: "ዕምባባታት ፅኑዕ",
    name_so: "Ubax Boxed",
    name_ar: "أزهار فاخرة مغلفة",
    image_url: "boxed_flowers",
    coin_price: 80,
    is_active: true,
    category: "flowers",
    unlock_level: 2,
    commission_rate: 0.15,
    base_delivery_fee: 20.00
  },
  // 14. Habesha Couple Outfit (የጥንዶች ባህል ልብስ)
  {
    id: '99999999-9999-9999-9999-999999999999',
    name_en: "Habesha Couple Outfit",
    name_am: "የጥንዶች ባህል ልብስ",
    name_om: "Uffata Aadaa Habeshaa",
    name_ti: "ባህላዊ አልባሳት",
    name_so: "Kappo Outfit",
    name_ar: "أزهار تقليدية للزوجين",
    image_url: "cultural_outfit",
    coin_price: 300,
    is_active: true,
    category: "cultural",
    unlock_level: 3,
    commission_rate: 0.20,
    base_delivery_fee: 50.00
  }
];

async function seed() {
  console.log("Starting gift seeding...");

  // 1. Deactivate pets (doves, puppy, kitten)
  const { error: deactivateError } = await supabase
    .from('gift_catalog')
    .update({ is_active: false })
    .eq('category', 'pets');

  if (deactivateError) {
    console.error("Error deactivating pets:", deactivateError);
  } else {
    console.log("Successfully deactivated pet-category gifts (no living things allowed).");
  }

  // 2. Upsert non-living gift items
  for (const item of giftCatalogItems) {
    const { error } = await supabase
      .from('gift_catalog')
      .upsert(item);

    if (error) {
      console.error(`Error seeding item "${item.name_en}":`, error);
    } else {
      console.log(`Successfully seeded/updated: "${item.name_en}"`);
    }
  }

  console.log("Gift seeding finished successfully!");
}

seed();
