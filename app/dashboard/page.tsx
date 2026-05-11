import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { ExpensesByCategory } from '@/components/dashboard/expenses-by-category'
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog'
import { CompanySwitcher } from '@/components/dashboard/company-switcher'
import { CreateCompanyDialog } from '@/components/dashboard/create-company-dialog'

interface DashboardPageProps {
  searchParams?: Promise<{
    company?: string
  }>
}

interface Company {
  id: string
  name: string
}

interface CompanyMemberRow {
  role: 'owner' | 'admin' | 'member'
  companies: Company | Company[] | null
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const selectedCompanyId = params?.company

  if (!selectedCompanyId) {
    redirect('/dashboard/companies')
  }

  // Get companies the user belongs to through the many-to-many membership table.
  const { data: companyMemberships } = await supabase
    .from('company_members')
    .select('role, companies(id, name)')
    .eq('user_id', user!.id)

  const memberships = ((companyMemberships || []) as CompanyMemberRow[])
    .map((membership) => ({
      ...membership,
      companies: Array.isArray(membership.companies)
        ? membership.companies[0]
        : membership.companies,
    }))
    .filter((membership): membership is CompanyMemberRow & { companies: Company } =>
      Boolean(membership.companies),
    )

  const companies = memberships.map((membership) => membership.companies)
  const canCreateCompany =
    memberships.length === 0 ||
    memberships.some((membership) =>
      membership.role === 'owner' || membership.role === 'admin',
    )

  const company = companies.find((item) => item.id === selectedCompanyId)

  if (!company) {
    redirect('/dashboard/companies')
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">Financial overview and insights</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompanySwitcher companies={companies} activeCompanyId={company.id} />
          {canCreateCompany && <CreateCompanyDialog />}
          <AddTransactionDialog companyId={company.id} userId={user!.id} />
        </div>
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
