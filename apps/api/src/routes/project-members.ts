import { de, inviteMemberSchema, updateMemberSchema } from '@litbase/shared'
import { Hono } from 'hono'
import { isAdminEmail } from '../auth/access'
import { isEmailDomainAllowed, listActiveDomains } from '../auth/domains'
import { invitationEmail } from '../auth/emails'
import { sendMail } from '../auth/mailer'
import { env } from '../env'
import { validate } from '../lib/validate'
import { findProject } from '../projects/access'
import {
  addMember,
  findMember,
  findUserByEmail,
  listMembers,
  memberByEmail,
  removeMember,
  toMember,
  updateMemberRole,
} from '../projects/members'
import type { AppEnv } from '../types'
import { ownerOnly } from './projects'

const notFound = { error: de.errors.projectNotFound }
const home = () => env.BASE_URL.replace(/\/$/, '')

/** Teilen eines Projekts (gemountet unter `/api/projects/:id/members`, nur Modus `multi`). */
export const projectMemberRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    return c.json(await listMembers(project))
  })
  .post('/', validate('json', inviteMemberSchema), async (c) => {
    if (env.AUTH_MODE !== 'multi') return c.json({ error: de.errors.sharingSingleMode }, 400)
    const me = c.var.user
    const project = await findProject(me.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    if (project.role !== 'owner') return c.json(ownerOnly, 403)
    const { email, role } = c.req.valid('json')

    // Wie bei der Registrierung: nur Adressen freigegebener Institutionen.
    if (!isAdminEmail(email) && !(await isEmailDomainAllowed(email))) {
      const domains = (await listActiveDomains()).map((d) => d.domain)
      return c.json({ error: de.sharing.domainNotAllowed(domains), code: 'DOMAIN_NOT_ALLOWED' }, 400)
    }
    if (email === me.email.toLowerCase()) return c.json({ error: de.errors.inviteSelf }, 400)
    if (await memberByEmail(project.id, email)) return c.json({ error: de.errors.memberExists }, 409)

    const existing = await findUserByEmail(email)
    const member = await addMember({ projectId: project.id, email, role, userId: existing?.id ?? null, invitedBy: me.id })
    const url = existing
      ? `${home()}/projects/${project.id}`
      : `${home()}/login?mode=signup&email=${encodeURIComponent(email)}`
    let mailSent = true
    try {
      await sendMail({
        to: email,
        ...invitationEmail({ inviter: me.name, projectName: project.name, role, recipientName: existing?.name, url }),
      })
    } catch {
      mailSent = false
    }
    return c.json({ member: toMember(member, existing?.name ?? null), mailSent }, 201)
  })
  .patch('/:memberId', validate('json', updateMemberSchema), async (c) => {
    const project = await findProject(c.var.user.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    if (project.role !== 'owner') return c.json(ownerOnly, 403)
    const member = await findMember(project.id, c.req.param('memberId'))
    if (!member) return c.json({ error: de.errors.memberNotFound }, 404)
    const updated = await updateMemberRole(member.id, c.req.valid('json').role)
    return c.json(toMember(updated, null))
  })
  /** Besitzer:in entfernt jemanden – oder man verlässt das Projekt selbst. */
  .delete('/:memberId', async (c) => {
    const me = c.var.user
    const project = await findProject(me.id, c.req.param('id')!)
    if (!project) return c.json(notFound, 404)
    const member = await findMember(project.id, c.req.param('memberId'))
    if (!member) return c.json({ error: de.errors.memberNotFound }, 404)
    if (project.role !== 'owner' && member.userId !== me.id) return c.json(ownerOnly, 403)
    await removeMember(member.id)
    return c.body(null, 204)
  })
