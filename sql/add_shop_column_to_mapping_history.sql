ALTER TABLE mapping_history
ADD COLUMN IF NOT EXISTS shop TEXT;

ALTER TABLE mapping_history
DROP CONSTRAINT IF EXISTS mapping_history_shop_check;

ALTER TABLE mapping_history
ADD CONSTRAINT mapping_history_shop_check
CHECK (shop IS NULL OR shop = '' OR shop ~ '^[1-5](,[1-5])*$')
NOT VALID;
