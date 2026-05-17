-- Migration 004: Update category names and add new categories
-- Run after migrate-003-container-bodies.sql

-- Rename existing categories
UPDATE categories SET name = 'Tracter Trolleys', description = 'Custom tracter trolley body fabrication' WHERE id = 'tractors';
UPDATE categories SET name = 'Water Tanker', description = 'Industrial and commercial water tankers' WHERE id = 'water-tanks';
UPDATE categories SET name = 'All kinds of Automobile Body Building work', description = 'Any automobile body customization on demand' WHERE id = 'custom';

-- Rename container-bodies to containers
INSERT INTO categories (id, name, description, icon, sort_order)
VALUES ('containers', 'Containers', 'Container fabrication & fittings', '📦', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

UPDATE products SET category_id = 'containers' WHERE category_id = 'container-bodies';
DELETE FROM categories WHERE id = 'container-bodies';

-- Add new categories
INSERT INTO categories (id, name, description, icon, sort_order) VALUES
('load-body',        'Load Body',                    'Load bodies for goods transport trucks',                     '📐', 5),
('waste-management', 'Waste Management Solutions',    'Garbage compactors, hook loaders & waste equipment',         '♻️', 7)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Update sort order
UPDATE categories SET sort_order = 1 WHERE id = 'tippers';
UPDATE categories SET sort_order = 2 WHERE id = 'trailers';
UPDATE categories SET sort_order = 3 WHERE id = 'tractors';
UPDATE categories SET sort_order = 4 WHERE id = 'water-tanks';
UPDATE categories SET sort_order = 5 WHERE id = 'load-body';
UPDATE categories SET sort_order = 6 WHERE id = 'containers';
UPDATE categories SET sort_order = 7 WHERE id = 'waste-management';
UPDATE categories SET sort_order = 8 WHERE id = 'custom';

-- Add seed products for new categories
INSERT INTO products (name, category_id, specs, description, price_min, price_max, stock, status, icon, images, created_by)
VALUES
('Truck Load Body', 'load-body',
    'Capacity: 12 tons | MS construction | Side-open / Top-open options',
    'Heavy-duty load body for goods transport trucks. Available in side-open and top-open configurations.',
    180000, 260000, 4, 'available', '📐', '[]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('High-Deck Load Body', 'load-body',
    'Extended sidewalls | Tarpaulin frame | Multi-purpose',
    'High-deck load body with extended sidewalls for bulk cargo. Includes tarpaulin frame for weather protection.',
    220000, 310000, 2, 'available', '📐', '[]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Garbage Compactor Body', 'waste-management',
    'Capacity: 12 cubic meters | Hydraulic compaction | Rear loader',
    'Hydraulic garbage compactor body for municipal waste collection. Rear-loading design with high compaction ratio.',
    650000, 900000, 0, 'order', '♻️', '[]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),

('Hook Loader Waste Container', 'waste-management',
    'Capacity: 15 cubic meters | Hook-lift compatible | Heavy gauge steel',
    'Industrial waste container compatible with hook-loader trucks. Built with heavy gauge steel for demanding waste management operations.',
    280000, 380000, 3, 'available', '♻️', '[]', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
