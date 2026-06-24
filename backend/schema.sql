-- 商品マスタ
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code   TEXT NOT NULL UNIQUE,   -- 楽天のitemCode（例: "shop123:item456"）
  shop_code   TEXT NOT NULL,
  item_name   TEXT,
  image_url   TEXT,
  rakuten_url TEXT,
  category    TEXT,                   -- ユーザーが自由につけるグループ名
  alert_price INTEGER,                -- この金額以下になったらDiscord通知
  is_active   INTEGER DEFAULT 1,      -- 0にすると追跡停止
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 価格・在庫の履歴（ポーリングのたびに1行追加される）
CREATE TABLE IF NOT EXISTS price_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price       INTEGER NOT NULL,       -- 税込価格（円）
  point_rate  REAL DEFAULT 1.0,       -- ポイント倍率（1.0 = 通常）
  in_stock    INTEGER NOT NULL,       -- 1=在庫あり / 0=在庫なし
  is_sale     INTEGER DEFAULT 0,      -- 1=セール判定
  fetched_at  TEXT DEFAULT (datetime('now'))
);

-- 通知ログ（同じ条件で何度も通知しないための記録）
CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,          -- 'price_drop' | 'back_in_stock' | 'sale'
  message     TEXT,
  sent_at     TEXT DEFAULT (datetime('now'))
);

-- 価格履歴の検索を高速化するインデックス
CREATE INDEX IF NOT EXISTS idx_price_history_product_id
  ON price_history(product_id, fetched_at DESC);
  