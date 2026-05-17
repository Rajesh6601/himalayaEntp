-- Migration 005: Sync categories and products to match latest schema
-- Fixes: missing Load Body & Waste Management categories, outdated category names,
-- and adds all missing products on VPS

BEGIN;

-- 1. Rename existing categories to match current names
UPDATE categories SET name = 'Containers' WHERE id = 'container-bodies';
UPDATE categories SET name = 'All kinds of Automobile Body Building work' WHERE id = 'custom';
UPDATE categories SET name = 'Tracter Trolleys' WHERE id = 'tractors';
UPDATE categories SET name = 'Water Tanker' WHERE id = 'water-tanks';

-- 2. Fix container-bodies → containers ID
-- Need to update products FK first, then rename the category
UPDATE products SET category_id = 'container-bodies' WHERE category_id = 'container-bodies';

-- Insert new category with correct ID, migrate products, then delete old one
INSERT INTO categories (id, name) VALUES ('containers', 'Containers')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
UPDATE products SET category_id = 'containers' WHERE category_id = 'container-bodies';
DELETE FROM categories WHERE id = 'container-bodies';

-- 3. Add missing categories
INSERT INTO categories (id, name) VALUES ('load-body', 'Load Body')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO categories (id, name) VALUES ('waste-management', 'Waste Management Solutions')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. Add missing products (using ON CONFLICT to be idempotent)

