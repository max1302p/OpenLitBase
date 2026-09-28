import { z } from 'zod'
import { DEFAULT_AVATAR_URL, setAvatarBase } from './avatar'
import {
  addByIdentifierResultSchema,
  adminDomainSchema,
  adminUserSchema,
  apiTokenSchema,
  createdApiTokenSchema,
  institutionSchema,
  bibliographySchema,
  citationStyleSchema,
  configSchema,
  updateStatusSchema,
  termMatrixDataSchema,
  itemProtocolSchema,
  protocolSchema,
  projectMembersSchema,
  projectMemberSchema,
  formattedDocumentSchema,
  importResultSchema,
  itemSchema,
  meSchema,
  projectSchema,
  settingsSchema,
  type AddByIdentifier,
  type BibliographyExportFormat,
  type CreateApiToken,
  type DomainInput,
  type UpdateDomain,
  type CreateItem,
  type CreateProject,
  type ExportFormat,
  type InviteMember,
  type UpdateMember,
  type TermMatrixData,
  type TermMatrixExportFormat,
  type ItemProtocol,
  type ProtocolExportFormat,
  type FormatDocumentInput,
  type ImportInput,
  type Settings,
  type UpdateItem,
  type UpdateProject,
} from './schemas'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiClientOptions {
  /** Leer für dieselbe Origin (Web-App), sonst z. B. `http://localhost:1450`. */
  baseUrl: string
  /** Persönlicher API-Token (Extension, Add-in im Multi-Modus). */
  token?: string
  /** Cookies mitschicken (Default). Die Extension arbeitet nur mit Token → `omit`. */
  credentials?: 'include' | 'omit' | 'same-origin'
}

const noContent = z.null()

