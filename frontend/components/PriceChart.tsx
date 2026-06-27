'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PriceHistory } from '@/lib/types'

type Props = {
  history: PriceHistory[]
}

// ツールチップのカスタマイズ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 text-xs">
        <p className="text-gray-500">{label}</p>
        <p className="font-bold text-gray-900">
          ¥{payload[0].value.toLocaleString()}
        </p>
        {payload[0].payload.in_stock === 0 && (
          <p className="text-red-400">在庫なし</p>
        )}
        {payload[0].payload.is_sale === 1 && (
          <p className="text-orange-500">🔥 セール中</p>
        )}
      </div>
    )
  }
  return null
}

export default function PriceChart({ history }: Props) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        グラフを表示するには2件以上の履歴が必要です
      </div>
    )
  }

  // 履歴は新しい順で来るので古い順に並び替える
  const chartData = [...history].reverse().map(h => {
    const d = new Date(h.fetched_at + 'Z')
    const label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    return {
      label,
      price: h.price,
      in_stock: h.in_stock,
      is_sale: h.is_sale,
    }
  })

  // Y軸の範囲を価格に合わせて調整（上下に余白を追加）
  const prices = chartData.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = Math.max((maxPrice - minPrice) * 0.1, 100)
  const yMin = Math.floor((minPrice - padding) / 100) * 100
  const yMax = Math.ceil((maxPrice + padding) / 100) * 100

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          interval="preserveStartEnd"  // 最初と最後だけラベル表示
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `¥${v.toLocaleString()}`}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
