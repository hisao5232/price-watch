'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addProduct } from '@/lib/api'

export default function AddPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    // 楽天URLのバリデーション
    if (!url.includes('item.rakuten.co.jp')) {
      setError('楽天市場の商品URLを入力してください')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await addProduct({
        rakutenUrl: url,
        category: category || undefined,
        alertPrice: alertPrice ? Number(alertPrice) : undefined,
      })
      router.push('/')
    } catch (e: any) {
      setError(e.message ?? '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900">商品を追加</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col gap-4">

            {/* 楽天URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                楽天市場の商品URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://item.rakuten.co.jp/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ（任意）
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="例: サッカー用品、スニーカー"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 目標価格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標価格（任意）
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                <input
                  type="number"
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  placeholder="この金額以下になったら通知"
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                設定した価格以下になるとDiscordに通知されます
              </p>
            </div>

            {/* エラー */}
            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* 登録ボタン */}
            <button
              onClick={handleSubmit}
              disabled={loading || !url}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '検索中...' : '商品を登録する'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
