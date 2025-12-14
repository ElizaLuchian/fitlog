-- FitLog Database Schema for PostgreSQL

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS outfit_items CASCADE;
DROP TABLE IF EXISTS outfits CASCADE;
DROP TABLE IF EXISTS clothing_items CASCADE;

-- Clothing Items Table
CREATE TABLE clothing_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(100),
    brand VARCHAR(100),
    size VARCHAR(20),
    material VARCHAR(100),
    notes TEXT,
    photo TEXT,  -- Base64 encoded image or URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outfits Table
CREATE TABLE outfits (
    outfit_id SERIAL PRIMARY KEY,
    occasion VARCHAR(255),
    aesthetic_style_type VARCHAR(100),
    notes TEXT,
    date_worn DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outfit Items Junction Table (Many-to-Many relationship)
CREATE TABLE outfit_items (
    outfit_id INTEGER NOT NULL REFERENCES outfits(outfit_id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    PRIMARY KEY (outfit_id, item_id)
);

-- Indexes for performance
CREATE INDEX idx_items_category ON clothing_items(category);
CREATE INDEX idx_items_created ON clothing_items(created_at DESC);
CREATE INDEX idx_outfits_date ON outfits(date_worn DESC);
CREATE INDEX idx_outfits_created ON outfits(created_at DESC);
CREATE INDEX idx_outfit_items_outfit ON outfit_items(outfit_id);
CREATE INDEX idx_outfit_items_item ON outfit_items(item_id);

-- Optional: Add constraints
ALTER TABLE clothing_items 
  ADD CONSTRAINT check_category 
  CHECK (category IN ('TOP', 'BOTTOM', 'DRESS', 'OUTERWEAR', 'SHOES', 'ACCESSORY'));

-- Optional: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clothing_items_updated_at BEFORE UPDATE
    ON clothing_items FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE
    ON outfits FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
INSERT INTO clothing_items (name, category, color, brand, size, material, notes) VALUES
  ('Blue Jeans', 'BOTTOM', 'Blue', 'Levi''s', 'M', 'Denim', 'Classic fit'),
  ('White T-Shirt', 'TOP', 'White', 'H&M', 'L', 'Cotton', 'Basic tee'),
  ('Black Jacket', 'OUTERWEAR', 'Black', 'Nike', 'M', 'Polyester', 'Windbreaker');

INSERT INTO outfits (occasion, aesthetic_style_type, notes, date_worn) VALUES
  ('Casual', 'Streetwear', 'Weekend outfit', '2025-12-14');

INSERT INTO outfit_items (outfit_id, item_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3);