-- Load Body products
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('ce089182-70d5-43ea-9d02-b8efa0b34774', 'Tata 720 Load Body', 'load-body',
   'Chassis: Tata 720 | Material: Mild Steel | Floor: 14G Sheet | Side Height: 18" | Loading Capacity: 3T',
   'Durable load body designed for Tata 720 chassis. Built with high-quality mild steel for reliable goods transport.',
   85000, 110000, 5, 'available', '📦', '["tata-720-load-body.jpeg"]'),
  ('0570ede5-31f7-43b5-9067-1ceaeb79312c', 'Eicher Load Body', 'load-body',
   'Chassis: Eicher Pro 1080 | Material: Mild Steel | Floor: 14G Sheet | Side Height: 21" | Loading Capacity: 5T',
   'Heavy-duty load body engineered for Eicher Pro series trucks. Perfect for commercial goods transportation.',
   95000, 130000, 4, 'available', '📦', '["eicher-load-body.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Waste Management products
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('dc4face9-da04-4961-8062-9e5ebb6bbb32', 'Garbage Tipper', 'waste-management',
   'Capacity: 3-7 Cum | Chassis: Various | Hydraulic Tipping | Material: Mild Steel / SS',
   'Hydraulic garbage tipper for municipal waste collection. Available in multiple capacities and chassis options.',
   200000, 450000, 3, 'available', '♻️', '["garbage-tipper.jpeg"]'),
  ('3a9ff284-ed09-401c-9477-643ace3f666f', 'Prefabricated Modular Toilet', 'waste-management',
   'Type: Modular Prefab | Material: GI Sheet / SS | Units: Single/Double | Portable Design',
   'Prefabricated modular toilet units for construction sites, events, and municipal deployment.',
   120000, 250000, 5, 'available', '♻️', '["prefab-modular-toilet.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Container products (update existing to new category_id if needed, add missing)
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('9d5b6562-321d-4a36-aa3b-bc57a79261a2', 'Container Body', 'containers',
   'Length: 20ft / 32ft | Material: Mild Steel | Floor: Chequered Plate | Lockable Doors',
   'Standard container body for commercial transport. Available in multiple sizes with secure locking mechanism.',
   180000, 350000, 4, 'available', '📦', '["container.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Custom / Automobile Body Building products (add missing)
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('9763fa7f-0971-445a-bc93-e184b56ea073', 'Custom Automobile Body Building', 'custom',
   'Type: Custom Design | Material: As per requirement | Chassis: Any | Full fabrication service',
   'Complete automobile body building service. We design and fabricate custom bodies for any vehicle type and application.',
   150000, 500000, 10, 'available', '🔧', '["automobile-bodybuilding-01.jpeg"]'),
  ('6014f00a-b4f2-4672-9b4e-96d757bfdecb', 'Special Purpose Vehicle Body', 'custom',
   'Type: Special Purpose | Material: MS/SS | Custom Engineering | Application-specific design',
   'Specialized vehicle body fabrication for unique applications including mobile workshops, utility vehicles, and more.',
   200000, 600000, 5, 'available', '🔧', '["automobile-bodybuilding-02.jpeg"]'),
  ('12ac3d63-defb-40d4-9fb2-9523245e4079', 'Food Van Body', 'custom',
   'Type: Food Van | Material: SS Interior / MS Exterior | Insulated | Custom Layout',
   'Food van body with stainless steel interior, insulation, and custom layout for mobile food service businesses.',
   250000, 450000, 3, 'available', '🔧', '["food-van.jpeg"]'),
  ('f5e3361f-9b02-46b6-bb73-9fabe8f1eed1', 'Concrete Mixer Body', 'custom',
   'Capacity: 6 Cum | Drum Type: Reversible | Hydraulic Drive | Chassis: Various',
   'Concrete mixer drum body with hydraulic drive system. Designed for ready-mix concrete transport.',
   350000, 550000, 2, 'available', '🔧', '["concrete-mixer.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Additional Tipper products (add missing ones from local)
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('162cc37d-ec7c-41d6-981b-0afef37a1dbf', '14 Cum Tipper Body', 'tippers',
   'Capacity: 14 Cum | Material: Sail Hardox | Hydraulic: Front-end tipping | Chassis: 12-Wheeler',
   'Heavy-duty 14 cubic meter tipper body built with Sail Hardox steel for mining and construction applications.',
   280000, 380000, 5, 'available', '🚛', '["tipper-14cum.jpeg"]'),
  ('1761ebf9-614b-48f4-b248-979f756004bd', '16 Cum Tipper Body', 'tippers',
   'Capacity: 16 Cum | Material: Hardox 450 | Hydraulic: Front-end tipping | Chassis: 12-Wheeler',
   'High-capacity 16 cubic meter tipper body with Hardox 450 steel. Designed for heavy mining operations.',
   320000, 420000, 4, 'available', '🚛', '["tipper-16cum-01.jpeg"]'),
  ('5517685a-52ab-4c0d-900e-ffffe215a64f', '16 Cum Tipper Body (Creative)', 'tippers',
   'Capacity: 16 Cum | Material: Hardox 450 | Design: Creative Series | Chassis: 12-Wheeler',
   'Creative series 16 cubic meter tipper body with enhanced design and Hardox 450 construction.',
   340000, 440000, 3, 'available', '🚛', '["tipper-16cum-02.jpeg"]'),
  ('33e481bd-334d-4f48-b47c-556d2965942e', '24 Cum Tipper Body', 'tippers',
   'Capacity: 24 Cum | Material: Hardox 500 | Hydraulic: Front-end tipping | Chassis: Multi-axle',
   'Extra-large 24 cubic meter tipper body for high-volume mining and earth-moving operations.',
   450000, 600000, 2, 'available', '🚛', '["tipper-24cum.jpeg"]'),
  ('658dea01-9a5c-4556-af62-3aa16b69bd8f', '20 Cum Tipper Body (BharatBenz 3118)', 'tippers',
   'Capacity: 20 Cum | Material: Sail Hardox | Chassis: BharatBenz 3118 | Hydraulic tipping',
   '20 cubic meter tipper body specifically designed for BharatBenz 3118 chassis.',
   350000, 480000, 3, 'available', '🚛', '["tipper-20cum-3118.jpeg"]'),
  ('ab6c9f93-7d1e-4825-9622-d4b00b3a7d7c', '20 Cum Tipper Body', 'tippers',
   'Capacity: 20 Cum | Material: Hardox 450 | Hydraulic: Front-end tipping | Chassis: 12-Wheeler',
   'Standard 20 cubic meter tipper body with Hardox 450 steel for construction and mining.',
   330000, 460000, 4, 'available', '🚛', '["tipper-20cum.jpeg"]'),
  ('d8693343-27fa-4733-8794-cb4eeac92938', '8.5 Cum Tipper SK1613', 'tippers',
   'Capacity: 8.5 Cum | Material: Mild Steel | Chassis: SK1613 | Hydraulic tipping',
   'Medium-capacity 8.5 cubic meter tipper body for SK1613 chassis. Ideal for urban construction.',
   180000, 250000, 6, 'available', '🚛', '["tipper-8.5cum-sk1613.jpeg"]'),
  ('75d28579-fc54-4111-a41b-d8d0781fb239', 'Tata Ace Tipper', 'tippers',
   'Capacity: 1 Cum | Material: Mild Steel | Chassis: Tata Ace | Mini hydraulic tipping',
   'Compact tipper body for Tata Ace mini trucks. Perfect for small-scale construction and waste transport.',
   65000, 95000, 8, 'available', '🚛', '["tata-ace-tipper.jpeg"]'),
  ('21f273f8-db94-4601-a225-8e1448f03b13', 'Tipper Components Set 1', 'tippers',
   'Type: Components Kit | Includes: Side panels, floor plates, hinges | Material: Mild Steel',
   'Complete tipper body components kit including side panels, floor plates, and hardware.',
   80000, 120000, 10, 'available', '🚛', '["tipper-components-01.jpeg"]'),
  ('f481b519-0ee1-4ee0-a254-508180a628a2', 'Tipper Components Set 2', 'tippers',
   'Type: Components Kit | Includes: Hydraulic arms, mounting brackets | Material: High-tensile steel',
   'Tipper hydraulic components kit with arms, mounting brackets, and cylinder assemblies.',
   90000, 140000, 8, 'available', '🚛', '["tipper-components-02.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Additional Tractor/Trolley products
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('c6a6dbd7-df55-4840-a3c5-c117cb2dbe40', 'Tracter Trolley Type 1', 'tractors',
   'Capacity: 3T | Material: Mild Steel | Tyres: Dual Axle | Hydraulic Tipping',
   'Standard tractor trolley with hydraulic tipping mechanism for agricultural and industrial use.',
   120000, 180000, 5, 'available', '🚜', '["tracter-trolley-01.jpeg"]'),
  ('e83b7920-1e98-4aa6-8d87-35810ea0f4e8', 'Tracter Trolley Type 2', 'tractors',
   'Capacity: 5T | Material: Mild Steel | Tyres: Dual Axle | Flatbed Design',
   'Heavy-duty flatbed tractor trolley for bulk material transport.',
   150000, 220000, 4, 'available', '🚜', '["tracter-trolley-02.jpeg"]'),
  ('04656d2e-2ed7-41c8-bc71-be11a2164504', 'Tracter Trolley Type 3', 'tractors',
   'Capacity: 7T | Material: High-tensile Steel | Tyres: Multi Axle | Heavy Duty',
   'Extra heavy-duty tractor trolley for large-scale agricultural and mining operations.',
   200000, 300000, 3, 'available', '🚜', '["tracter-trolley-03.jpeg"]'),
  ('b43f4d55-b56a-4a3f-b26f-3e6e167c67fe', 'Tractor Adjustable Hitch', 'tractors',
   'Type: Universal Adjustable | Material: Forged Steel | Fits: Most tractor models',
   'Universal adjustable tractor hitch for connecting various implements and trolleys.',
   25000, 45000, 15, 'available', '🚜', '["tractor-adjustable-hitch.jpeg"]')
ON CONFLICT (id) DO NOTHING;

-- Additional Trailer products
INSERT INTO products (id, name, category_id, specs, description, price_min, price_max, stock, status, icon, images)
VALUES
  ('7d48f1a3-4a52-4613-9650-0e39ee05e086', 'Tip Trailer 28 Cum', 'trailers',
   'Capacity: 28 Cum | Material: Hardox Steel | Hydraulic Tipping | Multi-axle',
   'Large capacity 28 cubic meter tip trailer with hydraulic tipping for bulk transport.',
   500000, 750000, 2, 'available', '🚚', '["tip-trailer-28cum.jpeg"]'),
  ('84697599-b096-4b38-a2e4-310a88d2a954', 'Trailer Side Wall 32 FT', 'trailers',
   'Length: 32ft | Material: Mild Steel | Side Walls: Detachable | Payload: 25T',
   '32-foot trailer with detachable side walls for versatile cargo transport.',
   400000, 600000, 3, 'available', '🚚', '["trailer-sidewall-32ft.jpeg"]')
ON CONFLICT (id) DO NOTHING;

COMMIT;
