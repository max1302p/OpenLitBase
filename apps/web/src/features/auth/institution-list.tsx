import { de } from '@litbase/shared'
import { useQuery } from '@tanstack/react-query'
import { InstitutionLogo } from '@litbase/ui/components/institution-logo'
import { api } from '@/lib/api'

/** „Verfügbar für: …“ mit den Logos der freigegebenen Institutionen. */
export function InstitutionList() {
  const institutions = useQuery({ queryKey: ['institutions'], queryFn: api.listInstitutions })
  const list = institutions.data ?? []

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{de.auth.availableFor}</p>
      {institutions.isSuccess && list.length === 0 && (
        <p className="text-sm text-muted-foreground">{de.auth.noInstitutions}</p>
      )}
      <ul className="flex flex-wrap justify-center gap-4">
        {list.map((institution) => (
          <li key={institution.id} className="flex items-center gap-2 text-sm" title={`@${institution.domain}`}>
            <InstitutionLogo name={institution.name} logoUrl={institution.logoUrl} />
            <span>{institution.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
