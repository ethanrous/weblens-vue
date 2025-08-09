import type { AxiosProgressEvent } from 'axios'

import type { FileUploadMetadata } from '~/types/uploadTypes'
import { useWeblensApi } from './AllApi'
import WeblensFile from '~/types/weblensFile.js'
import type { NewFileParams } from '@ethanrous/weblens-api'

const MAX_RETRIES = 5

type ChunkUploadContext = {
    soFar: number
    retriesRemaining: number
    chunkSize: number
}

async function pushChunkNew(
    serverUploadId: string,
    localUploadId: string,
    shareId: string,
    uploadMeta: FileUploadMetadata,
    chunkSize: number,
    chunkLowByte: number,
    chunkHighByte: number,
    remainingRetries: number,
): Promise<ChunkUploadContext> {
    if (useUploadStore().uploads.get(localUploadId)?.error) {
        throw new Error(`Upload ${localUploadId} cancelled. This shouldn't happen.`)
    }

    if (!uploadMeta.fileId) {
        throw new Error(`FileId falsy for upload: ${localUploadId}`)
    }

    if (!uploadMeta.file) {
        throw new Error(`File not found for upload: ${uploadMeta.parentId} ${uploadMeta.fileId}`)
    }

    const headers = {
        'Content-Range': `bytes=${chunkLowByte}-${chunkHighByte - 1}/${uploadMeta.file.size}`,
        'Content-Type': 'application/octet-stream',
    }

    try {
        const res = await useWeblensApi().FilesApi.uploadFileChunk(
            serverUploadId,
            uploadMeta.fileId,
            uploadMeta.file.slice(chunkLowByte, chunkHighByte) as File,
            shareId,
            {
                headers: headers,
                onUploadProgress: (e: AxiosProgressEvent) => {
                    useUploadStore().setUploadProgress(
                        localUploadId,
                        uploadMeta.fileId!,
                        chunkLowByte,
                        chunkHighByte - chunkLowByte,
                        e.loaded,
                    )
                },
            },
        )

        if (res.status !== 200) {
            throw new Error(
                `Failed to upload chunk starting at ${chunkLowByte} of ${uploadMeta.file.name}: ${res.status}`,
            )
        }

        useUploadStore().finishChunk(localUploadId, uploadMeta.fileId, chunkLowByte, chunkHighByte - chunkLowByte)
    } catch (err) {
        if (useUploadStore().uploads.get(localUploadId)?.error) {
            throw new Error(`Upload ${localUploadId} cancelled. This shouldn't happen.`)
        }

        if (remainingRetries === 0) {
            useUploadStore().failUpload(localUploadId, Error(String(err)))

            throw err
        }

        console.warn(
            `Retrying upload of ${uploadMeta.file.name} chunk starting at ${chunkLowByte} (${remainingRetries} retries remaining)`,
        )

        useUploadStore().resetChunk(localUploadId, uploadMeta.fileId!, chunkLowByte)

        return {
            soFar: chunkLowByte,
            retriesRemaining: remainingRetries - 1,
            chunkSize: Math.round(chunkSize / 2),
        }
    }

    return {
        soFar: chunkHighByte,
        retriesRemaining: Math.min(MAX_RETRIES, remainingRetries + 1),
        chunkSize: Math.min(chunkSize + chunkSize * 2, useUploadStore().uploadChunkSize),
    }
}

function queueChunksNew(
    uploadMeta: FileUploadMetadata,
    serverUploadId: string,
    localUploadId: string,
    shareId: string,
) {
    if (!uploadMeta.file) {
        throw new Error(`File not found for upload: ${uploadMeta.parentId} ${uploadMeta.fileId}`)
    }

    useUploadStore().uploadTaskQueue.runWithNext<ChunkUploadContext>({
        getNext: (ctx) => {
            if (ctx.soFar >= uploadMeta.file!.size) {
                return
            }

            const chunkSize = ctx.chunkSize
            const chunkHighByte =
                ctx.soFar + chunkSize >= uploadMeta.file!.size ? uploadMeta.file!.size : ctx.soFar + chunkSize

            return async () => {
                return pushChunkNew(
                    serverUploadId,
                    localUploadId,
                    shareId,
                    uploadMeta,
                    chunkSize,
                    ctx.soFar,
                    chunkHighByte,
                    ctx.retriesRemaining,
                )
            }
        },
        initCtx: {
            soFar: 0,
            retriesRemaining: MAX_RETRIES,
            chunkSize: useUploadStore().uploadChunkSize,
        },
        onFailure: (err) => {
            console.error(`Failed to upload chunk for ${uploadMeta.file?.name}:`, err)
            useUploadStore().failUpload(localUploadId, Error(String(err)))
        },
    })
}

async function tryUpload(
    filesMeta: FileUploadMetadata[],
    isPublic: boolean,
    shareId: string,
    serverUploadId: string,
    localUploadId: string,
) {
    try {
        await upload(filesMeta, isPublic, shareId, serverUploadId, localUploadId)
    } catch (err) {
        console.error(`Upload ${serverUploadId} / ${localUploadId} failed:`, err)
        useUploadStore().failUpload(serverUploadId, Error(String(err)))
    }
}

