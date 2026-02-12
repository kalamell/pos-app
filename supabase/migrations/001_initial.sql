-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text,
  full_name text,
  role text DEFAULT 'owner',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shops
CREATE TABLE shops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  shop_type text DEFAULT 'restaurant',
  logo_url text,
  address text,
  phone text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage shops" ON shops FOR ALL USING (auth.uid() = owner_id);

-- Branches
CREATE TABLE branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  table_count int DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop owner can manage branches" ON branches FOR ALL USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = branches.shop_id AND shops.owner_id = auth.uid())
);

-- Categories
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop owner can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = categories.shop_id AND shops.owner_id = auth.uid())
);
CREATE POLICY "Public can read active categories" ON categories FOR SELECT USING (is_active = true);

-- Menu Items
CREATE TABLE menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES shops ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  is_available boolean DEFAULT true,
  sort_order int DEFAULT 0,
  options jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop owner can manage items" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM shops WHERE shops.id = menu_items.shop_id AND shops.owner_id = auth.uid())
);
CREATE POLICY "Public can read available items" ON menu_items FOR SELECT USING (is_available = true);

-- Tables
CREATE TABLE tables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid REFERENCES branches ON DELETE CASCADE NOT NULL,
  table_number text NOT NULL,
  seats int DEFAULT 4,
  status text DEFAULT 'available',
  current_order_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch owner can manage tables" ON tables FOR ALL USING (
  EXISTS (SELECT 1 FROM branches b JOIN shops s ON s.id = b.shop_id WHERE b.id = tables.branch_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Public can read tables" ON tables FOR SELECT USING (true);

-- Orders
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid REFERENCES branches NOT NULL,
  table_id uuid REFERENCES tables,
  order_number serial,
  order_type text DEFAULT 'dine_in',
  status text DEFAULT 'pending',
  subtotal decimal(10,2) DEFAULT 0,
  discount decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  payment_method text,
  paid_at timestamptz,
  note text,
  customer_name text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff can manage orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM branches b JOIN shops s ON s.id = b.shop_id WHERE b.id = orders.branch_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read own orders" ON orders FOR SELECT USING (true);

-- Order Items
CREATE TABLE order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders ON DELETE CASCADE NOT NULL,
  menu_item_id uuid REFERENCES menu_items NOT NULL,
  item_name text NOT NULL,
  quantity int DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  options jsonb DEFAULT '{}',
  note text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order owner can manage items" ON order_items FOR ALL USING (true);

-- Plans
CREATE TABLE user_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users UNIQUE NOT NULL,
  plan text DEFAULT 'free',
  max_shops int DEFAULT 1,
  max_branches int DEFAULT 1,
  max_menu_items int DEFAULT 30,
  features jsonb DEFAULT '{}',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can read own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own plan" ON user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + plan on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name) VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO user_plans (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Contact inquiries
CREATE TABLE contact_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert inquiries" ON contact_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read inquiries" ON contact_inquiries FOR SELECT USING (auth.jwt() ->> 'email' IN ('sankhumpha84@gmail.com'));
CREATE POLICY "Admin can update inquiries" ON contact_inquiries FOR UPDATE USING (auth.jwt() ->> 'email' IN ('sankhumpha84@gmail.com'));
