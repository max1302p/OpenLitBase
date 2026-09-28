import type { AddByIdentifier, CreateItem, UpdateItem } from '@litbase/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-client'

export function useItems(projectId?: string) {
  return useQuery({ queryKey: queryKeys.itemList(projectId), queryFn: () => api.listItems(projectId) })
}

export function useItem(id: string) {
  return useQuery({ queryKey: queryKeys.item(id), queryFn: () => api.getItem(id) })
}

export function useFormattedItem(id: string, styleId: string | undefined, projectId: string) {
  return useQuery({
    queryKey: queryKeys.formatted(id, styleId ?? projectId),
    queryFn: () => api.getFormattedItem(id, { styleId, projectId }),
  })
}

/** Alles unter `items` (Listen, Details, Vorschauen, Literaturverzeichnisse) neu laden. */
function useInvalidateItems() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.items })
}

export function useAddByIdentifier() {
  const onSuccess = useInvalidateItems()
  return useMutation({ mutationFn: (input: AddByIdentifier) => api.addByIdentifier(input), onSuccess })
}

export function useCreateItem() {
  const onSuccess = useInvalidateItems()
  return useMutation({ mutationFn: (input: CreateItem) => api.createItem(input), onSuccess })
}

export function useUpdateItem(id: string) {
  const onSuccess = useInvalidateItems()
  return useMutation({ mutationFn: (input: UpdateItem) => api.updateItem(id, input), onSuccess })
}

export function useUploadAttachment(itemId: string) {
  const onSuccess = useInvalidateItems()
  return useMutation({ mutationFn: (file: File) => api.uploadAttachment(itemId, file), onSuccess })
}

export function useDeleteAttachment() {
  const onSuccess = useInvalidateItems()
  return useMutation({ mutationFn: (id: string) => api.deleteAttachment(id), onSuccess })
}

export function useProjectMembership() {
  const onSuccess = useInvalidateItems()
  const add = useMutation({
    mutationFn: ({ projectId, itemIds }: { projectId: string; itemIds: string[] }) =>
      api.addItemsToProject(projectId, itemIds),
    onSuccess,
  })
  const remove = useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: string; itemId: string }) =>
      api.removeItemFromProject(projectId, itemId),
    onSuccess,
  })
  return { add, remove }
}
