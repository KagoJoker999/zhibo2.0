ALTER TABLE product_id_data
ADD COLUMN IF NOT EXISTS "店铺" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'product_id_data_shop_check'
    ) THEN
        ALTER TABLE product_id_data
        ADD CONSTRAINT product_id_data_shop_check
        CHECK ("店铺" IS NULL OR "店铺" IN ('1', '2', '3', '4', '5'))
        NOT VALID;
    END IF;
END $$;