async function upload(
    filesMeta: FileUploadMetadata[],
    isPublic: boolean,
    shareId: string,
    serverUploadId: string,
    localUploadId: string,
) {
    if (isPublic && !shareId) {
        throw new Error('Cannot do public upload without shareId')
    }

    const metaPromises = filesMeta.map((meta) => {
        if (!meta.file && !meta.entry) {
            throw new Error('File and entry are both undefined for upload metadata')
        }

        new Promise((resolve, reject) => {
            if (!meta.file && !meta.entry!.isDirectory) {
                ;(<FileSystemFileEntry>meta.entry).file(
                    (f) => {
                        meta.file = f
                        resolve(meta)
                    },
                    (err) => {
                        console.error('Failed to get file from entry', err)
                        reject(err)
                    },
                )
            }
        })
    })

    await Promise.all(metaPromises)

    let count = 0
    while (filesMeta.findIndex((v) => !v.isDir && !v.file) !== -1 && count < 1000) {
        console.warn('Waiting for file objects to be resolved...')
        await new Promise((r) => setTimeout(r, 10))
        count++
    }

    if (count >= 1000) {
        console.error('Upload failed: timeout waiting for file objects')
        return
    }

    filesMeta = filesMeta.filter((meta) => meta.isDir || (meta.file && !meta.file.name.startsWith('.')))

    const newFiles: NewFileParams[] = filesMeta.map((v) => ({
        parentFolderId: v.parentId,
        newFileName: v.file?.name,
        fileSize: v.file?.size,
    }))

    const newFilesRes = await useWeblensApi().FilesApi.addFilesToUpload(serverUploadId, { newFiles: newFiles }, shareId)
    if (newFilesRes.status !== 201 || !newFilesRes.data.fileIds) {
        throw new Error('Failed to add files to upload' + newFilesRes.statusText + JSON.stringify(newFilesRes.data))
    }

    if (newFilesRes.data.fileIds.length !== newFiles.length) {
        throw new Error('Mismatched fileIds length in upload')
    }

    for (const [index, meta] of filesMeta.entries()) {
        if (meta.isDir) {
            throw new Error('Directories should not be in filesMeta at this point')
        }
        meta.fileId = newFilesRes.data.fileIds[index]

        queueChunksNew(meta, serverUploadId, localUploadId, shareId)
    }

    useUploadStore().addFilesToUpload(localUploadId, ...filesMeta)
}

function readAllFiles(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
    return new Promise((resolve) => {
        const allEntries: FileSystemEntry[] = []

        function readEntriesRecursively() {
            reader.readEntries((entries) => {
                if (entries.length === 0) {
                    // No more entries, resolve the promise with all entries
                    resolve(allEntries)
                } else {
                    // Add entries to the array and call readEntriesRecursively again
                    allEntries.push(...entries)
                    readEntriesRecursively()
                }
            })
        }

        readEntriesRecursively()
    })
}

const excludedFileNames = ['.DS_Store']

async function addDir(
    fsEntry: FileSystemEntry,
    uploadId: string,
    parentFolderId: string,
    rootFolderId: string,
    isPublic: boolean,
    shareId: string,
): Promise<FileUploadMetadata[]> {
    if (fsEntry.isDirectory) {
        const newDirRes = await useWeblensApi()
            .FilesApi.addFilesToUpload(
                uploadId,
                {
                    newFiles: [
                        {
                            isDir: true,
                            parentFolderId: parentFolderId,
                            newFileName: fsEntry.name,
                        },
                    ],
                },
                shareId,
            )
            .catch((err) => {
                console.error('Failed to add files to upload', err)
            })

        if (!newDirRes || !newDirRes.data.fileIds) {
            throw new Error('Failed to add directory to upload: response is undefined or has no fileIds')
        }

        const folderId = newDirRes.data.fileIds[0]
        if (!folderId) {
            return Promise.reject(new Error('Failed to create folder: no folderId'))
        }

        const allEntries = await readAllFiles((fsEntry as FileSystemDirectoryEntry).createReader())

        return (
            await Promise.all(
                allEntries.map((entry) => {
                    return addDir(entry, uploadId, folderId, rootFolderId, isPublic, shareId)
                }),
            )
        ).flat()
    } else {
        if (excludedFileNames.includes(fsEntry.name)) {
            return []
        }
        const e: FileUploadMetadata = {
            entry: fsEntry,
            uploadId: uploadId,
            parentId: parentFolderId,
            isDir: false,
            chunks: {},
            isTopLevel: parentFolderId === rootFolderId,
        }
        return [e]
    }
}

