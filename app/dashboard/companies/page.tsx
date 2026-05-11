import Link from 'next/link'
import { Building2, ChevronRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CompanySetup } from '@/components/dashboard/company-setup'
import { CreateCompanyDialog } from '@/components/dashboard/create-company-dialog'

interface Company {
  id: string
  name: string
}

interface CompanyMemberRow {
  role: 'owner' | 'admin' | 'member'
  companies: Company | Company[] | null
}

function getCompany(row: CompanyMemberRow) {
  return Array.isArray(row.companies) ? row.companies[0] : row.companies
}

function canCreateCompany(memberships: CompanyMemberRow[]) {
  return (
    memberships.length === 0 ||
    memberships.some((membership) =>
      membership.role === 'owner' || membership.role === 'admin',
    )
  )
}

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('company_members')
    .select('role, companies(id, name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const memberships = ((data || []) as CompanyMemberRow[])
    .map((membership) => ({
      ...membership,
      companies: getCompany(membership),
    }))
    .filter((membership): membership is CompanyMemberRow & { companies: Company } =>
      Boolean(membership.companies),
    )

  const userCanCreateCompany = canCreateCompany(memberships)

  if (memberships.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center">
        <CompanySetup />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Select company</h1>
            <p className="text-muted-foreground">
              Choose the company workspace you want to open.
            </p>
          </div>
        </div>
        {userCanCreateCompany && <CreateCompanyDialog />}
      </div>

      {!userCanCreateCompany && (
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Your role can access assigned companies, but only owners and admins can create new ones.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {memberships.map((membership) => (
          <Card key={membership.companies.id} className="transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{membership.companies.name}</CardTitle>
                  <CardDescription>Open financial dashboard</CardDescription>
                </div>
                <Badge variant={membership.role === 'member' ? 'secondary' : 'default'}>
                  {membership.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full justify-between">
                <Link href={`/dashboard?company=${membership.companies.id}`}>
                  Open company
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
