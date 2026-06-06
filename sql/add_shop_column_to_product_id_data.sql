ALTER TABLE product_id_data
DROP CONSTRAINT IF EXISTS product_id_data_shop_check;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product_id_data'
          AND column_name = '店铺'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product_id_data'
          AND column_name = 'shop'
    ) THEN
        ALTER TABLE product_id_data RENAME COLUMN "店铺" TO shop;
    ELSIF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product_id_data'
          AND column_name = '店铺'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product_id_data'
          AND column_name = 'shop'
    ) THEN
        EXECUTE 'UPDATE product_id_data SET shop = "店铺" WHERE shop IS NULL AND "店铺" IS NOT NULL';
        ALTER TABLE product_id_data DROP COLUMN "店铺";
    END IF;
END $$;

ALTER TABLE product_id_data
ADD COLUMN IF NOT EXISTS shop TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_id_data_shop_check'
    ) THEN
        ALTER TABLE product_id_data
        ADD CONSTRAINT product_id_data_shop_check
        CHECK (shop IS NULL OR shop IN ('1', '2', '3', '4', '5'))
        NOT VALID;
    END IF;
END $$;
