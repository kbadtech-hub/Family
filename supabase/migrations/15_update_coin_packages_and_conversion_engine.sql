-- Migration 15: Update Coin Packages & Exchange Rate Parity ($1 USD = 200 ETB)
-- Base Conversion: $15 USD = 3000 ETB = 10000 Base Coins

UPDATE public.settings
SET coin_packages = '[
  {"id":"coins_100",  "baseCoins":100,  "bonusPercent":0,  "bonusCoins":0,   "coins":100,  "priceEtb":30,   "priceUsd":0.15},
  {"id":"coins_500",  "baseCoins":500,  "bonusPercent":0,  "bonusCoins":0,   "coins":500,  "priceEtb":150,  "priceUsd":0.75},
  {"id":"coins_1000", "baseCoins":1000, "bonusPercent":0,  "bonusCoins":0,   "coins":1000, "priceEtb":300,  "priceUsd":1.50},
  {"id":"coins_3000", "baseCoins":3000, "bonusPercent":3,  "bonusCoins":90,  "coins":3090, "priceEtb":900,  "priceUsd":4.50,  "discount":"+3% BONUS"},
  {"id":"coins_5000", "baseCoins":5000, "bonusPercent":5,  "bonusCoins":250, "coins":5250, "priceEtb":1500, "priceUsd":7.50,  "discount":"+5% BONUS"},
  {"id":"coins_7000", "baseCoins":7000, "bonusPercent":7,  "bonusCoins":490, "coins":7490, "priceEtb":2100, "priceUsd":10.50, "discount":"+7% BONUS"},
  {"id":"coins_10000","baseCoins":10000,"bonusPercent":10, "bonusCoins":1000,"coins":11000,"priceEtb":3000, "priceUsd":15.00, "discount":"+10% BONUS"}
]'::jsonb
WHERE true;
