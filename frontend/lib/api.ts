import type { Product, ProductDetail } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8787'

// 商品一覧を取得
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    // Next.jsのキャッシュを無効化（常に最新を取得）
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('商品一覧の取得に失敗しました')
  return res.json()
}

// 商品詳細+価格履歴を取得
export async function getProductDetail(id: number): Promise<ProductDetail> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('商品詳細の取得に失敗しました')
  return res.json()
}

// 商品を登録
export async function addProduct(params: {
  rakutenUrl: string
  category?: string
  alertPrice?: number
}): Promise<{ id: number; itemName: string; message: string }> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rakutenUrl: params.rakutenUrl,
      category: params.category || undefined,
      alertPrice: params.alertPrice || undefined,
    }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? '商品登録に失敗しました')
  }
  return res.json()
}

// 商品を削除
export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('商品削除に失敗しました')
}

// alert_price を更新
export async function updateAlertPrice(id: number, alertPrice: number): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alertPrice }),
  })
  if (!res.ok) throw new Error('更新に失敗しました')
}
