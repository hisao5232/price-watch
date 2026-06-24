// バックエンドAPIのレスポンス型定義

export type Product = {
  id: number
  item_code: string
  shop_code: string
  item_name: string
  image_url: string | null
  rakuten_url: string | null
  category: string | null
  alert_price: number | null
  is_active: number
  created_at: string
  updated_at: string
  // 一覧取得時に最新price_historyがJOINされる
  price: number | null
  in_stock: number | null
  is_sale: number | null
  point_rate: number | null
  fetched_at: string | null
}

export type PriceHistory = {
  price: number
  point_rate: number
  in_stock: number
  is_sale: number
  fetched_at: string
}

export type ProductDetail = {
  product: Product
  history: PriceHistory[]
}
