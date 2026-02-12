ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity int;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS track_stock boolean DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_alert int DEFAULT 5;
