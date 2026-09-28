import { SidebarMenuButton, SidebarMenuItem } from '@litbase/ui/components/sidebar'
import type { LucideIcon } from 'lucide-react'
import { isValidElement, type ReactElement } from 'react'
import { NavLink } from 'react-router'

interface NavLinkButtonProps {
  to: string
  label: string
  /** Lucide-Icon oder ein eigenes Element (z. B. Projekt-Avatar). */
  icon: LucideIcon | ReactElement
  end?: boolean
}

export function NavLinkButton({ to, label, icon, end }: NavLinkButtonProps) {
  const Icon = icon as LucideIcon

  return (
    <SidebarMenuItem>
      <NavLink to={to} end={end}>
        {({ isActive }) => (
          <SidebarMenuButton isActive={isActive} tooltip={label}>
            {isValidElement(icon) ? icon : <Icon />}
            <span>{label}</span>
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  )
}
