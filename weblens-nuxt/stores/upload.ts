import { defineStore } from 'pinia'
import TaskQueue from '~/types/promiseQueue'
import { setChunk, recomputeSoFar, type FileUploadMetadata, type UploadInfo, addRate } from '~/types/uploadTypes'

const MAX_UPLOAD_CHUNK_SIZE_BYTES: number = 25600000
const MAX_CONCURRENT_UPLOAD_COUNT = 2

export const useUploadStore = defineStore('upload', () => {
    const uploads = shallowRef<Map<string, UploadInfo>>(new Map())
    const uploadTaskQueue = shallowRef(new TaskQueue(MAX_CONCURRENT_UPLOAD_COUNT))

    const uploadChunkSize = ref<number>(MAX_UPLOAD_CHUNK_SIZE_BYTES)

    function startUpload(upload: Partial<UploadInfo>): UploadInfo {
        if (!upload.name || !upload.type) {
            throw new Error('Upload must have name and type')
        }

        upload.status = 'pending'
        upload.startTime = Date.now()
        upload.progressPercent = 0
        upload.totalSize = 0

        uploads.value.set(upload.localUploadId!, upload as UploadInfo)

        uploads.value = new Map(uploads.value) // Trigger reactivity

        return upload as UploadInfo
    }

    function setServerUpload(localUploadId: string, serverUploadId: string) {
        const upload = uploads.value.get(localUploadId)
        if (!upload) {
            throw new Error(`Upload with local ID ${localUploadId} not found`)
        }

        upload.serverUploadId = serverUploadId

        uploads.value = new Map(uploads.value) // Trigger reactivity
    }

    function addFilesToUpload(uploadId: string, ...files: FileUploadMetadata[]) {
        const upload = uploads.value.get(uploadId)

        if (!upload) {
            console.warn(`Upload with ID ${uploadId} not found for adding files`)
            return
        }

        if (!upload.files) {
            upload.files = {}
        }

        files.forEach((file) => {
            if (!file.fileId) {
                throw new Error('File does not have a fileId starting upload, but one was expected')
            }

            upload.files[file.fileId] = file
            upload.totalSize += file.file!.size!
        })

        uploads.value.set(uploadId, upload)
        uploads.value = new Map(uploads.value) // Trigger reactivity
    }

    function setUploadProgress(
        uploadId: string,
        fileId: string,
        chunkKey: number,
        chunkSize: number,
        uploadedSoFar: number,
    ) {
        let upload = uploads.value.get(uploadId)

        if (upload) {
            upload = setChunk(upload, fileId, chunkKey, {
                uploadedSoFar,
                startByte: chunkKey,
                endByte: chunkKey + chunkSize - 1,
            })

            if (upload.status === 'pending') {
                upload.status = 'uploading'
            }

            recomputeSoFar(upload)
            addRate(upload)

            if (upload.uploadedSoFar >= upload.totalSize) {
                upload.status = 'completed'
                upload.endTime = Date.now()
            }

            uploads.value.set(uploadId, upload)
            uploads.value = new Map(uploads.value) // Trigger reactivity
        } else {
            console.warn(`Upload with ID ${uploadId} not found for progress update`)
        }
    }

    function finishChunk(uploadId: string, fileId: string, chunkKey: number, chunkSize: number) {
        let upload = uploads.value.get(uploadId)

        if (upload) {
            upload = setChunk(upload, fileId, chunkKey, {
                uploadedSoFar: chunkSize,
                startByte: chunkKey,
                endByte: chunkKey + chunkSize - 1,
            })

            if (upload.status === 'pending') {
                upload.status = 'uploading'
            }

            recomputeSoFar(upload)
            addRate(upload)

            if (upload.uploadedSoFar >= upload.totalSize) {
                upload.status = 'completed'
                upload.endTime = Date.now()
            }

            uploads.value.set(uploadId, upload)
            uploads.value = new Map(uploads.value) // Trigger reactivity
        } else {
            console.warn(`Upload with ID ${uploadId} not found for progress update`)
        }
    }

    function resetChunk(uploadId: string, fileId: string, chunkKey: number) {
        const upload = uploads.value.get(uploadId)

        if (!upload) {
            console.warn(`Upload with ID ${uploadId} not found for resetting chunk`)
            return
        }

        const file = upload.files[fileId]
        if (file?.chunks && file.chunks[chunkKey]) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete file.chunks[chunkKey]
            upload.files[fileId] = file
            uploads.value.set(uploadId, upload)
            uploads.value = new Map(uploads.value) // Trigger reactivity
        } else {
            console.warn(
                `Chunk or file not found for chunk starting at ${chunkKey} in file ${fileId} for upload ${uploadId}`,
            )
        }
    }

    function clearUploads() {
        for (const upload of uploads.value.values()) {
            if (upload.endTime !== undefined && upload.status !== 'failed') {
                uploads.value.delete(upload.localUploadId!)
            }
        }

        uploads.value = new Map(uploads.value) // Trigger reactivity
    }

    function failUpload(uploadId: string, error: Error) {
        console.error('Failing upload', uploadId, 'because', error)
        const upload = uploads.value.get(uploadId)
        if (upload) {
            upload.status = 'failed'
            upload.error = error
            uploads.value.set(uploadId, upload)
            uploads.value = new Map(uploads.value)
        } else {
            console.warn(`Upload with ID ${uploadId} not found for failure update`)
        }
    }

    return {
        uploads,
        uploadTaskQueue,
        uploadChunkSize,

        startUpload,
        setServerUpload,
        setUploadProgress,
        addFilesToUpload,
        clearUploads,

        failUpload,
        resetChunk,
        finishChunk,
    }
})
