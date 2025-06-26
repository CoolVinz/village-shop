# Database Migration Implementation Guide

## **Backend-Focused Migration Strategy**
**Target**: Zero downtime, 99.9% reliability, 10x scalability

## **Pre-Migration Checklist**

### **1. Environment Preparation**
```bash
# Backup current database
pg_dump villager_shop > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migration on staging environment
createdb villager_shop_staging
psql villager_shop_staging < backup_*.sql

# Verify data integrity
psql villager_shop_staging -f docs/database-constraints.sql
```

### **2. Performance Baseline**
```sql
-- Measure current performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC;
```

## **Migration Steps**

### **Phase 1: Schema Preparation**

```bash
# 1. Create new normalized schema
npx prisma migrate dev --name "normalized-schema" --schema prisma/schema-normalized.prisma

# 2. Apply performance indexes
psql villager_shop < prisma/migrations/performance-indexes.sql

# 3. Apply data constraints
psql villager_shop < docs/database-constraints.sql
```

### **Phase 2: Data Migration**

```sql
-- Migration script for normalized schema
BEGIN;

-- 1. Create addresses from existing data
INSERT INTO addresses (id, house_number, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  house_number,
  now(),
  now()
FROM (
  SELECT DISTINCT house_number 
  FROM users 
  WHERE house_number IS NOT NULL
  UNION
  SELECT DISTINCT house_number 
  FROM shops
) as distinct_addresses;

-- 2. Update users with address references
UPDATE users 
SET address_id = a.id
FROM addresses a
WHERE users.house_number = a.house_number;

-- 3. Update shops with address references
UPDATE shops 
SET address_id = a.id
FROM addresses a
WHERE shops.house_number = a.house_number;

-- 4. Migrate product categories
INSERT INTO product_categories (id, name, slug, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  category,
  lower(replace(category, ' ', '-')),
  true,
  now(),
  now()
FROM (SELECT DISTINCT category FROM products WHERE category IS NOT NULL) as cats;

-- 5. Update products with category references
UPDATE products 
SET category_id = pc.id
FROM product_categories pc
WHERE products.category = pc.name;

-- 6. Create default product variants for existing products
INSERT INTO product_variants (id, product_id, sku, name, price, stock, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  p.id || '-default',
  'Default',
  p.price,
  p.stock,
  true,
  now(),
  now()
FROM products p;

COMMIT;
```

### **Phase 3: Application Updates**

```typescript
// Update Prisma client queries to use normalized schema

// Old query
const products = await prisma.product.findMany({
  where: { category: 'Electronics' }
});

// New normalized query
const products = await prisma.product.findMany({
  where: { 
    category: { 
      slug: 'electronics' 
    } 
  },
  include: {
    category: true,
    variants: true,
    shop: {
      include: {
        address: true
      }
    }
  }
});
```

### **Phase 4: Performance Optimization**

```typescript
// Implement caching layer
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache product listings
export async function getCachedProducts(categorySlug: string) {
  const cacheKey = `products:category:${categorySlug}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const products = await prisma.product.findMany({
    where: {
      category: { slug: categorySlug },
      isAvailable: true
    },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      },
      shop: {
        select: {
          id: true,
          name: true,
          rating: true
        }
      }
    },
    orderBy: [
      { rating: 'desc' },
      { orderCount: 'desc' }
    ]
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
}
```

## **Monitoring Setup**

### **Database Performance Monitoring**

```sql
-- Create monitoring views
CREATE VIEW db_performance_summary AS
SELECT 
  'connection_count' as metric,
  count(*) as value,
  100 as threshold,
  case when count(*) > 80 then 'CRITICAL' else 'OK' end as status
FROM pg_stat_activity
UNION ALL
SELECT 
  'cache_hit_ratio' as metric,
  round(sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0), 2) as value,
  90 as threshold,
  case when round(sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0), 2) < 90 then 'CRITICAL' else 'OK' end as status
FROM pg_stat_database;

-- Query performance monitoring
CREATE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- Queries slower than 100ms
ORDER BY mean_time DESC;
```

### **Application Health Checks**

```typescript
// Health check endpoint
export async function GET() {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis connectivity check
    await redis.ping();
    
    // Performance metrics
    const dbMetrics = await prisma.$queryRaw`
      SELECT * FROM db_performance_summary
    `;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: 'connected',
      metrics: dbMetrics
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

## **Rollback Strategy**

### **Emergency Rollback**

```bash
# If migration fails, rollback to previous state
psql villager_shop < backup_$(date +%Y%m%d_%H%M%S).sql

# Restart application with old schema
git checkout HEAD~1 -- prisma/schema.prisma
npm run build && npm start
```

### **Gradual Rollback**

```sql
-- Remove new constraints if causing issues
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_base_price_positive;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_amounts_positive;

-- Disable new indexes if causing performance issues
DROP INDEX CONCURRENTLY IF EXISTS idx_products_shop_category_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_customer_created_desc;
```

## **Validation & Testing**

### **Data Integrity Checks**

```sql
-- Run integrity checks after migration
SELECT * FROM check_data_integrity();

-- Verify foreign key relationships
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### **Performance Testing**

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/products

# Monitor during load test
watch -n 1 'psql villager_shop -c "SELECT * FROM db_performance_summary;"'
```

## **Post-Migration Cleanup**

### **Remove Legacy Columns**

```sql
-- After verifying migration success, remove old columns
ALTER TABLE users DROP COLUMN IF EXISTS house_number;
ALTER TABLE shops DROP COLUMN IF EXISTS house_number;
ALTER TABLE products DROP COLUMN IF EXISTS category;
ALTER TABLE products DROP COLUMN IF EXISTS stock;
ALTER TABLE products DROP COLUMN IF EXISTS price;
```

### **Optimize Statistics**

```sql
-- Update table statistics for optimal query planning
ANALYZE users;
ANALYZE addresses;
ANALYZE product_categories;
ANALYZE shops;
ANALYZE products;
ANALYZE product_variants;
ANALYZE orders;
ANALYZE order_items;

-- Update auto-vacuum settings for new tables
ALTER TABLE product_variants SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

## **Success Metrics**

**Target Achievements:**
- ✅ **Query Performance**: 95% < 100ms response time
- ✅ **Throughput**: Handle 1000 concurrent users
- ✅ **Reliability**: 99.9% uptime maintained
- ✅ **Data Integrity**: Zero data loss during migration
- ✅ **Scalability**: Ready for 10x load increase

**Monitoring Dashboard:**
- Connection count trends
- Query performance metrics  
- Cache hit ratios
- Error rates and alerting
- Business metrics (orders/hour, revenue/day)