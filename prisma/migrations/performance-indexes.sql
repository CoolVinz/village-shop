-- Performance Optimization Indexes
-- Backend Performance Focus: 99.9% uptime, <100ms queries

-- ================================
-- COMPOUND INDEXES FOR COMMON QUERIES
-- ================================

-- Product search and filtering (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_shop_category_active 
ON products(shop_id, category_id, is_available) 
WHERE is_available = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_price 
ON products(category_id, base_price) 
WHERE is_available = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_text 
ON products USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Order management (vendor dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shop_status_created 
ON orders(customer_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_shop_status 
ON order_items(shop_id, status, created_at DESC);

-- Delivery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_delivery_zone_time 
ON orders(delivery_time, status) 
WHERE delivery_time IS NOT NULL AND status IN ('CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY');

-- Customer order history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_created_desc 
ON orders(customer_id, created_at DESC);

-- Payment verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_slips_status_created 
ON payment_slips(status, created_at DESC) 
WHERE status = 'PENDING';

-- ================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ================================

-- Active products only (most queries filter by this)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_rating 
ON products(rating DESC, order_count DESC) 
WHERE is_available = true;

-- Pending orders only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_pending_created 
ON orders(created_at DESC) 
WHERE status = 'PENDING';

-- Active shops only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_active_rating 
ON shops(rating DESC, order_count DESC) 
WHERE is_active = true AND is_verified = true;

-- ================================
-- COVERING INDEXES (POSTGRES 11+)
-- ================================

-- Product listing with all needed data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_listing_covering 
ON products(shop_id, is_available, created_at DESC) 
INCLUDE (name, base_price, rating, order_count);

-- Order summary covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_summary_covering 
ON orders(customer_id, created_at DESC) 
INCLUDE (order_number, total_amount, status, delivery_time);

-- ================================
-- FOREIGN KEY INDEXES (CRITICAL)
-- ================================

-- Ensure all foreign keys have indexes for join performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_address_id ON users(address_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_address_id ON shops(address_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_shop_id ON order_items(shop_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_slips_order_id ON payment_slips(order_id);

-- ================================
-- UNIQUE CONSTRAINTS WITH INDEXES
-- ================================

-- Ensure unique constraints have optimal indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
ON users(email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_line_id_unique 
ON users(line_id) WHERE line_id IS NOT NULL;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_product_categories_slug_unique 
ON product_categories(slug);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_slug_unique 
ON shops(slug);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug_unique 
ON products(slug);

-- ================================
-- ANALYTICS INDEXES
-- ================================

-- Sales analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics_date 
ON orders(date_trunc('day', created_at), status, total_amount);

-- Product performance analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_analytics 
ON products(shop_id, created_at, order_count, rating) 
WHERE is_available = true;

-- Shop performance analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_analytics 
ON shops(created_at, order_count, rating, is_active);

-- ================================
-- MAINTENANCE COMMANDS
-- ================================

-- Update table statistics for query planner
ANALYZE users;
ANALYZE addresses;
ANALYZE product_categories;
ANALYZE shops;
ANALYZE products;
ANALYZE product_variants;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payment_slips;

-- Vacuum tables to reclaim space and update visibility maps
VACUUM ANALYZE users;
VACUUM ANALYZE addresses;
VACUUM ANALYZE product_categories;
VACUUM ANALYZE shops;
VACUUM ANALYZE products;
VACUUM ANALYZE product_variants;
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE payment_slips;