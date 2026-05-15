-- Migration 003: Add Container Bodies category, rename Tractors to Tractor Trolley
-- Run against a live database that was initialized with the previous init.sql

-- Rename tractors category
UPDATE categories SET name = 'Tractor Trolley' WHERE id = 'tractors';

-- Add container-bodies category
INSERT INTO categories (id, name, description, icon, sort_order)
VALUES ('container-bodies', 'Container Bodies', 'Container body fabrication & fittings', '📦', 6)
ON CONFLICT (id) DO NOTHING;

-- Move Skeletal Container Trailer from trailers to container-bodies
UPDATE products SET category_id = 'container-bodies', icon = '📦' WHERE name = 'Skeletal Container Trailer';

-- Move Custom Truck Body from custom to container-bodies
UPDATE products SET category_id = 'container-bodies', icon = '📦' WHERE name = 'Custom Truck Body';
