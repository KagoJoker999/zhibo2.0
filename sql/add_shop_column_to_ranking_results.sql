ALTER TABLE ranking_results
ADD COLUMN IF NOT EXISTS shop TEXT;

ALTER TABLE ranking_results
DROP CONSTRAINT IF EXISTS ranking_results_shop_check;

ALTER TABLE ranking_results
ADD CONSTRAINT ranking_results_shop_check
CHECK (shop IS NULL OR shop = '' OR shop ~ '^[1-5](,[1-5])*$')
NOT VALID;
