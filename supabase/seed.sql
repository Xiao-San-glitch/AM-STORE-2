-- ============================================================================
-- AM STORE — Seed data
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
  ('Rice', 'rice', 'Everyday, premium and local rice for the family kitchen.', '/products/basmati-rice.jpg', 1),
  ('Dal & Pulses', 'dal-pulses', 'Clean, hand-sorted dals and pulses sold by weight.', '/products/toor-dal.jpg', 2),
  ('Cooking Oils', 'cooking-oils', 'Mustard, sunflower and refined oils for daily cooking.', '/products/mustard-oil.jpg', 3),
  ('Spices', 'spices', 'Freshly ground masalas and whole spices.', '/products/red-chilli-powder.jpg', 4),
  ('Snacks', 'snacks', 'Biscuits, namkeen, noodles and treats for every break.', '/products/potato-chips.jpg', 5),
  ('Household Essentials', 'household-essentials', 'Cleaning and everyday care for a tidy home.', '/products/bath-soap.jpg', 6)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

-- Rice
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Premium Rice', 'premium-rice', 'Long-grain, lightly polished rice that cooks fluffy and separate — a dependable everyday premium choice.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'AM Select', 'RICE-PREM-5', '/products/premium-rice.jpg', 520, 600, 42, '5 kg', true, true),
  ('Regular Rice', 'regular-rice', 'Value-for-money medium-grain rice for daily meals and family cooking.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'Golden Field', 'RICE-REG-10', '/products/regular-rice.jpg', 480, 540, 55, '10 kg', false, true),
  ('Local Rice', 'local-rice', 'Locally grown rice from farms around Longleng — slightly nutty, soft and comforting.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'Naga Harvest', 'RICE-LOCAL-5', '/products/local-rice.jpg', 450, NULL, 28, '5 kg', true, false),
  ('Basmati Rice', 'basmati-rice', 'Aromatic aged basmati with long slender grains — ideal for pulao and biryani.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'Royal Grain', 'RICE-BAS-1', '/products/basmati-rice.jpg', 180, 210, 36, '1 kg', false, false),
  ('Mini Mogra Rice', 'mini-mogra-rice', 'Small-grain aromatic rice, perfect for sweet dishes and everyday pulao.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'Golden Field', 'RICE-MOGRA-1', '/products/mini-mogra-rice.jpg', 95, 110, 24, '1 kg', false, false),
  ('Brown Rice', 'brown-rice', 'Unpolished whole-grain rice with a wholesome bite and gentle nutty flavour.', (SELECT id FROM public.categories WHERE slug = 'rice'), 'Naga Harvest', 'RICE-BROWN-1', '/products/brown-rice.jpg', 135, NULL, 9, '1 kg', false, false)
ON CONFLICT (slug) DO NOTHING;

-- Dal & Pulses
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Masoor Dal', 'masoor-dal', 'Bright pink-orange lentils that cook quickly into a smooth, comforting dal.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'AM Select', 'DAL-MAS-1', '/products/masoor-dal.jpg', 145, 165, 48, '1 kg', true, true),
  ('Moong Dal', 'moong-dal', 'Split and skinned green gram — light, easy to digest and ready in minutes.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'AM Select', 'DAL-MOO-1', '/products/moong-dal.jpg', 165, 180, 35, '1 kg', false, true),
  ('Toor Dal', 'toor-dal', 'Split pigeon peas with a rich, earthy taste — the backbone of a good dal.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'Golden Field', 'DAL-TOOR-1', '/products/toor-dal.jpg', 175, 195, 40, '1 kg', false, false),
  ('Chana Dal', 'chana-dal', 'Split Bengal gram with a firm bite, ideal for dal fry and south Indian dishes.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'Golden Field', 'DAL-CHANA-1', '/products/chana-dal.jpg', 120, 135, 30, '1 kg', false, false),
  ('Urad Dal', 'urad-dal', 'Split black gram, essential for dal makhani, idli and vada batters.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'AM Select', 'DAL-URAD-1', '/products/urad-dal.jpg', 155, NULL, 22, '1 kg', false, false),
  ('Rajma', 'rajma', 'Plump red kidney beans that cook up creamy — perfect for a slow rajma curry.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'Naga Harvest', 'PLS-RAJMA-1', '/products/rajma.jpg', 190, 210, 18, '1 kg', false, false),
  ('Kabuli Chana', 'kabuli-chana', 'Large white chickpeas for chole, salads and hearty winter curries.', (SELECT id FROM public.categories WHERE slug = 'dal-pulses'), 'Naga Harvest', 'PLS-CHANA-1', '/products/kabuli-chana.jpg', 130, 145, 26, '1 kg', false, false)
ON CONFLICT (slug) DO NOTHING;

-- Cooking Oils
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Mustard Oil', 'mustard-oil', 'Pungent, cold-pressed mustard oil — the classic choice for tempering and pickles.', (SELECT id FROM public.categories WHERE slug = 'cooking-oils'), 'Pure Gold', 'OIL-MUS-1', '/products/mustard-oil.jpg', 185, 210, 44, '1 litre', true, true),
  ('Sunflower Oil', 'sunflower-oil', 'Light refined sunflower oil with a neutral taste for everyday frying and cooking.', (SELECT id FROM public.categories WHERE slug = 'cooking-oils'), 'Sunrise', 'OIL-SUN-1', '/products/sunflower-oil.jpg', 165, 185, 50, '1 litre', false, true),
  ('Soybean Oil', 'soybean-oil', 'Economical refined soybean oil that suits daily Indian cooking.', (SELECT id FROM public.categories WHERE slug = 'cooking-oils'), 'Everyday', 'OIL-SOY-1', '/products/soybean-oil.jpg', 150, 170, 38, '1 litre', false, false),
  ('Refined Cooking Oil', 'refined-cooking-oil', 'All-purpose refined cooking oil in a family-size jar for the month''s kitchen.', (SELECT id FROM public.categories WHERE slug = 'cooking-oils'), 'Everyday', 'OIL-REF-5', '/products/refined-cooking-oil.jpg', 790, 890, 10, '5 litres', true, false),
  ('Coconut Oil', 'coconut-oil', 'Pure coconut oil for cooking, hair care and traditional preparation.', (SELECT id FROM public.categories WHERE slug = 'cooking-oils'), 'Green Valley', 'OIL-COCO-500', '/products/coconut-oil.jpg', 210, 235, 16, '500 ml', false, false)
ON CONFLICT (slug) DO NOTHING;

-- Spices
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Turmeric Powder', 'turmeric-powder', 'Bright, finely ground haldi with a clean earthy aroma.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'AM Select', 'SPC-TUR-100', '/products/turmeric-powder.jpg', 45, 55, 62, '100 g', true, true),
  ('Red Chilli Powder', 'red-chilli-powder', 'Vibrant, moderately hot chilli powder for curries, chutneys and tadka.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'AM Select', 'SPC-CHL-100', '/products/red-chilli-powder.jpg', 55, 65, 54, '100 g', false, true),
  ('Coriander Powder', 'coriander-powder', 'Freshly milled dhania powder with a warm, citrusy fragrance.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'AM Select', 'SPC-COR-100', '/products/coriander-powder.jpg', 40, 48, 47, '100 g', false, false),
  ('Black Pepper', 'black-pepper', 'Whole black peppercorns with a sharp, lingering heat.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'Green Valley', 'SPC-PEP-100', '/products/black-pepper.jpg', 120, 135, 21, '100 g', false, false),
  ('Garam Masala', 'garam-masala', 'A house blend of roasted whole spices, ground fresh for depth and warmth.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'AM Select', 'SPC-GAR-100', '/products/garam-masala.jpg', 75, 90, 33, '100 g', true, false),
  ('Ginger Garlic Paste', 'ginger-garlic-paste', 'Ready-to-use paste of fresh ginger and garlic — no peeling, no grinding.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'Everyday', 'SPC-GGP-250', '/products/ginger-garlic-paste.jpg', 95, 110, 25, '250 g', false, false),
  ('Cumin Seeds', 'cumin-seeds', 'Whole jeera with a strong, nutty aroma for tempering dals and sabzis.', (SELECT id FROM public.categories WHERE slug = 'spices'), 'Green Valley', 'SPC-CUM-100', '/products/cumin-seeds.jpg', 60, 70, 12, '100 g', false, false)
ON CONFLICT (slug) DO NOTHING;

-- Snacks
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Glucose Biscuits', 'glucose-biscuits', 'Crisp, lightly sweet glucose biscuits — the everyday chai companion.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Everyday', 'SNK-BIS-200', '/products/glucose-biscuits.jpg', 40, 45, 70, '200 g', false, true),
  ('Potato Chips', 'potato-chips', 'Thin, crunchy salted potato chips in a resealable pack.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Crunch Co.', 'SNK-CHP-90', '/products/potato-chips.jpg', 30, NULL, 58, '90 g', false, false),
  ('Namkeen Mixture', 'namkeen-mixture', 'A savoury mix of sev, peanuts and spices — perfect with evening tea.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Crunch Co.', 'SNK-NMK-200', '/products/namkeen-mixture.jpg', 55, 65, 34, '200 g', false, false),
  ('Instant Noodles', 'instant-noodles', 'Quick masala noodles for a hot bowl in five minutes.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Everyday', 'SNK-NDL-280', '/products/instant-noodles.jpg', 48, 55, 64, '280 g (4 pack)', false, true),
  ('Milk Chocolate', 'milk-chocolate', 'Smooth milk chocolate bar — a small treat for the sweet tooth.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Cocoa House', 'SNK-CHO-100', '/products/milk-chocolate.jpg', 90, 100, 27, '100 g', false, false),
  ('Packaged Snacks Combo', 'packaged-snacks-combo', 'A mixed pack of popular packaged snacks — handy for guests and travel.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Crunch Co.', 'SNK-COMBO-150', '/products/packaged-snacks-combo.jpg', 45, NULL, 8, '150 g', false, false),
  ('Rusk Toast', 'rusk-toast', 'Twice-baked rusk slices, crisp and lightly sweetened.', (SELECT id FROM public.categories WHERE slug = 'snacks'), 'Everyday', 'SNK-RUSK-300', '/products/rusk-toast.jpg', 50, 60, 31, '300 g', false, false)
ON CONFLICT (slug) DO NOTHING;

-- Household Essentials
INSERT INTO public.products (name, slug, description, category_id, brand, sku, image_url, price, original_price, stock_quantity, unit, featured, best_seller) VALUES
  ('Detergent Powder', 'detergent-powder', 'Strong stain-fighting detergent powder for buckets and machines.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-DET-1', '/products/detergent-powder.jpg', 120, 140, 39, '1 kg', true, true),
  ('Dishwashing Liquid', 'dishwashing-liquid', 'Lemon-scented liquid that cuts grease fast and rinses clean.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-DSH-750', '/products/dishwashing-liquid.jpg', 99, 115, 42, '750 ml', false, false),
  ('Bath Soap', 'bath-soap', 'Moisturising bath soap bars in a value pack of four.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-SOAP-4', '/products/bath-soap.jpg', 110, 130, 46, '4 x 100 g', false, false),
  ('Toilet Cleaner', 'toilet-cleaner', 'Thick acidic gel that clings to surfaces and removes stains and odour.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-TLT-500', '/products/toilet-cleaner.jpg', 95, NULL, 23, '500 ml', false, false),
  ('Floor Cleaner', 'floor-cleaner', 'Floral floor cleaner for daily mopping — safe on tile and stone.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-FLR-1', '/products/floor-cleaner.jpg', 130, 150, 19, '1 litre', false, false),
  ('Tissue Paper', 'tissue-paper', 'Soft two-ply facial tissues, 200 pulls per box.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-TIS-200', '/products/tissue-paper.jpg', 75, 85, 3, '200 sheets', false, false),
  ('Scrub Pad Pack', 'scrub-pad-pack', 'Heavy-duty scrub pads for utensils, pack of three.', (SELECT id FROM public.categories WHERE slug = 'household-essentials'), 'Fresh Home', 'HH-SCRUB-3', '/products/scrub-pad-pack.jpg', 35, NULL, 51, '3 pads', false, false)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Product Variants
-- ---------------------------------------------------------------------------

INSERT INTO public.product_variants (product_id, variant_name, price, original_price, stock_quantity, sku) VALUES
  -- Premium Rice
  ((SELECT id FROM public.products WHERE slug = 'premium-rice'), '1 kg', 118, 135, 60, 'RICE-PREM-1'),
  ((SELECT id FROM public.products WHERE slug = 'premium-rice'), '5 kg', 520, 600, 42, 'RICE-PREM-5'),
  ((SELECT id FROM public.products WHERE slug = 'premium-rice'), '10 kg', 990, 1150, 18, 'RICE-PREM-10'),
  ((SELECT id FROM public.products WHERE slug = 'premium-rice'), '25 kg', 2450, 2800, 6, 'RICE-PREM-25'),
  -- Regular Rice
  ((SELECT id FROM public.products WHERE slug = 'regular-rice'), '5 kg', 250, 280, 40, 'RICE-REG-5'),
  ((SELECT id FROM public.products WHERE slug = 'regular-rice'), '10 kg', 480, 540, 55, 'RICE-REG-10'),
  ((SELECT id FROM public.products WHERE slug = 'regular-rice'), '25 kg', 1180, 1300, 12, 'RICE-REG-25'),
  -- Local Rice
  ((SELECT id FROM public.products WHERE slug = 'local-rice'), '5 kg', 450, NULL, 28, 'RICE-LOCAL-5'),
  ((SELECT id FROM public.products WHERE slug = 'local-rice'), '10 kg', 860, NULL, 14, 'RICE-LOCAL-10'),
  -- Basmati Rice
  ((SELECT id FROM public.products WHERE slug = 'basmati-rice'), '1 kg', 180, 210, 36, 'RICE-BAS-1'),
  ((SELECT id FROM public.products WHERE slug = 'basmati-rice'), '5 kg', 850, 980, 11, 'RICE-BAS-5'),
  -- Masoor Dal
  ((SELECT id FROM public.products WHERE slug = 'masoor-dal'), '500 g', 76, 85, 30, 'DAL-MAS-500'),
  ((SELECT id FROM public.products WHERE slug = 'masoor-dal'), '1 kg', 145, 165, 48, 'DAL-MAS-1'),
  ((SELECT id FROM public.products WHERE slug = 'masoor-dal'), '2 kg', 280, 320, 16, 'DAL-MAS-2'),
  -- Moong Dal
  ((SELECT id FROM public.products WHERE slug = 'moong-dal'), '500 g', 85, 95, 22, 'DAL-MOO-500'),
  ((SELECT id FROM public.products WHERE slug = 'moong-dal'), '1 kg', 165, 180, 35, 'DAL-MOO-1'),
  -- Toor Dal
  ((SELECT id FROM public.products WHERE slug = 'toor-dal'), '1 kg', 175, 195, 40, 'DAL-TOOR-1'),
  ((SELECT id FROM public.products WHERE slug = 'toor-dal'), '2 kg', 340, 380, 10, 'DAL-TOOR-2'),
  -- Mustard Oil
  ((SELECT id FROM public.products WHERE slug = 'mustard-oil'), '1 litre', 185, 210, 44, 'OIL-MUS-1'),
  ((SELECT id FROM public.products WHERE slug = 'mustard-oil'), '5 litres', 880, 960, 9, 'OIL-MUS-5'),
  -- Sunflower Oil
  ((SELECT id FROM public.products WHERE slug = 'sunflower-oil'), '1 litre', 165, 185, 50, 'OIL-SUN-1'),
  ((SELECT id FROM public.products WHERE slug = 'sunflower-oil'), '5 litres', 790, 880, 12, 'OIL-SUN-5'),
  -- Turmeric Powder
  ((SELECT id FROM public.products WHERE slug = 'turmeric-powder'), '100 g', 45, 55, 62, 'SPC-TUR-100'),
  ((SELECT id FROM public.products WHERE slug = 'turmeric-powder'), '200 g', 84, 100, 30, 'SPC-TUR-200'),
  -- Detergent Powder
  ((SELECT id FROM public.products WHERE slug = 'detergent-powder'), '1 kg', 120, 140, 39, 'HH-DET-1'),
  ((SELECT id FROM public.products WHERE slug = 'detergent-powder'), '2 kg', 225, 260, 15, 'HH-DET-2');

-- ---------------------------------------------------------------------------
-- Store Settings
-- ---------------------------------------------------------------------------

UPDATE public.store_settings SET
  store_name = 'AM STORE',
  tagline = 'Your neighbourhood grocery destination in Longleng.',
  address = 'Main Market Road, Longleng',
  pin_code = '789625',
  phone = '6003733598',
  whatsapp = '916003733598',
  email = 'orders@amstore.in',
  delivery_charge = 40,
  free_delivery_threshold = 799,
  min_order_amount = 199,
  opening_hours = 'Monday – Saturday, 8:00 AM – 8:00 PM',
  announcement = 'Your Trusted Grocery Store in Longleng, Nagaland',
  hero_heading = 'Everyday Essentials. Exceptional Value.',
  hero_subheading = 'Your neighbourhood grocery destination in Longleng.',
  hero_image = '/products/hero-groceries.jpg',
  social_instagram = 'https://instagram.com',
  social_facebook = 'https://facebook.com',
  social_whatsapp = '916003733598',
  delivery_enabled = true,
  pickup_enabled = true,
  cod_enabled = true,
  online_payment_enabled = false,
  delivery_areas = 'Longleng Town, Longleng Village, Yongnyah, Tamlu, Namsang'
WHERE id = 1;
