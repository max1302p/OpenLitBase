import type { Project } from '@litbase/shared'
import { Label } from '@litbase/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@litbase/ui/components/select'

interface ProjectSelectProps {
  projects: Project[]
  value: string | undefined
  onChange: (id: string) => void
  label: string
  placeholder: string
}

/** Projektauswahl für Add-in und Extension. */
export function ProjectSelect({ projects, value, onChange, label, placeholder }: ProjectSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="project">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="project" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
