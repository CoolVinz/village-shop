-- Database Constraints & Business Logic
-- Backend Reliability Focus: Data integrity & consistency

-- ================================
-- CHECK CONSTRAINTS
-- ================================

-- Price validation
ALTER TABLE products ADD CONSTRAINT chk_products_base_price_positive 
CHECK (base_price >= 0);

ALTER TABLE products ADD CONSTRAINT chk_products_compare_price_valid 
CHECK (compare_price IS NULL OR compare_price >= base_price);

ALTER TABLE product_variants ADD CONSTRAINT chk_variants_price_positive 
CHECK (price >= 0);

ALTER TABLE product_variants ADD CONSTRAINT chk_variants_stock_non_negative 
CHECK (stock >= 0);

-- Order validation
ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts_positive 
CHECK (
  subtotal_amount >= 0 AND 
  tax_amount >= 0 AND 
  shipping_amount >= 0 AND 
  discount_amount >= 0 AND 
  total_amount >= 0
);

ALTER TABLE orders ADD CONSTRAINT chk_orders_total_calculation 
CHECK (total_amount = subtotal_amount + tax_amount + shipping_amount - discount_amount);

ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE order_items ADD CONSTRAINT chk_order_items_prices_positive 
CHECK (unit_price >= 0 AND total_price >= 0);

ALTER TABLE order_items ADD CONSTRAINT chk_order_items_total_calculation 
CHECK (total_price = unit_price * quantity);

-- Payment validation
ALTER TABLE payment_slips ADD CONSTRAINT chk_payment_amount_positive 
CHECK (amount > 0);

-- User validation
ALTER TABLE users ADD CONSTRAINT chk_users_role_profile_complete 
CHECK (
  (role = 'CUSTOMER' AND profile_complete = true) OR 
  (role IN ('VENDOR', 'ADMIN'))
);

-- Shop validation
ALTER TABLE shops ADD CONSTRAINT chk_shops_rating_range 
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

ALTER TABLE products ADD CONSTRAINT chk_products_rating_range 
CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Category hierarchy validation
ALTER TABLE product_categories ADD CONSTRAINT chk_categories_no_self_parent 
CHECK (parent_id != id);

-- ================================
-- BUSINESS LOGIC CONSTRAINTS
-- ================================

-- Prevent duplicate default variants per product
CREATE UNIQUE INDEX idx_product_variants_one_default_per_product 
ON product_variants(product_id) 
WHERE is_default = true;

-- Ensure shop owner has VENDOR role
ALTER TABLE shops ADD CONSTRAINT chk_shops_owner_is_vendor 
CHECK (owner_id IN (SELECT id FROM users WHERE role = 'VENDOR'));

-- Ensure order customer has CUSTOMER role
ALTER TABLE orders ADD CONSTRAINT chk_orders_customer_role 
CHECK (customer_id IN (SELECT id FROM users WHERE role IN ('CUSTOMER', 'ADMIN')));

-- Prevent orders in the past (with 1 hour buffer)
ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery_time_future 
CHECK (delivery_time IS NULL OR delivery_time > (now() - interval '1 hour'));

-- Ensure payment amount matches order total
ALTER TABLE payment_slips ADD CONSTRAINT chk_payment_amount_matches_order 
CHECK (amount <= (SELECT total_amount FROM orders WHERE id = order_id));

-- ================================
-- REFERENTIAL INTEGRITY
-- ================================

-- Cascade deletes for dependent data
ALTER TABLE product_variants 
ADD CONSTRAINT fk_variants_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_images 
ADD CONSTRAINT fk_images_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_status_history 
ADD CONSTRAINT fk_status_history_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE payment_slips 
ADD CONSTRAINT fk_payment_slips_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Restrict deletes for critical references
ALTER TABLE products 
ADD CONSTRAINT fk_products_shop 
FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE RESTRICT;

ALTER TABLE shops 
ADD CONSTRAINT fk_shops_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customer 
FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT;

-- ================================
-- TRIGGERS FOR BUSINESS LOGIC
-- ================================

-- Update shop order count when order is created/updated
CREATE OR REPLACE FUNCTION update_shop_order_count() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shops 
    SET order_count = order_count + 1 
    WHERE id IN (SELECT DISTINCT shop_id FROM order_items WHERE order_id = NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Update status change logic here if needed
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_shop_order_count 
AFTER INSERT OR UPDATE ON orders 
FOR EACH ROW EXECUTE FUNCTION update_shop_order_count();

-- Update product order count when order item is created
CREATE OR REPLACE FUNCTION update_product_order_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET order_count = order_count + NEW.quantity 
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_product_order_count 
AFTER INSERT ON order_items 
FOR EACH ROW EXECUTE FUNCTION update_product_order_count();

-- Update stock when order is confirmed
CREATE OR REPLACE FUNCTION update_stock_on_order_confirm() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CONFIRMED' AND OLD.status = 'PENDING' THEN
    UPDATE product_variants 
    SET stock = stock - oi.quantity 
    FROM order_items oi 
    WHERE oi.order_id = NEW.id 
    AND oi.variant_id IS NOT NULL 
    AND product_variants.id = oi.variant_id;
    
    -- For products without variants
    UPDATE products 
    SET stock = stock - oi.quantity 
    FROM order_items oi 
    WHERE oi.order_id = NEW.id 
    AND oi.variant_id IS NULL 
    AND products.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_stock_on_confirm 
AFTER UPDATE ON orders 
FOR EACH ROW EXECUTE FUNCTION update_stock_on_order_confirm();

-- ================================
-- PERFORMANCE CONSTRAINTS
-- ================================

-- Prevent too many images per product
ALTER TABLE product_images ADD CONSTRAINT chk_max_images_per_product 
CHECK ((SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = product_id) <= 10);

-- Prevent too many variants per product
ALTER TABLE product_variants ADD CONSTRAINT chk_max_variants_per_product 
CHECK ((SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = product_id) <= 50);

-- Limit order items per order (prevent abuse)
ALTER TABLE order_items ADD CONSTRAINT chk_max_items_per_order 
CHECK ((SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = order_id) <= 100);

-- ================================
-- SECURITY CONSTRAINTS
-- ================================

-- Row Level Security (RLS) policies would go here
-- Example: Users can only see their own orders
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY orders_user_policy ON orders FOR ALL TO authenticated_user 
-- USING (customer_id = current_setting('app.current_user_id')::uuid);

-- ================================
-- MAINTENANCE FUNCTIONS
-- ================================

-- Function to check constraint violations
CREATE OR REPLACE FUNCTION check_data_integrity() 
RETURNS TABLE(table_name text, issue text, count bigint) AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY
  SELECT 'products'::text, 'products without shop'::text, 
         COUNT(*) FROM products p LEFT JOIN shops s ON p.shop_id = s.id WHERE s.id IS NULL;
  
  RETURN QUERY
  SELECT 'order_items'::text, 'order_items without order'::text, 
         COUNT(*) FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL;
  
  -- Check for negative values
  RETURN QUERY
  SELECT 'products'::text, 'negative prices'::text, 
         COUNT(*) FROM products WHERE base_price < 0;
  
  RETURN QUERY
  SELECT 'orders'::text, 'negative amounts'::text, 
         COUNT(*) FROM orders WHERE total_amount < 0;
END;
$$ LANGUAGE plpgsql;