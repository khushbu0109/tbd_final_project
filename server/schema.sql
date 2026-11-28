-- =============================================================================
-- TBD WELLNESS E-COMMERCE PLATFORM — COMPLETE MYSQL SCHEMA & SEED DATA
-- Target: Hostinger MySQL 8.0+ / MariaDB 10.6+ (InnoDB, utf8mb4)
-- Database: u375814358_tbd_ai_studio
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. ADMIN ROLES & USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_key VARCHAR(40) NOT NULL UNIQUE,
  role_name VARCHAR(80) NOT NULL,
  permissions_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_users_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. CATEGORIES, PRODUCTS & PRODUCT VARIANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(80) PRIMARY KEY,
  sku VARCHAR(60) NOT NULL UNIQUE,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  subtitle VARCHAR(200) NOT NULL DEFAULT '',
  slug VARCHAR(180) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  full_description LONGTEXT NOT NULL,
  regular_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subscription_price DECIMAL(10,2) NULL DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 20,
  status ENUM('Published', 'Draft') NOT NULL DEFAULT 'Published',
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.90,
  review_count INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NOT NULL,
  gallery_json JSON NULL,
  pack_size VARCHAR(120) NOT NULL DEFAULT '1 x 10 Coated Tablets',
  dosage_note VARCHAR(120) NOT NULL DEFAULT '',
  key_actives_json JSON NULL,
  biomarkers_json JSON NULL,
  clinical_certified TINYINT(1) NOT NULL DEFAULT 1,
  featured_tag VARCHAR(80) NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_status (status),
  INDEX idx_products_category (category_id),
  INDEX idx_products_price (sale_price),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(80) NOT NULL,
  variant_sku VARCHAR(80) NOT NULL UNIQUE,
  variant_label VARCHAR(120) NOT NULL,
  cadence_days INT NULL DEFAULT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2) NULL DEFAULT NULL,
  stock INT NOT NULL DEFAULT 50,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. CUSTOMER GROUPS & CUSTOMERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_groups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(80) NOT NULL UNIQUE,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id INT UNSIGNED NULL,
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  city VARCHAR(100) NOT NULL DEFAULT '',
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  total_orders INT NOT NULL DEFAULT 0,
  lifetime_spend DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_subscriber TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_city (city),
  CONSTRAINT fk_customers_group FOREIGN KEY (group_id) REFERENCES customer_groups(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. COUPONS & PROMOTIONAL CAMPAIGNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_uses INT NULL DEFAULT NULL,
  times_used INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  channel VARCHAR(60) NOT NULL DEFAULT 'Storefront',
  coupon_id INT UNSIGNED NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  attributed_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('Active', 'Scheduled', 'Paused', 'Completed') NOT NULL DEFAULT 'Active',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_campaigns_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. ORDERS & ORDER ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(40) PRIMARY KEY,
  customer_id INT UNSIGNED NULL,
  customer_name VARCHAR(140) NOT NULL,
  customer_email VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NULL,
  customer_city VARCHAR(100) NOT NULL,
  billing_address TEXT NULL,
  shipping_address TEXT NULL,
  order_notes TEXT NULL,
  coupon_code VARCHAR(40) NULL,
  original_subtotal DECIMAL(10,2) NULL,
  product_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  other_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Razorpay',
  payment_status ENUM('Paid', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  fulfillment_status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  razorpay_order_id VARCHAR(120) NULL UNIQUE,
  razorpay_payment_id VARCHAR(120) NULL UNIQUE,
  razorpay_signature VARCHAR(255) NULL,
  order_date_label VARCHAR(60) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (fulfillment_status),
  INDEX idx_orders_payment (payment_status),
  INDEX idx_orders_created (created_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(80) NULL,
  sku VARCHAR(64) NULL,
  product_name VARCHAR(180) NOT NULL,
  product_image VARCHAR(255) NULL,
  quantity INT NOT NULL DEFAULT 1,
  original_unit_price DECIMAL(10,2) NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  is_subscription TINYINT(1) NOT NULL DEFAULT 0,
  cadence_days INT NULL DEFAULT NULL,
  INDEX idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. FINANCE: PAYMENTS, TRANSACTIONS, INVOICES & REFUNDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  provider VARCHAR(60) NOT NULL DEFAULT 'Razorpay',
  provider_reference VARCHAR(120) NULL,
  razorpay_order_id VARCHAR(120) NULL,
  razorpay_payment_id VARCHAR(120) NULL,
  method VARCHAR(40) NOT NULL DEFAULT 'Razorpay',
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('Paid', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
  paid_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_payments_order (order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id INT UNSIGNED NULL,
  order_id VARCHAR(40) NOT NULL,
  txn_type ENUM('Capture', 'Refund', 'Settlement', 'Fee') NOT NULL DEFAULT 'Capture',
  gateway_txn_id VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  order_id VARCHAR(40) NOT NULL UNIQUE,
  taxable_value DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refunds (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  payment_id INT UNSIGNED NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('Requested', 'Approved', 'Processed', 'Rejected') NOT NULL DEFAULT 'Processed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. DELIVERY: SHIPPING METHODS, COURIERS & SHIPMENT TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_methods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  free_above DECIMAL(10,2) NULL DEFAULT 1000.00,
  estimated_days VARCHAR(60) NOT NULL DEFAULT '2-4 Business Days',
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS couriers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  tracking_url_template VARCHAR(255) NOT NULL,
  cold_chain_supported TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shipment_tracking (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  courier_id INT UNSIGNED NULL,
  shipping_method_id INT UNSIGNED NULL,
  awb_number VARCHAR(100) NOT NULL,
  current_status ENUM('Label Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Exception') NOT NULL DEFAULT 'Label Created',
  last_location VARCHAR(140) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shipment_order (order_id),
  CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_shipment_courier FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL,
  CONSTRAINT fk_shipment_method FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. CMS: BANNERS, SECTIONS, WEBSITE CONTENT, ABOUT, HOW IT WORKS, INGREDIENTS,
--         TESTIMONIALS, REVIEWS & JOURNAL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homepage_banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  cta_label VARCHAR(80) NOT NULL DEFAULT 'Shop COREAA Now',
  cta_target VARCHAR(160) NOT NULL DEFAULT '#shop-protocol',
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS homepage_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  section_key VARCHAR(80) NOT NULL UNIQUE,
  heading VARCHAR(200) NOT NULL,
  subheading TEXT NULL,
  body_json JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_content (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  content_value LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about_us_content (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  block_key VARCHAR(80) NOT NULL UNIQUE,
  heading VARCHAR(180) NOT NULL,
  body LONGTEXT NOT NULL,
  metric_value VARCHAR(60) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS how_it_works_steps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  step_number INT NOT NULL,
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  outcome_label VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingredients (
  id VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  dosage VARCHAR(80) NOT NULL,
  category ENUM('Amino Acids', 'Botanicals', 'Antioxidants', 'Micros & Bio-Enhancer') NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  benefit_1 VARCHAR(200) NOT NULL,
  benefit_2 VARCHAR(200) NOT NULL,
  clinical_note TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(120) NOT NULL,
  author_role VARCHAR(120) NOT NULL,
  quote TEXT NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews_ratings (
  id VARCHAR(60) PRIMARY KEY,
  product_id VARCHAR(80) NULL,
  product_name VARCHAR(180) NOT NULL,
  author VARCHAR(120) NOT NULL,
  initials VARCHAR(8) NOT NULL,
  location VARCHAR(120) NOT NULL DEFAULT 'India',
  role VARCHAR(120) NOT NULL DEFAULT 'Verified Patient',
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  quote TEXT NOT NULL,
  batch_code VARCHAR(60) NOT NULL DEFAULT 'LOT-2025-VER',
  review_date_label VARCHAR(60) NOT NULL DEFAULT 'May 2025',
  verified TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_rating (rating),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_articles (
  id VARCHAR(80) PRIMARY KEY,
  digest_number VARCHAR(60) NOT NULL,
  title VARCHAR(240) NOT NULL,
  category ENUM('Nutrition', 'Fitness & Lifestyle', 'Ingredients', 'Wellness', 'Healthy Habits') NOT NULL,
  read_time VARCHAR(40) NOT NULL,
  author VARCHAR(120) NOT NULL,
  author_role VARCHAR(120) NOT NULL,
  published_label VARCHAR(60) NOT NULL,
  study_ref VARCHAR(100) NULL,
  image_url VARCHAR(500) NOT NULL,
  excerpt TEXT NOT NULL,
  body_json JSON NOT NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  source VARCHAR(60) NOT NULL DEFAULT 'Footer Bulletin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA (IDEMPOTENT INSERT IGNORE)
-- =============================================================================

INSERT IGNORE INTO admin_roles (id, role_key, role_name, permissions_json) VALUES
(1, 'super_admin', 'Executive Super Admin', JSON_ARRAY('products:*', 'orders:*', 'customers:*', 'marketing:*', 'cms:*', 'finance:*', 'delivery:*', 'analytics:*', 'system:*')),
(2, 'operations_manager', 'Fulfillment & Operations Manager', JSON_ARRAY('orders:read', 'orders:write', 'delivery:*', 'products:read'));

-- Default demo admin: admin@tbdwellness.com / ClinicalVitality#2025 (bcrypt hash verified on login)
INSERT IGNORE INTO admin_users (id, role_id, full_name, email, password_hash, is_active) VALUES
(1, 1, 'Dr. Rhea Sen (Executive Admin)', 'admin@tbdwellness.com', '$2b$10$fH7uC6n2G4kS1d4h2K3qxe9R8mM8qZ9fJ0gV3yQ6rN2kL5xS7tU9W', 1);

INSERT IGNORE INTO categories (id, name, slug, description, sort_order) VALUES
(1, 'Daily Vitality', 'daily-vitality', 'All-in-one foundational daily nutraceuticals and biometric wellness systems.', 1),
(2, 'Energy & Stamina', 'energy-stamina', 'Bio-fermented stamina and endurance formulations.', 2),
(3, 'Cellular Health', 'cellular-health', 'Longevity co-factors and mitochondrial NAD+ support.', 3),
(4, 'Adaptogens', 'adaptogens', 'Standardized root extracts for cortisol equilibrium and stress resilience.', 4),
(5, 'Multivitamins', 'multivitamins', 'Lipid-suspended methylated vitamins and chelated trace minerals.', 5);

INSERT IGNORE INTO products (
  id, sku, category_id, name, subtitle, slug, short_description, full_description,
  regular_price, sale_price, cost_price, subscription_price, stock, low_stock_threshold,
  status, rating, review_count, image_url, gallery_json, pack_size, dosage_note,
  key_actives_json, biomarkers_json, clinical_certified, featured_tag
) VALUES
(
  'coreaa-daily-vitality', 'TBD-CR-001', 1,
  'COREAA™ Daily Vitality', 'Advance Balanced Wellness Formula', 'coreaa-daily-vitality',
  'Comprehensive multivitamin, adaptogen, and amino acid strip featuring L-Arginine, Panax Ginseng, Ashwagandha, and marine Astaxanthin.',
  'COREAA™ Daily Vitality is engineered as an all-in-one daily nutraceutical protocol for active adults, professionals, and athletes seeking steady cellular energy without stimulant crashes. Each Alu-Alu blister strip seals 10 reddish-brown film-coated tablets containing 11 synergistic compounds—combining nitric-oxide amino precursors, adaptogenic roots, lipid-soluble antioxidants, and 95% Piperine for measurable bio-absorption.',
  599.00, 499.00, 185.00, 499.00, 142, 25, 'Published', 4.90, 3420,
  '/images/coreaa-box-1.png',
  JSON_ARRAY('/images/coreaa-box-1.png', '/images/coreaa-box-back.png', '/images/coreaa-box-2.png'),
  '1 × 10 Coated Tablets', '₹49.90 / dose',
  JSON_ARRAY('L-Arginine 100mg', 'Panax Ginseng 100mg', 'Ashwagandha 200mg', 'Astaxanthin 8mg'),
  JSON_ARRAY('Nitric Oxide', 'Cortisol Control', 'Cellular NAD+'),
  1, 'Flagship Bestseller'
),
(
  'mens-favor-stamina', 'TBD-MF-013', 2,
  'Men''s Favor Daily Stamina Complex', 'Bio-Fermented Endocrine & Cellular Fuel', 'mens-favor-daily-stamina',
  'Advanced bio-fermentation daily complex formulated for physical stamina, endocrine equilibrium, and sustained mitochondrial output.',
  'Formulated under cGMP protocols, Men''s Favor combines standardized Peruvian Maca root extract, chelated Zinc Picolinate, and targeted botanical precursors to support free vitality markers, endurance training recovery, and restorative stress response.',
  2499.00, 1499.00, 520.00, 1274.00, 86, 25, 'Published', 4.80, 890,
  '/images/ing-panax-ginseng.png',
  JSON_ARRAY('/images/ing-panax-ginseng.png', '/images/ing-ashwagandha.png'),
  '60 Vegetarian Capsules', '₹49.96 / serving',
  JSON_ARRAY('Maca Root Extract', 'Zinc Picolinate', 'Standardized Ginseng', 'Piperine 95%'),
  JSON_ARRAY('Free Testosterone', 'Nitric Oxide'),
  1, 'Bio-Fermented'
),
(
  'cellular-nad-resveratrol', 'TBD-NAD-008', 3,
  'TBD Cellular NAD+ & Resveratrol', 'Micronized Longevity Co-Factor', 'cellular-nad-resveratrol',
  '99.8% pure micronized Trans-Resveratrol and bioavailable cellular NAD+ precursors engineered to activate SIRT1 longevity pathways.',
  'Designed for longevity-focused protocols, TBD Cellular NAD+ & Resveratrol pairs pharmaceutical-grade nicotinamide precursors with 250mg micronized Trans-Resveratrol and BioPerine to sustain intracellular ATP synthesis and DNA repair resilience.',
  3499.00, 2999.00, 1120.00, 2549.00, 64, 20, 'Published', 4.90, 1150,
  '/images/ing-astaxanthin.png',
  JSON_ARRAY('/images/ing-astaxanthin.png', '/images/ing-l-arginine.png'),
  '60 Delayed-Release Capsules', '₹99.96 / serving',
  JSON_ARRAY('99.8% Pure NMN', 'Trans-Resveratrol 250mg', 'Piperine Enhancer'),
  JSON_ARRAY('Cellular NAD+', 'Cortisol Control'),
  1, 'Mitochondrial'
),
(
  'smart-vitality-tracker', 'TBD-HW-003', 1,
  'TBD Health & Vitality Smart Tracker', 'Continuous HRV & Sleep Architecture Hardware', 'tbd-smart-vitality-tracker',
  'Grade-5 brushed titanium biometric sensor with 7-day battery runtime, continuous HRV spectrum tracking, and 50m waterproofing.',
  'Close the feedback loop on your supplementation regimen. The TBD Health & Vitality Smart Tracker measures resting heart rate variability, deep-stage sleep recovery, and circadian readiness with dual-wavelength optical plethysmography.',
  6499.00, 4999.00, 2350.00, NULL, 18, 25, 'Published', 4.70, 420,
  '/images/hero-studio-bg.png',
  JSON_ARRAY('/images/hero-studio-bg.png'),
  'Titanium Sensor + Dock', '7-day battery',
  JSON_ARRAY('HRV Spectrum', 'Sleep Architecture', '50m Waterproof', 'USB-C Magnetic Dock'),
  JSON_ARRAY('Cortisol Control', 'Cellular NAD+'),
  1, 'Bio-Device'
),
(
  'ashwagandha-ksm66', 'TBD-AS-009', 4,
  'TBD Ashwagandha Root Extract', '500mg KSM-66 Standardized Adaptogen', 'tbd-ashwagandha-root-extract',
  'Full-spectrum root-only Withania Somnifera extract standardized to 5% withanolides for calm daytime clarity and stress resilience.',
  'Extracted using a clean green-chemistry aqueous process without chemical solvents, our KSM-66 Ashwagandha supports balanced diurnal cortisol curves, physical strength output, and restful evening recovery.',
  1299.00, 999.00, 310.00, 849.00, 210, 30, 'Published', 4.90, 640,
  '/images/ing-ashwagandha.png',
  JSON_ARRAY('/images/ing-ashwagandha.png', '/images/ing-l-theanine.png'),
  '60 Vegan Capsules', '₹16.65 / capsule',
  JSON_ARRAY('500mg KSM-66 Root', '5% Withanolides', 'Solvent-Free Extraction'),
  JSON_ARRAY('Cortisol Control'),
  1, NULL
),
(
  'multivitamin-softgels', 'TBD-MV-004', 5,
  'TBD Multivitamin Softgels', 'Cold-Pressed Omega + Bioactive B-Complex & D3', 'tbd-multivitamin-softgels',
  'Lipid-suspended methylated vitamins D3, K2 (MK-7), active B-complex, and chelated trace minerals for complete daily coverage.',
  'Formulated in cold-pressed softgels to preserve fat-soluble stability, TBD Multivitamin bridges foundational dietary gaps with methylated folate, B12, Vitamin D3 + K2, and highly bioavailable Selenium and Zinc.',
  2199.00, 1799.00, 680.00, 1529.00, 14, 25, 'Published', 4.80, 515,
  '/images/ing-multivitamins.png',
  JSON_ARRAY('/images/ing-multivitamins.png', '/images/ing-multiminerals.png'),
  '60 Lipid Softgels', '₹29.98 / softgel',
  JSON_ARRAY('Vitamin D3 + K2', 'Methylated B-Complex', 'Chelated Zinc & Selenium'),
  JSON_ARRAY('Cellular NAD+', 'Nitric Oxide'),
  1, NULL
);

INSERT IGNORE INTO product_variants (product_id, variant_sku, variant_label, cadence_days, unit_price, compare_at_price, stock, is_default) VALUES
('coreaa-daily-vitality', 'TBD-CR-001-SUB30', 'Subscribe 30 Days (1 × 10 Strip)', 30, 499.00, 599.00, 142, 1),
('coreaa-daily-vitality', 'TBD-CR-001-SUB60', 'Subscribe 60 Days (1 × 10 Strip)', 60, 499.00, 599.00, 142, 0),
('coreaa-daily-vitality', 'TBD-CR-001-ONCE', 'One-Time Purchase (1 × 10 Strip)', NULL, 599.00, 599.00, 142, 0);

INSERT IGNORE INTO customer_groups (id, group_name, discount_percent, description) VALUES
(1, 'Auto-Replenish Subscribers', 15.00, 'Active monthly protocol subscribers'),
(2, 'Clinical Practitioners', 20.00, 'Verified doctors and nutritionists'),
(3, 'Direct Storefront Retail', 0.00, 'Standard retail patients');

INSERT IGNORE INTO customers (id, group_id, full_name, email, phone, city, state, total_orders, lifetime_spend, is_subscriber) VALUES
(1, 1, 'Aarav Mehta', 'aarav.mehta@biohack.in', '+91 98201 11204', 'Mumbai', 'Maharashtra', 4, 14200.00, 1),
(2, 1, 'Priya Nair', 'priya.nair@wellnessstudio.co', '+91 98450 22319', 'Bengaluru', 'Karnataka', 3, 12850.00, 1),
(3, 3, 'Rohan Kulkarni', 'rohan.k@gmail.com', '+91 98220 44108', 'Pune', 'Maharashtra', 1, 1850.00, 0),
(4, 1, 'Ananya Sharma', 'ananya.sharma@outlook.com', '+91 98110 77821', 'New Delhi', 'Delhi', 2, 6998.00, 1),
(5, 3, 'Vikramaditya Rao', 'v.rao@medtech.org', '+91 98490 55612', 'Hyderabad', 'Telangana', 1, 6100.00, 0),
(6, 2, 'Siddharth Kapoor', 'sid.kapoor@proton.me', '+91 98400 88904', 'Chennai', 'Tamil Nadu', 2, 4996.00, 1);

INSERT IGNORE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, times_used, is_active) VALUES
(1, 'DRTBD', 'percent', 10.00, 499.00, 1000, 48, 1),
(2, 'VITALITY10', 'percent', 10.00, 499.00, 2000, 112, 1),
(3, 'COREAA100', 'fixed', 100.00, 999.00, 500, 27, 1);

INSERT IGNORE INTO promotional_campaigns (id, name, channel, coupon_id, budget, attributed_revenue, status) VALUES
(1, 'COREAA Flagship Launch', 'Direct Storefront', 2, 120000.00, 842000.00, 'Active'),
(2, 'Practitioner Referral Program', 'Clinical Network', 1, 45000.00, 318000.00, 'Active');

INSERT IGNORE INTO shipping_methods (id, name, code, rate, free_above, estimated_days, is_active) VALUES
(1, 'Cold-Chain Priority Express', 'COLD_EXPRESS', 99.00, 1000.00, '2-4 Business Days', 1),
(2, 'Same-Day Metro Dispatch', 'METRO_SAME_DAY', 199.00, 3500.00, 'Within 12 Hours', 1);

INSERT IGNORE INTO couriers (id, name, tracking_url_template, cold_chain_supported, is_active) VALUES
(1, 'BlueDart Clinical Express', 'https://bluedart.com/track/{awb}', 1, 1),
(2, 'Delhivery Surface & Air', 'https://delhivery.com/track/{awb}', 1, 1);

INSERT IGNORE INTO orders (
  id, customer_id, customer_name, customer_email, customer_city,
  subtotal, discount_amount, shipping_amount, total_amount,
  payment_method, payment_status, fulfillment_status, order_date_label
) VALUES
('#TBD-10492', 1, 'Aarav Mehta', 'aarav.mehta@biohack.in', 'Mumbai', 4890.00, 0.00, 0.00, 4890.00, 'UPI', 'Paid', 'Delivered', '14 May 2025, 10:42 AM'),
('#TBD-10491', 2, 'Priya Nair', 'priya.nair@wellnessstudio.co', 'Bengaluru', 7250.00, 0.00, 0.00, 7250.00, 'Razorpay Card', 'Paid', 'Processing', '14 May 2025, 09:15 AM'),
('#TBD-10490', 3, 'Rohan Kulkarni', 'rohan.k@gmail.com', 'Pune', 1850.00, 0.00, 0.00, 1850.00, 'COD', 'Pending', 'Pending', '13 May 2025, 06:50 PM'),
('#TBD-10489', 4, 'Ananya Sharma', 'ananya.sharma@outlook.com', 'New Delhi', 3499.00, 0.00, 0.00, 3499.00, 'UPI', 'Paid', 'Shipped', '13 May 2025, 02:20 PM'),
('#TBD-10488', 5, 'Vikramaditya Rao', 'v.rao@medtech.org', 'Hyderabad', 6100.00, 0.00, 0.00, 6100.00, 'Razorpay Card', 'Refunded', 'Cancelled', '12 May 2025, 04:05 PM'),
('#TBD-10487', 6, 'Siddharth Kapoor', 'sid.kapoor@proton.me', 'Chennai', 2498.00, 0.00, 0.00, 2498.00, 'NetBanking', 'Paid', 'Delivered', '12 May 2025, 11:30 AM');

INSERT IGNORE INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, line_total) VALUES
(1, '#TBD-10492', 'cellular-nad-resveratrol', 'TBD Cellular NAD+ & Resveratrol', 1, 2999.00, 2999.00),
(2, '#TBD-10492', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality (3-Pack)', 1, 1891.00, 1891.00),
(3, '#TBD-10491', 'smart-vitality-tracker', 'TBD Health & Vitality Smart Tracker', 1, 4999.00, 4999.00),
(4, '#TBD-10491', 'multivitamin-softgels', 'TBD Multivitamin Softgels', 1, 1799.00, 1799.00),
(5, '#TBD-10491', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 1, 452.00, 452.00),
(6, '#TBD-10490', 'mens-favor-stamina', 'Men''s Favor Daily Stamina Complex', 1, 1499.00, 1499.00),
(7, '#TBD-10490', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 1, 351.00, 351.00),
(8, '#TBD-10489', 'cellular-nad-resveratrol', 'TBD Cellular NAD+ & Resveratrol', 1, 2999.00, 2999.00),
(9, '#TBD-10489', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 1, 500.00, 500.00),
(10, '#TBD-10488', 'smart-vitality-tracker', 'TBD Health & Vitality Smart Tracker', 1, 6100.00, 6100.00),
(11, '#TBD-10487', 'mens-favor-stamina', 'Men''s Favor Daily Stamina Complex', 1, 1499.00, 1499.00),
(12, '#TBD-10487', 'ashwagandha-ksm66', 'TBD Ashwagandha Root Extract', 1, 999.00, 999.00);

INSERT IGNORE INTO payments (id, order_id, provider, provider_reference, method, amount, status) VALUES
(1, '#TBD-10492', 'Razorpay', 'pay_TBD10492UPI', 'UPI', 4890.00, 'Paid'),
(2, '#TBD-10491', 'Razorpay', 'pay_TBD10491CRD', 'Razorpay Card', 7250.00, 'Paid'),
(3, '#TBD-10490', 'COD', 'cod_TBD10490', 'COD', 1850.00, 'Pending'),
(4, '#TBD-10489', 'Razorpay', 'pay_TBD10489UPI', 'UPI', 3499.00, 'Paid'),
(5, '#TBD-10488', 'Razorpay', 'pay_TBD10488RFD', 'Razorpay Card', 6100.00, 'Refunded'),
(6, '#TBD-10487', 'Razorpay', 'pay_TBD10487NBK', 'NetBanking', 2498.00, 'Paid');

INSERT IGNORE INTO invoices (id, invoice_number, order_id, taxable_value, gst_amount, grand_total) VALUES
(1, 'INV-2025-10492', '#TBD-10492', 4144.07, 745.93, 4890.00),
(2, 'INV-2025-10491', '#TBD-10491', 6144.07, 1105.93, 7250.00),
(3, 'INV-2025-10489', '#TBD-10489', 2965.25, 533.75, 3499.00),
(4, 'INV-2025-10487', '#TBD-10487', 2116.95, 381.05, 2498.00);

INSERT IGNORE INTO shipment_tracking (id, order_id, courier_id, shipping_method_id, awb_number, current_status, last_location) VALUES
(1, '#TBD-10492', 1, 1, 'BD77849102IN', 'Delivered', 'Mumbai Hub, MH'),
(2, '#TBD-10491', 1, 1, 'BD77849155IN', 'Label Created', 'Haridwar Dispatch Facility, UK'),
(3, '#TBD-10489', 2, 1, 'DLV9928172IN', 'In Transit', 'Gurugram Air Hub, HR');

INSERT IGNORE INTO ingredients (id, name, dosage, category, image_url, benefit_1, benefit_2, clinical_note, sort_order) VALUES
('l-arginine', 'L-Arginine', '100 mg', 'Amino Acids', '/images/ing-l-arginine.png', 'Supports vascular blood circulation', 'Aids physical energy & stamina', 'Direct substrate for endothelial nitric oxide synthase (eNOS).', 1),
('l-citrulline', 'L-Citrulline', '100 mg', 'Amino Acids', '/images/ing-l-citrulline.png', 'Sustains nitric oxide (NO) synthesis', 'Supports blood flow & endurance output', 'Bypasses hepatic first-pass metabolism for steady plasma arginine elevation.', 2),
('l-theanine', 'L-Theanine', '100 mg', 'Amino Acids', '/images/ing-l-theanine.png', 'Promotes alpha-wave mental calmness', 'Supports composed focus without sedation', 'Derived from Camellia sinensis green tea polyphenols.', 3),
('taurine', 'Taurine', '100 mg', 'Amino Acids', '/images/ing-taurine.png', 'Supports cardiovascular osmoregulation', 'Helps maintain cellular hydration & endurance', 'Conditionally essential sulfonic amino acid concentrated in cardiac tissue.', 4),
('panax-ginseng', 'Panax Ginseng', '100 mg', 'Botanicals', '/images/ing-panax-ginseng.png', 'Natural vitality & stamina adaptogen', 'Helps counter mental and physical fatigue', 'Standardized ginsenoside root extract assayed via HPLC.', 5),
('ashwagandha', 'Ashwagandha', '200 mg', 'Botanicals', '/images/ing-ashwagandha.png', 'Modulates everyday stress response', 'Supports strength, stamina & equilibrium', 'Withania Somnifera root extract standardized for active withanolides.', 6),
('lycopene', 'Lycopene', '10 mg', 'Antioxidants', '/images/ing-lycopene.png', 'Potent carotenoid free-radical defense', 'Supports cardiovascular & cellular health', 'Lipid-soluble natural vine carotenoid stabilized against oxidation.', 7),
('astaxanthin', 'Astaxanthin', '8 mg', 'Antioxidants', '/images/ing-astaxanthin.png', 'Spans full phospholipid cell membrane', 'Defends skin, ocular & neural mitochondria', 'Derived from Haematococcus pluvialis microalgae.', 8),
('multivitamins', 'Multivitamins', 'B-Complex, C, D3, K2', 'Micros & Bio-Enhancer', '/images/ing-multivitamins.png', 'Fuels daily cellular energy metabolism', 'Supports immune defense & bone density', 'Calibrated to bioavailable daily reference intakes without megadose excess.', 9),
('multiminerals', 'Multiminerals', 'Zn, Se, Mg & trace', 'Micros & Bio-Enhancer', '/images/ing-multiminerals.png', 'Cofactors for antioxidant enzymes', 'Supports muscle, nerve & metabolic balance', 'Chelated mineral matrix designed for gentle gastric absorption.', 10),
('piperine', 'Piperine 95%', '3 mg', 'Micros & Bio-Enhancer', '/images/ing-piperine.png', 'Enhances nutrient bio-absorption', 'Amplifies carotenoid & botanical uptake', 'Standardized black pepper alkaloid extract inhibiting premature glucuronidation.', 11);

INSERT IGNORE INTO reviews_ratings (id, product_id, product_name, author, initials, location, role, rating, title, quote, batch_code, review_date_label, verified) VALUES
('rev-1', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 'Rahul Sharma', 'RS', 'Bengaluru, IN', 'Product Architect', 5, 'Steady clarity from 9 AM through evening training', 'Really smooth shopping experience and noticeable daily consistency. The ingredient transparency made it easy to evaluate dosages before ordering, and the amino-adaptogen profile replaced my afternoon espresso.', 'LOT-2025-CR9', 'February 2025', 1),
('rev-2', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 'Priya Verma', 'PV', 'Mumbai, IN', 'Clinical Researcher', 5, 'Zero gastric discomfort and clean Alu-Alu strip format', 'I appreciate the clean formulation specs and compact blister strip that travels easily in my work bag. Having Astaxanthin, L-Theanine, and Ashwagandha calibrated together simplifies my morning protocol.', 'LOT-2025-CR9', 'January 2025', 1),
('rev-3', 'mens-favor-stamina', 'Men''s Favor Daily Stamina Complex', 'Aman Gupta', 'AG', 'New Delhi, IN', 'Endurance Cyclist', 4, 'Clear labeling and measurable recovery consistency', 'The product details and clinical dosing notes are presented clearly without exaggerated hype. Recovery between long weekend rides improved steadily over my first four weeks.', 'LOT-2025-MF2', 'January 2025', 1),
('rev-4', 'coreaa-daily-vitality', 'COREAA™ Daily Vitality', 'Neha Singh', 'NS', 'Hyderabad, IN', 'Operations Director', 5, 'Thoughtfully organized transparency in one place', 'Everything was nicely organized from ingredient verification to cold-chain delivery updates. Within three weeks my afternoon fatigue flattened out completely without any jittery edge.', 'LOT-2025-CR8', 'December 2024', 1);

INSERT IGNORE INTO homepage_banners (id, title, subtitle, cta_label, cta_target, image_url, sort_order, is_active) VALUES
(1, 'Daily Vitality. Elevated.', 'Meet COREAA™ Daily Vitality—11 standardized compounds in one blister strip.', 'Shop COREAA Now', '#shop-protocol', '/images/coreaa-box-1.png', 1, 1);

INSERT IGNORE INTO how_it_works_steps (id, step_number, title, description, outcome_label) VALUES
(1, 1, 'Amino Acid Complex', 'L-Arginine, L-Citrulline, Taurine, and L-Theanine promote clean microvascular circulation and calm focus.', 'Circulation & Tone'),
(2, 2, 'Botanical Adaptogens', 'Standardized Panax Ginseng and Ashwagandha support steady stress equilibrium and sustained stamina.', 'Stress & Stamina'),
(3, 3, 'Antioxidant Shield', 'Marine Astaxanthin and vine Lycopene paired with 95% Piperine elevate cellular defense and bio-absorption.', 'Mitochondrial Defense'),
(4, 4, 'Vitamins & Minerals', 'Complete multi-trace mineral and B-complex, C, D3, and K2 spectrum fueling daily metabolic enzymes.', 'Foundational Support');

INSERT IGNORE INTO about_us_content (id, block_key, heading, body, metric_value, sort_order) VALUES
(1, 'bioavailable_core', 'Bioavailable Core', 'Every milligram is standardized and disclosed with zero proprietary blends.', '100%', 1),
(2, 'synthetic_fillers', 'Zero Synthetic Fillers', 'Formulated cleanly without artificial dyes or unnecessary bulking agents.', '0.00', 2),
(3, 'iso_verified', 'Third-Party Lab Verified', 'Independent ISO 17025 accredited facilities assay each production lot.', 'ISO 17025', 3);

INSERT IGNORE INTO website_content (id, content_key, title, content_value) VALUES
(1, 'helpline', 'Patient Support Helpline', '+91 1800-TBD-WELL'),
(2, 'free_shipping_threshold', 'Free Shipping Threshold (INR)', '1000'),
(3, 'fssai_license', 'FSSAI Marketing License', '12725057000248');

-- -----------------------------------------------------------------------------
-- 9. ADDITIONAL ADMIN TABLES (BLOG CATEGORIES, INVENTORY LOGS, ACTIVITY LOGS, STORE SETTINGS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(80) NOT NULL,
  sku VARCHAR(60) NOT NULL,
  change_qty INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(200) NOT NULL DEFAULT 'Manual stock adjustment',
  actor_email VARCHAR(160) NOT NULL DEFAULT 'admin@tbdwellness.com',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inventory_logs_product (product_id),
  CONSTRAINT fk_inventory_logs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_name VARCHAR(120) NOT NULL DEFAULT 'Executive Admin',
  actor_email VARCHAR(160) NOT NULL DEFAULT 'admin@tbdwellness.com',
  action_type VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NULL,
  details VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_group VARCHAR(60) NOT NULL DEFAULT 'General',
  label VARCHAR(160) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO blog_categories (id, name, slug, description, is_active) VALUES
(1, 'Nutrition', 'nutrition', 'Everyday micronutrient density and foundational diet science.', 1),
(2, 'Fitness & Lifestyle', 'fitness-lifestyle', 'Zone 2 endurance, resistance training, and cortisol equilibrium.', 1),
(3, 'Ingredients', 'ingredients', 'HPLC standardization, bioavailability assays, and botanical monographs.', 1),
(4, 'Wellness', 'wellness', 'Circadian rhythm alignment, sleep architecture, and longevity habits.', 1),
(5, 'Healthy Habits', 'healthy-habits', 'Practical daily routines for sustained physical and cognitive output.', 1);

INSERT IGNORE INTO homepage_sections (id, section_key, heading, subheading, body_json, sort_order, is_visible) VALUES
(1, 'hero_vitality', 'Daily Vitality. Elevated.', 'Meet COREAA™ Daily Vitality—11 standardized compounds in one blister strip.', JSON_OBJECT('badge', 'Batch #CR-2025B', 'cta', 'Shop COREAA Now'), 1, 1),
(2, 'four_pillars', 'Four Synergistic Pillars of Daily Vitality', 'Engineered to align circulation, adaptogenic resilience, mitochondrial protection, and daily micronutrient coverage.', JSON_OBJECT('pillars', 4), 2, 1),
(3, 'ingredient_dossier', 'What''s Inside COREAA™?', 'Inspect all 11 studio-assayed compounds formulated inside every coated tablet.', JSON_OBJECT('count', 11), 3, 1),
(4, 'verified_cohort', 'Wellness built on empirical transparency.', 'Real feedback from verified buyers and endurance athletes.', JSON_OBJECT('rating', 4.9), 4, 1);

INSERT IGNORE INTO testimonials (id, author_name, author_role, quote, product_name, is_featured) VALUES
(1, 'Rahul Sharma', 'Product Architect · Bengaluru', 'The ingredient transparency made it easy to evaluate dosages before ordering, and COREAA replaced my afternoon espresso.', 'COREAA™ Daily Vitality', 1),
(2, 'Priya Verma', 'Clinical Researcher · Mumbai', 'Zero gastric discomfort and compact Alu-Alu blister strip that travels cleanly in my work bag.', 'COREAA™ Daily Vitality', 1),
(3, 'Aman Gupta', 'Endurance Cyclist · New Delhi', 'Recovery between long weekend rides improved steadily over my first four weeks.', 'Men''s Favor Daily Stamina Complex', 1);

INSERT IGNORE INTO transactions (id, payment_id, order_id, txn_type, gateway_txn_id, amount, notes) VALUES
(1, 1, '#TBD-10492', 'Capture', 'txn_RZP_10492_CAP', 4890.00, 'UPI instant capture settled'),
(2, 2, '#TBD-10491', 'Capture', 'txn_RZP_10491_CAP', 7250.00, 'Credit card capture verified'),
(3, 4, '#TBD-10489', 'Capture', 'txn_RZP_10489_CAP', 3499.00, 'UPI payment settled'),
(4, 5, '#TBD-10488', 'Refund', 'txn_RZP_10488_RFD', 6100.00, 'Full patient cancellation refund'),
(5, 6, '#TBD-10487', 'Settlement', 'txn_RZP_10487_STL', 2498.00, 'NetBanking T+1 settlement');

INSERT IGNORE INTO refunds (id, order_id, payment_id, amount, reason, status) VALUES
(1, '#TBD-10488', 5, 6100.00, 'Patient cancelled smart tracker order before dispatch', 'Processed');

INSERT IGNORE INTO journal_articles (
  id, digest_number, title, category, read_time, author, author_role,
  published_label, study_ref, image_url, excerpt, body_json, is_featured
) VALUES
(
  'synergistic-bioavailability', 'Featured Assay #882',
  'The Science of Synergistic Bioavailability: Why L-Citrulline and Astaxanthin Belong Together',
  'Ingredients', '6 min read', 'Dr. Rhea Sen', 'Chief Formulation Scientist',
  'May 2025', 'Clinical Study Ref #882', '/images/ing-astaxanthin.png',
  'Understanding how combining nitric oxide amino precursors with microalgae carotenoids protects vascular endothelium and drives sustained daytime alertness.',
  JSON_ARRAY(
    'True cellular vitality depends on microvascular delivery of oxygen and nutrients alongside protection of mitochondrial membranes.',
    'L-Citrulline paired with L-Arginine provides both immediate and sustained substrate availability for endothelial nitric oxide synthase.',
    'Lipid-soluble Haematococcus pluvialis Astaxanthin spans both polar and non-polar layers of the cell membrane, amplified by 3mg of 95% Piperine.'
  ), 1
),
(
  'everyday-nutrition', 'Digest #01',
  'Understanding the Importance of Everyday Micronutrient Density',
  'Nutrition', '4 min read', 'Dr. Kavita Menon', 'Nutritional Biochemist',
  'April 2025', NULL, '/images/ing-multivitamins.png',
  'Consistent foundational nutrition supports enzymatic pathways, immune readiness, and cognitive resilience.',
  JSON_ARRAY(
    'Modern urban diets frequently satisfy caloric requirements while leaving silent gaps in Magnesium, Zinc, Selenium, and Vitamins D3 and K2.',
    'Pairing whole-food meals with a calibrated daily multivitamin and multimineral complex stabilizes baseline metabolic output.'
  ), 0
),
(
  'consistent-fitness-routine', 'Digest #02',
  'Building a Sustainable Kinetic Routine Without Cortisol Overload',
  'Fitness & Lifestyle', '5 min read', 'Arjun Malhotra', 'Performance Physiologist',
  'April 2025', NULL, '/images/ing-panax-ginseng.png',
  'Structuring Zone 2 aerobic base work, resistance sessions, and adaptogenic recovery windows to build lasting stamina.',
  JSON_ARRAY(
    'Chronically elevated cortisol blunts muscular adaptation and disrupts deep sleep architecture.',
    'Anchor your weekly schedule with Zone 2 sessions, structured resistance blocks, and standardized Panax Ginseng and Ashwagandha.'
  ), 0
),
(
  'understanding-ingredients', 'Digest #03',
  'Why Reading Standardization Assays & Batch COAs Matters',
  'Ingredients', '7 min read', 'Dr. Rhea Sen', 'Chief Formulation Scientist',
  'March 2025', NULL, '/images/ing-ashwagandha.png',
  'Proprietary blends hide sub-clinical dusting. Learn how HPLC standardization and ISO 17025 lab verification protect efficacy.',
  JSON_ARRAY(
    'Unstandardized raw root powders vary dramatically by harvest season, soil quality, and drying temperature.',
    'At TBD Wellness, every botanical and amino compound is specified down to exact milligram dosage and active biomarker percentage.'
  ), 0
);

INSERT IGNORE INTO inventory_logs (id, product_id, sku, change_qty, previous_stock, new_stock, reason, actor_email) VALUES
(1, 'coreaa-daily-vitality', 'TBD-CR-001', 150, 0, 150, 'Initial batch #CR-2025B warehouse receipt', 'admin@tbdwellness.com'),
(2, 'coreaa-daily-vitality', 'TBD-CR-001', -8, 150, 142, 'Storefront cold-chain orders dispatched', 'admin@tbdwellness.com'),
(3, 'multivitamin-softgels', 'TBD-MV-004', -11, 25, 14, 'Low stock threshold alert triggered', 'admin@tbdwellness.com');

INSERT IGNORE INTO activity_logs (id, actor_name, actor_email, action_type, entity_type, entity_id, details, ip_address) VALUES
(1, 'Dr. Rhea Sen (Executive Admin)', 'admin@tbdwellness.com', 'LOGIN', 'auth', '1', 'Executive Admin signed in via JWT session', '127.0.0.1'),
(2, 'Dr. Rhea Sen (Executive Admin)', 'admin@tbdwellness.com', 'UPDATE', 'order', '#TBD-10492', 'Marked order #TBD-10492 as Delivered', '127.0.0.1'),
(3, 'Dr. Rhea Sen (Executive Admin)', 'admin@tbdwellness.com', 'PUBLISH', 'product', 'coreaa-daily-vitality', 'Published COREAA Daily Vitality batch #CR-2025B', '127.0.0.1');

INSERT IGNORE INTO store_settings (setting_key, setting_group, label, setting_value) VALUES
('store_name', 'General', 'Storefront Name', 'TBD Wellness'),
('support_email', 'General', 'Support Email', 'care@tbdwellness.com'),
('support_phone', 'General', 'Support Helpline', '+91 1800-TBD-WELL'),
('currency_code', 'Commerce', 'Currency Code', 'INR'),
('gst_rate_percent', 'Commerce', 'Default GST Rate (%)', '18'),
('free_shipping_threshold', 'Delivery', 'Free Shipping Threshold (INR)', '1000'),
('cold_chain_sla', 'Delivery', 'Cold-Chain Dispatch SLA', 'Within 24 Hours'),
('fssai_license', 'Compliance', 'FSSAI Marketing License', '12725057000248');

