'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
}

interface CompanySwitcherProps {
  companies: Company[]
  activeCompanyId: string
}

export function CompanySwitcher({ companies, activeCompanyId }: CompanySwitcherProps) {
  const router = useRouter()

  return (
    <Select
      value={activeCompanyId}
      onValueChange={(companyId) => router.push(`/dashboard?company=${companyId}`)}
    >
      <SelectTrigger className="w-full sm:w-[240px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
