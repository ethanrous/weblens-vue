import useFilesStore from '~/stores/files'
import WeblensFile from '~/types/weblensFile'
import { WsEvent, type WsMessage } from '~/types/websocket'

function handleModified(msg: WsMessage) {
    if (msg.content.fileInfo.id === useFilesStore().activeFolderId) {
        // const toRemove: string[] = []
        // for (const fileId of useFilesStore().children) {
        //     if (!msg.content.fileInfo.childrenIds.includes(fileId.Id())) {
        //         toRemove.push(fileId.Id())
        //     }
        // }
        //
        // useFilesStore().removeFiles(...toRemove)
        return
    }

    if (msg.content.fileInfo.parentId !== useFilesStore().activeFolderId) {
        useFilesStore().removeFiles(msg.content.fileInfo.id)
    } else {
        useFilesStore().addFile(msg.content.fileInfo)
    }
}

// function handleScanFileTask(msg: WsMessage) {
//     useTasksStore().upsertTask(msg.subscribeKey, msg.content.percentComplete, msg.content.targetName)
//     if (msg.content.fileInfo.parentId !== useFilesStore().activeFolderId) {
//         useFilesStore().removeFiles(msg.content.fileInfo.id)
//     } else {
//         useFilesStore().addFile(msg.content.fileInfo)
//     }
// }

export function handleWebsocketMessage(msg: WsMessage) {
    if (msg.error) {
        console.error('WebSocket error:', msg.error)
        return
    }

    console.debug('WebSocket message received:', msg)

    switch (msg.eventTag) {
        case WsEvent.FileCreatedEvent:
            useFilesStore().addFile(msg.content.fileInfo)
            break

        case WsEvent.FileUpdatedEvent:
            handleModified(msg)
            break

        case WsEvent.FileDeletedEvent:
            useFilesStore().removeFiles(msg.content.fileInfo.id)
            break

        case WsEvent.TaskCreatedEvent: {
            const targetFile = new WeblensFile({ portablePath: msg.content.filename, isDir: true })
            useTasksStore().upsertTask(msg.subscribeKey, { percentComplete: 0, target: targetFile })
            break
        }

        case WsEvent.FileScanStartedEvent:
        case WsEvent.FileScanCompleteEvent: {
            const targetFile = new WeblensFile({ portablePath: msg.content.filename, isDir: true })

            useTasksStore().upsertTask(msg.subscribeKey, {
                percentComplete: msg.content.percentProgress,
                target: targetFile,
            })
            break
        }

        case WsEvent.FolderScanCompleteEvent: {
            const targetFile = new WeblensFile({ portablePath: msg.content.filename, isDir: true })

            useTasksStore().upsertTask(msg.subscribeKey, {
                percentComplete: 100,
                target: targetFile,
                executionTime: msg.content.runtime,
            })
            break
        }
    }
}