export function createApiClient({ baseUrl, token, credentials = 'include' }: ApiClientOptions) {
  const root = baseUrl.replace(/\/$/, '')

  async function send(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const res = await fetch(`${root}${path}`, { ...init, headers, credentials })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      throw new ApiError(res.status, body?.error ?? res.statusText)
    }
    return res
  }

  async function request<T extends z.ZodType>(schema: T, path: string, init?: RequestInit): Promise<z.infer<T>> {
    const res = await send(path, init)
    return schema.parse(res.status === 204 ? null : await res.json())
  }

  const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })
  const query = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])
    return search.size > 0 ? `?${search}` : ''
  }

  return {
    getConfig: async () => {
      const config = await request(configSchema, '/api/config')
      setAvatarBase(config.avatarUrl ?? DEFAULT_AVATAR_URL)
      return config
    },
    /** Update-Hinweis (Admins bzw. im Modus "single"); 403 für alle anderen. */
    getUpdateStatus: () => request(updateStatusSchema, '/api/me/update'),
    getMe: () => request(meSchema, '/api/me'),
    /** Eigenes Konto endgültig löschen (nur Modus "multi", mit Passwort). */
    deleteAccount: (password: string) => request(noContent, '/api/me', json('DELETE', { password })),
    listInstitutions: () => request(institutionSchema.array(), '/api/institutions'),

    listTokens: () => request(apiTokenSchema.array(), '/api/tokens'),
    createToken: (input: CreateApiToken) => request(createdApiTokenSchema, '/api/tokens', json('POST', input)),
    deleteToken: (id: string) => request(noContent, `/api/tokens/${id}`, { method: 'DELETE' }),

    listProjects: () => request(projectSchema.array(), '/api/projects'),
    createProject: (input: CreateProject) => request(projectSchema, '/api/projects', json('POST', input)),
    updateProject: (id: string, input: UpdateProject) =>
      request(projectSchema, `/api/projects/${id}`, json('PATCH', input)),
    deleteProject: (id: string) => request(noContent, `/api/projects/${id}`, { method: 'DELETE' }),
    addItemsToProject: (id: string, itemIds: string[]) =>
      request(noContent, `/api/projects/${id}/items`, json('POST', { itemIds })),
    removeItemFromProject: (id: string, itemId: string) =>
      request(noContent, `/api/projects/${id}/items/${itemId}`, { method: 'DELETE' }),
    listMembers: (id: string) => request(projectMembersSchema, `/api/projects/${id}/members`),
    inviteMember: (id: string, input: InviteMember) =>
      request(z.object({ member: projectMemberSchema, mailSent: z.boolean() }), `/api/projects/${id}/members`, json('POST', input)),
    updateMember: (id: string, memberId: string, input: UpdateMember) =>
      request(projectMemberSchema, `/api/projects/${id}/members/${memberId}`, json('PATCH', input)),
    removeMember: (id: string, memberId: string) =>
      request(noContent, `/api/projects/${id}/members/${memberId}`, { method: 'DELETE' }),
    getBibliography: (id: string) => request(bibliographySchema, `/api/projects/${id}/bibliography`),
    formatDocument: (id: string, input: FormatDocumentInput) =>
      request(formattedDocumentSchema, `/api/projects/${id}/format-document`, json('POST', input)),

    listItems: (projectId?: string) => request(itemSchema.array(), `/api/items${query({ projectId })}`),
    getItem: (id: string) => request(itemSchema, `/api/items/${id}`),
    createItem: (input: CreateItem) => request(itemSchema, '/api/items', json('POST', input)),
    addByIdentifier: (input: AddByIdentifier) =>
      request(addByIdentifierResultSchema, '/api/items/identifier', json('POST', input)),
    updateItem: (id: string, input: UpdateItem) => request(itemSchema, `/api/items/${id}`, json('PATCH', input)),
    deleteItem: (id: string) => request(noContent, `/api/items/${id}`, { method: 'DELETE' }),
    getFormattedItem: (id: string, params: { styleId?: string; projectId?: string } = {}) =>
      request(bibliographySchema, `/api/items/${id}/formatted${query(params)}`),
    uploadAttachment: (itemId: string, file: File) => {
      const body = new FormData()
      body.append('file', file)
      return request(itemSchema, `/api/items/${itemId}/attachments`, { method: 'POST', body })
    },
    deleteAttachment: (id: string) => request(noContent, `/api/attachments/${id}`, { method: 'DELETE' }),

    getProtocol: (projectId: string) => request(protocolSchema, `/api/projects/${projectId}/protocol`),
    saveItemProtocol: (projectId: string, itemId: string, protocol: ItemProtocol) =>
      request(itemProtocolSchema, `/api/projects/${projectId}/items/${itemId}/protocol`, json('PUT', protocol)),
    getTermMatrix: (projectId: string) => request(termMatrixDataSchema, `/api/projects/${projectId}/term-matrix`),
    saveTermMatrix: (projectId: string, data: TermMatrixData) =>
      request(termMatrixDataSchema, `/api/projects/${projectId}/term-matrix`, json('PUT', data)),

    importItems: (input: ImportInput) => request(importResultSchema, '/api/import', json('POST', input)),
    importZip: (file: File, projectId: string) => {
      const body = new FormData()
      body.append('file', file)
      body.append('projectId', projectId)
      return request(importResultSchema, '/api/import/zip', { method: 'POST', body })
    },

    listStyles: () => request(citationStyleSchema.array(), '/api/styles'),
    getSettings: () => request(settingsSchema, '/api/settings'),
    updateSettings: (input: Settings) => request(settingsSchema, '/api/settings', json('PUT', input)),

    admin: {
      listDomains: () => request(adminDomainSchema.array(), '/api/admin/domains'),
      createDomain: (input: DomainInput) => request(adminDomainSchema, '/api/admin/domains', json('POST', input)),
      updateDomain: (id: string, input: UpdateDomain) =>
        request(adminDomainSchema, `/api/admin/domains/${id}`, json('PATCH', input)),
      deleteDomain: (id: string) => request(noContent, `/api/admin/domains/${id}`, { method: 'DELETE' }),
      uploadLogo: (id: string, file: File) => {
        const body = new FormData()
        body.append('file', file)
        return request(adminDomainSchema, `/api/admin/domains/${id}/logo`, { method: 'POST', body })
      },
      deleteLogo: (id: string) => request(adminDomainSchema, `/api/admin/domains/${id}/logo`, { method: 'DELETE' }),
      listUsers: () => request(adminUserSchema.array(), '/api/admin/users'),
    },

    /** URLs für Downloads/Links (Cookies bzw. gleiche Origin nötig). */
    urls: {
      attachment: (id: string) => `${root}/api/attachments/${id}`,
      /** Logo-Pfade der API (z. B. `/api/institutions/…/logo?v=…`) für <img> auflösen. */
      apiPath: (path: string) => `${root}${path}`,
      export: (format: ExportFormat, projectId?: string) => `${root}/api/export${query({ format, projectId })}`,
      bibliographyExport: (projectId: string, format: BibliographyExportFormat) =>
        `${root}/api/projects/${projectId}/bibliography/export${query({ format })}`,
      protocolExport: (projectId: string, format: ProtocolExportFormat) =>
        `${root}/api/projects/${projectId}/protocol/export${query({ format })}`,
      termMatrixExport: (projectId: string, format: TermMatrixExportFormat, rows?: string[]) =>
        `${root}/api/projects/${projectId}/term-matrix/export${query({ format, rows: rows?.join(',') })}`,
    },
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
