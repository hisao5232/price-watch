'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/types'

type Props = {
  product: Product
  onDelete: (id: number) => void
}

export default function ProductCard({ product, onDelete }: Props) {
  // 価格表示のフォーマット
  const formatPrice = (price: number | null) =>
    price != null ? `¥${price.toLocaleString()}` : '---'

  // 最終取得からの経過時間
  const getElapsedTime = (fetchedAt: string | null) => {
    if (!fetchedAt) return '未取得'
    const diff = Date.now() - new Date(fetchedAt + 'Z').getTime()
    const hours = Math.floor(diff / 1000 / 60 / 60)
    if (hours < 1) return '1時間以内'
    if (hours < 24) return `${hours}時間前`
    return `${Math.floor(hours / 24)}日前`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-4">
        {/* 商品画像 */}
        <div className="shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.item_name}
              width={80}
              height={80}
              className="rounded-lg object-cover"
              unoptimized  // 楽天CDNの画像はNext.js最適化をスキップ
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>

        {/* 商品情報 */}
        <div className="flex-1 min-w-0">
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 cursor-pointer">
              {product.item_name}
            </h3>
          </Link>

          {/* バッジ */}
          <div className="flex gap-1 mt-1 flex-wrap">
            {product.in_stock === 1 ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">在庫あり</span>
            ) : (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">在庫なし</span>
            )}
            {product.is_sale === 1 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                🔥 セール中
              </span>
            )}
            {product.point_rate && product.point_rate > 1 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                P{product.point_rate}倍
              </span>
            )}
            {product.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {product.category}
              </span>
            )}
          </div>

          {/* 価格 */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.alert_price && (
              <span className="text-xs text-gray-400">
                目標: {formatPrice(product.alert_price)}
              </span>
            )}
          </div>

          {/* フッター */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              更新: {getElapsedTime(product.fetched_at)}
            </span>
            <div className="flex gap-2">
              {product.rakuten_url && (
                <a
                  href={product.rakuten_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  楽天で見る
                </a>
              )}
              <button
                onClick={() => {
                  if (confirm('この商品を削除しますか？')) {
                    onDelete(product.id)
                  }
                }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
