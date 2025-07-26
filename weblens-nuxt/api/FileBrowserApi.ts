import API_ENDPOINT from './ApiEndpoint.js'
import type WeblensFile from '~/types/weblensFile'
import { useUserStore } from '~/stores/user.js'
import useLocationStore, { FbModeT } from '~/stores/location.js'
import { WsAction, WsSubscriptionType } from '~/types/websocket.js'
import { useWeblensApi } from './AllApi.js'
import useFilesStore from '~/stores/files.js'
import { FilesApiAxiosParamCreator, type FolderInfo } from '@ethanrous/weblens-api'

export function SubToFolder(subId: string, shareId: string) {
    if (!subId) {
        console.warn('Trying to subscribe to folder with no subscription id')
        return
    } else if (subId === 'shared') {
        return
    }

    useWebsocketStore().send({
        action: WsAction.Subscribe,
        subscriptionType: WsSubscriptionType.Folder,
        subscribeKey: subId,
        content: {
            shareId: shareId,
        },
    })
}

export function SubToTask(taskId: string, lookingFor: string[]) {
    useWebsocketStore().send({
        action: WsAction.Subscribe,
        subscriptionType: WsSubscriptionType.Task,
        subscribeKey: taskId,
        content: {
            lookingFor: lookingFor,
        },
    })
}

export function ScanDirectory(directory: WeblensFile) {
    const shareId = useLocationStore().shareId

    useWebsocketStore().send({
        action: WsAction.ScanDirectory,
        content: { folderId: directory.Id(), shareId: shareId },
    })
}

export function CancelTask(taskId: string) {
    useWebsocketStore().send({ action: WsAction.CancelTask, content: { taskId: taskId } })
}

export function UnsubFromFolder(subId: string) {
    console.log('Unsubscribing from folder:', subId)
    if (!subId || useWebsocketStore().status !== 'OPEN') {
        return
    }

    useWebsocketStore().send({
        action: WsAction.Unsubscribe,
        subscribeKey: subId,
    })
}

export async function GetTrashChildIds(): Promise<string[]> {
    const { data: folder } = await useWeblensApi().FoldersApi.getFolder(useUserStore().user.trashId)

    if (!folder || !folder.children) {
        console.error('No children found in trash folder')
        return []
    }

    const childIds = folder.children.map((file) => file.id).filter((id) => id !== undefined)

    return childIds
}

export async function GetFolderData(
    folderId: string,
    fbMode: FbModeT,
    shareId?: string,
    viewingTime?: Date,
): Promise<FolderInfo> {
    if (fbMode === FbModeT.share && !shareId) {
        const res = await useWeblensApi().FilesApi.getSharedFiles()
        return res.data
    }

    if (fbMode === FbModeT.external) {
        console.error('External files not implemented')
    }

    if (folderId === '') {
        throw new Error('Folder ID cannot be empty')
    }

    const res = await useWeblensApi().FoldersApi.getFolder(
        folderId,
        shareId ? shareId : undefined,
        viewingTime?.getTime(),
        {
            withCredentials: true,
        },
    )
    return res.data
}

export type AllowedDownloadFormats = 'webp' | 'jpeg' | 'zip'

export async function downloadSingleFile(
    fileId: string,
    filename: string,
    shareId: string,
    format?: AllowedDownloadFormats,
) {
    const a = document.createElement('a')
    const paramCreator = FilesApiAxiosParamCreator()
    const args = await paramCreator.downloadFile(
        fileId,
        shareId,
        format ? `image/${format}` : undefined,
        format === 'zip',
    )
    const url = API_ENDPOINT + args.url

    if (format === 'zip') {
        filename = 'weblens_download_' + filename
    } else if (format) {
        filename = filename.split('.').slice(0, -1).join('.') + '.' + format
    }

    a.href = url
    a.download = filename
    a.click()
}

export async function moveFiles(target: WeblensFile) {
    const filesStore = useFilesStore()

    const selectedIds = [...filesStore.selectedFiles]

    filesStore.setMovedFile(selectedIds, true)

    filesStore.setDragging(false)

    await useWeblensApi().FilesApi.moveFiles(
        {
            fileIds: selectedIds,
            newParentId: target.Id(),
        },
        useLocationStore().shareId,
    )
}
