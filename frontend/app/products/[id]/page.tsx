'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getProductDetail } from '@/lib/api'
import type { ProductDetail } from '@/lib/types'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getProductDetail(id)
        setDetail(data)
      } catch {
        setError('商品情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  // 価格フォーマット
  const formatPrice = (price: number) => `¥${price.toLocaleString()}`

  // 日時フォーマット
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'Z')
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // 価格の最高値・最安値を計算
  const maxPrice = detail ? Math.max(...detail.history.map(h => h.price)) : 0
  const minPrice = detail ? Math.min(...detail.history.map(h => h.price)) : 0

  // 現在価格・在庫は最新の履歴から取る
  const latestHistory = detail?.history[0]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900">商品詳細</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* ローディング */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {detail && (
          <div className="flex flex-col gap-4">

            {/* 商品情報カード */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex gap-3">
                {detail.product.image_url ? (
                  <Image
                    src={detail.product.image_url}
                    alt={detail.product.item_name}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium text-gray-800 line-clamp-3">
                    {detail.product.item_name}
                  </h2>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {latestHistory?.in_stock === 1 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">在庫あり</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">在庫なし</span>
                    )}
                    {latestHistory?.is_sale === 1 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔥 セール中</span>
                    )}
                    {latestHistory?.point_rate && latestHistory.point_rate > 1 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        P{latestHistory.point_rate}倍
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatPrice(latestHistory?.price ?? 0)}
                  </p>

                  {detail.product.rakuten_url && (
                    <a
                      href={detail.product.rakuten_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      楽天で見る →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 価格サマリー */}
            {detail.history.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">価格サマリー</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-400">現在</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatPrice(latestHistory?.price ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">最安値</p>
                    <p className="text-base font-bold text-blue-600">
                      {formatPrice(minPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">最高値</p>
                    <p className="text-base font-bold text-gray-500">
                      {formatPrice(maxPrice)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 価格履歴テーブル */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                価格履歴（直近{detail.history.length}件）
              </h3>
              {detail.history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">履歴がありません</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs text-gray-400 pb-2">日時</th>
                        <th className="text-right text-xs text-gray-400 pb-2">価格</th>
                        <th className="text-center text-xs text-gray-400 pb-2">在庫</th>
                        <th className="text-center text-xs text-gray-400 pb-2">P倍率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.history.map((h, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 text-xs text-gray-500">
                            {formatDate(h.fetched_at)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-800">
                            {formatPrice(h.price)}
                            {/* 前回より値下がりしたら矢印表示 */}
                            {i < detail.history.length - 1 && h.price < detail.history[i + 1].price && (
                              <span className="text-blue-500 ml-1">↓</span>
                            )}
                            {i < detail.history.length - 1 && h.price > detail.history[i + 1].price && (
                              <span className="text-red-400 ml-1">↑</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {h.in_stock === 1
                              ? <span className="text-green-500 text-xs">あり</span>
                              : <span className="text-red-400 text-xs">なし</span>
                            }
                          </td>
                          <td className="py-2 text-center text-xs text-gray-500">
                            {h.point_rate}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
