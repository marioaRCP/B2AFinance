import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { ExpensesByCategory } from '@/components/dashboard/expenses-by-category'
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog'
import { CompanySetup } from '@/components/dashboard/company-setup'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's company
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user!.id)
    .limit(1)

  const company = companies?.[0]

  // If no company, show setup
  if (!company) {
    return <CompanySetup userId={user!.id} />
  }

  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('company_id', company.id)
    .order('date', { ascending: false })

  const allTransactions = transactions || []

  // Calculate stats
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netProfit = totalIncome - totalExpenses

  // Get this month's transactions
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTransactions = allTransactions.filter(
    t => new Date(t.date) >= startOfMonth
  )

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">Financial overview and insights</p>
        </div>
        <AddTransactionDialog companyId={company.id} userId={user!.id} />
      </div>

      <StatsCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
        monthIncome={monthIncome}
        monthExpenses={monthExpenses}
      />

      <div className="grid gap-6 lg:grid-cols-7">
        <RevenueChart transactions={allTransactions} className="lg:col-span-4" />
        <ExpensesByCategory transactions={allTransactions} className="lg:col-span-3" />
      </div>

      <RecentTransactions transactions={allTransactions.slice(0, 10)} />
    </div>
  )
}
