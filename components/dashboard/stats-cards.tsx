import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'

interface StatsCardsProps {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  monthIncome: number
  monthExpenses: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function StatsCards({
  totalIncome,
  totalExpenses,
  netProfit,
  monthIncome,
  monthExpenses,
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalIncome),
      description: 'All-time income',
      icon: DollarSign,
      trend: 'up' as const,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      description: 'All-time spending',
      icon: Wallet,
      trend: 'down' as const,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(netProfit),
      description: 'Revenue minus expenses',
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      trend: netProfit >= 0 ? ('up' as const) : ('down' as const),
    },
    {
      title: 'This Month',
      value: formatCurrency(monthIncome - monthExpenses),
      description: `${formatCurrency(monthIncome)} in, ${formatCurrency(monthExpenses)} out`,
      icon: TrendingUp,
      trend: monthIncome - monthExpenses >= 0 ? ('up' as const) : ('down' as const),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon
              className={`h-4 w-4 ${
                stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
