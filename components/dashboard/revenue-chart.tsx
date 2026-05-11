'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  category: string
  description: string | null
}

interface RevenueChartProps {
  transactions: Transaction[]
  className?: string
}

export function RevenueChart({ transactions, className }: RevenueChartProps) {
  // Get last 6 months of data
  const months: { [key: string]: { income: number; expenses: number } } = {}
  
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    months[key] = { income: 0, expenses: 0 }
  }

  transactions.forEach((t) => {
    const date = new Date(t.date)
    const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (months[key]) {
      if (t.type === 'income') {
        months[key].income += Number(t.amount)
      } else {
        months[key].expenses += Number(t.amount)
      }
    }
  })

  const chartData = Object.entries(months).map(([month, data]) => ({
    month,
    income: data.income,
    expenses: data.expenses,
  }))

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Income vs expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(value)
                }
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(142, 76%, 36%)"
                fill="url(#incomeGradient)"
                strokeWidth={2}
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(0, 84%, 60%)"
                fill="url(#expenseGradient)"
                strokeWidth={2}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
