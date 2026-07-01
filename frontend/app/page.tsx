'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getProducts, deleteProduct } from '@/lib/api'
import type { Product } from '@/lib/types'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 選択中のカテゴリタブ（nullは「すべて」）
  const [activeCategory, setActiveCategory] = useState<string>('すべて')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch {
      setError('商品一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('削除に失敗しました')
    }
  }

  // カテゴリ一覧を動的に生成
  // categoryがnullの商品は「未分類」として扱う
  const categories = [
    'すべて',
    // Setで重複を排除し、nullは「未分類」に変換
    ...Array.from(new Set(products.map(p => p.category ?? '未分類')))
  ]

  // 表示する商品を絞り込んで価格安い順にソート
  const filteredProducts = products
    .filter(p => {
      if (activeCategory === 'すべて') return true
      if (activeCategory === '未分類') return p.category === null
      return p.category === activeCategory
    })
    // price が null の場合は最後尾に並べる
    .sort((a, b) => {
      if (a.price === null) return 1
      if (b.price === null) return -1
      return a.price - b.price
    })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">📦 price-watch</h1>
          <Link
            href="/add"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 商品追加
          </Link>
        </div>

        {/* カテゴリタブ（商品が1件以上あるときだけ表示） */}
        {!loading && products.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}
              >
                {category}
                {/* タブにその件数を表示 */}
                <span className="ml-1 opacity-70">
                  ({category === 'すべて'
                    ? products.length
                    : products.filter(p =>
                        category === '未分類'
                          ? p.category === null
                          : p.category === category
                      ).length
                  })
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* 件数表示 */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-3">
            {activeCategory === 'すべて' ? '追跡中' : activeCategory}: {filteredProducts.length}件
          </p>
        )}

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

        {/* 商品なし */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">追跡中の商品がありません</p>
            <Link href="/add" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              商品を追加する
            </Link>
          </div>
        )}

        {/* 商品一覧（絞り込み済み・価格安い順） */}
        <div className="flex flex-col gap-3">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
