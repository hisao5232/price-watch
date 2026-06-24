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

  // 商品一覧を取得
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (e) {
      setError('商品一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 商品削除
  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {
      alert('削除に失敗しました')
    }
  }

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
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* 件数表示 */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-3">
            追跡中: {products.length}件
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

        {/* 商品一覧 */}
        <div className="flex flex-col gap-3">
          {products.map(product => (
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