export async function HandleDrop(
    items: DataTransferItemList,
    rootFolderId: string,
    isPublic: boolean,
    shareId: string,
) {
    if (!items || items.length === 0) {
        console.error('No items to upload')
        return
    }

    const files = Array.from(items)
        .map((item) => item.webkitGetAsEntry())
        .filter((item) => item !== null)

    if (files.length === 0) {
        console.error('No valid files or directories to upload')
        return
    }

    const uploads = files.map((file) => {
        const localUploadId = window.crypto.randomUUID()

        return useUploadStore().startUpload({
            localUploadId: localUploadId,
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
        })
    })

    await useUploadStore().uploadTaskQueue.addTask(async () => {
        const res = await useWeblensApi()
            .FilesApi.startUpload(
                {
                    rootFolderId: rootFolderId,
                    chunkSize: 1, // TODO: remove this
                },
                shareId,
            )
            .catch((err) => {
                console.error('Failed to start upload:', err)
            })

        if (!res) {
            throw new Error('Failed to start upload: no response')
        }

        const uploadId = res.data.uploadId

        if (!uploadId) {
            throw new Error('Failed to start upload: no uploadId returned')
        }

        for (const [index, file] of files.entries()) {
            const upload = uploads[index]
            if (!upload) {
                console.error('No upload metadata found for file:', file.name)
                continue
            }

            useUploadStore().setServerUpload(upload.localUploadId, uploadId)

            try {
                const uploadFiles = await addDir(file, uploadId, rootFolderId, rootFolderId, isPublic, shareId)

                if (uploadFiles.length !== 0) {
                    await tryUpload(uploadFiles, isPublic, shareId, uploadId, upload.localUploadId)
                }
            } catch (err) {
                useUploadStore().failUpload(upload.localUploadId, Error(String(err)))
            }
        }
    })
}

export async function HandleFileSelect(files: FileList, rootFolderId: string, isPublic: boolean, shareId: string) {
    if (!files || files.length === 0) {
        console.error('No files selected for upload')
        return
    }

    const dirs: Map<string, WeblensFile> = new Map()
    const uploads: FileUploadMetadata[] = []

    for (const file of files) {
        let parentId: string = rootFolderId

        if (file.webkitRelativePath !== '') {
            const pathParts = file.webkitRelativePath.split('/')
            for (const [index, pathPart] of pathParts.slice(0, -1).entries()) {
                const dirPath = pathParts.slice(0, index + 1).join('/')
                const existingDir = dirs.get(dirPath)
                if (existingDir) {
                    parentId = existingDir.id
                    continue
                }

                let parentDirId: string | undefined = undefined
                if (index === 0) {
                    parentDirId = rootFolderId
                } else {
                    parentDirId = dirs.get(pathParts.slice(0, index).join('/'))?.id
                }

                if (!parentDirId) {
                    console.error('Parent directory not found for:', dirPath)
                    return
                }

                const createRes = await useWeblensApi().FoldersApi.createFolder({
                    parentFolderId: parentDirId,
                    newFolderName: pathPart,
                })

                const newDir = new WeblensFile(createRes.data)

                dirs.set(dirPath, newDir)
                parentId = newDir.id
            }
        }

        uploads.push({
            file: file,
            isDir: false,
            parentId: parentId,
            chunks: {},
            isTopLevel: parentId === rootFolderId,
            uploadId: '',
        })
    }

    if (dirs.size > 0) {
        const baseDirName = dirs.keys().find((dirPath) => {
            return !dirPath.includes('/')
        })
        if (!baseDirName) {
            console.error('No base directory found for uploads', dirs)
            return
        }

        const baseDir = dirs.get(baseDirName)
        const localUploadId = window.crypto.randomUUID()

        useUploadStore().startUpload({
            localUploadId,
            name: baseDir?.GetFilename(),
            type: 'folder',
        })

        await useUploadStore().uploadTaskQueue.addTask(async () => {
            const res = await useWeblensApi()
                .FilesApi.startUpload(
                    {
                        rootFolderId: rootFolderId,
                        chunkSize: 1, // TODO: remove this
                    },
                    shareId,
                )
                .catch((err) => {
                    console.error('Failed to start upload:', err)
                })

            if (!res) {
                throw new Error('Failed to start upload: no response')
            }

            const uploadId = res.data.uploadId

            if (!uploadId) {
                throw new Error('Failed to start upload: no uploadId returned')
            }

            try {
                await tryUpload(uploads, isPublic, shareId, uploadId, localUploadId)
            } catch (err) {
                useUploadStore().failUpload(localUploadId, Error(String(err)))
            }
        })
    } else {
        for (const upload of uploads) {
            const localUploadId = window.crypto.randomUUID()

            useUploadStore().startUpload({
                localUploadId: localUploadId,
                name: upload.file?.name || 'Unknown File',
                type: 'file',
            })

            await useUploadStore().uploadTaskQueue.addTask(async () => {
                const res = await useWeblensApi()
                    .FilesApi.startUpload(
                        {
                            rootFolderId: rootFolderId,
                            chunkSize: 1, // TODO: remove this
                        },
                        shareId,
                    )
                    .catch((err) => {
                        console.error('Failed to start upload:', err)
                    })

                if (!res) {
                    throw new Error('Failed to start upload: no response')
                }

                const uploadId = res.data.uploadId

                if (!uploadId) {
                    throw new Error('Failed to start upload: no uploadId returned')
                }

                try {
                    await tryUpload([upload], isPublic, shareId, uploadId, localUploadId)
                } catch (err) {
                    useUploadStore().failUpload(localUploadId, Error(String(err)))
                }
            })
        }
    }
}

export default upload
