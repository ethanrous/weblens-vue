<template>
    <div :class="{ 'flex min-w-40 flex-col gap-1.5': true }">
        <WeblensButton
            v-if="targetIsFolder"
            label="New Folder"
            fill-width
            :disabled="!canModifyParent"
            @click.stop="emit('createFolder')"
        >
            <IconFolderPlus />
        </WeblensButton>

        <WeblensButton
            v-if="!multipleSelected"
            label="Rename"
            fill-width
            :disabled="!canModifyTarget || protectedFile"
            @click.stop="emit('renameFile')"
        >
            <IconPencil />
        </WeblensButton>

        <WeblensButton
            v-if="!multipleSelected"
            label="Share"
            fill-width
            :disabled="!canModifyTarget || protectedFile"
            @click.stop="emit('shareFile')"
        >
            <IconUsersPlus />
        </WeblensButton>

        <WeblensButton
            v-if="targetIsFolder"
            label="Scan Folder"
            fill-width
            :disabled="!canModifyTarget"
            @click.stop="handleScan"
        >
            <IconPhotoScan />
        </WeblensButton>

        <WeblensButton
            :key="targetFile?.Id()"
            :label="downloadTaskPercentComplete ? `Zipping (${downloadTaskPercentComplete.toFixed(0)}%)` : 'Download'"
            fill-width
            :class="{
                'relative overflow-hidden': true,
                'rounded-b-xs': downloadTaskPercentComplete !== undefined,
            }"
            @click.stop="handleDownload"
        >
            <IconDownload />
            <ProgressSquare
                v-if="downloadTaskPercentComplete"
                :class="{ '!bg-background-secondary !absolute bottom-0 left-[-1%] z-40 h-1 w-[102%]': true }"
                :show-outline="false"
                :progress="downloadTaskPercentComplete"
            />
        </WeblensButton>

        <WeblensButton
            label="Delete"
            fill-width
            flavor="danger"
            :disabled="!canDelete"
            @click.stop="handleDeleteFile"
        >
            <IconTrash />
        </WeblensButton>
    </div>
</template>

<script setup lang="ts">
import { IconDownload, IconFolderPlus, IconPencil, IconPhotoScan, IconTrash, IconUsersPlus } from '@tabler/icons-vue'
import WeblensButton from '../atom/WeblensButton.vue'
import type WeblensFile from '~/types/weblensFile'
import useFilesStore from '~/stores/files'
import { downloadManyFiles, downloadSingleFile, ScanDirectory } from '~/api/FileBrowserApi'
import { useWeblensApi } from '~/api/AllApi'
import useLocationStore from '~/stores/location'
import ProgressSquare from '../atom/ProgressSquare.vue'

const filesStore = useFilesStore()
const locationStore = useLocationStore()
const menuStore = useContextMenuStore()
const tasksStore = useTasksStore()

const downloadTaskId = ref<string>()

const emit = defineEmits<{
    (e: 'createFolder' | 'renameFile' | 'shareFile'): void
}>()

const props = defineProps<{
    targetFile?: WeblensFile
    selectedFiles?: string[]
}>()

const targetIsFolder = computed(() => {
    return (
        filesStore.activeFile && filesStore.activeFile.IsFolder() && filesStore.activeFile.id === props.targetFile?.id
    )
})

const protectedFile = computed(() => {
    return props.targetFile?.IsHome() || props.targetFile?.IsTrash()
})

const canModifyTarget = computed(() => {
    return props.targetFile?.modifiable
})

const canModifyParent = computed(() => {
    return filesStore.activeFile?.modifiable
})

const canDelete = computed(() => {
    if (!canModifyTarget.value) {
        return false
    }

    if (locationStore.activeShare && !locationStore.activeShare.checkPermission('canDelete')) {
        return false
    }

    if (protectedFile.value) {
        return false
    }

    return true
})

const multipleSelected = computed(() => {
    return props.selectedFiles && props.selectedFiles.length > 1
})

const downloadTaskPercentComplete = computed(() => {
    if (!downloadTaskId.value) {
        return undefined
    }

    console.log({ ...tasksStore.tasks?.get(downloadTaskId.value) })

    return tasksStore.tasks?.get(downloadTaskId.value)?.percentComplete
})

function handleScan() {
    if (!props.targetFile) {
        console.warn('No target file to scan')
        return
    }

    ScanDirectory(props.targetFile)
}

async function handleDownload() {
    if (!props.targetFile) {
        console.warn('No target file to scan')
        return
    }

    if (!multipleSelected.value && !props.targetFile.IsFolder()) {
        await downloadSingleFile(props.targetFile?.Id(), props.targetFile?.GetFilename())
            .then(() => {
                menuStore.setMenuOpen(false)
            })
            .catch((error) => {
                console.error('Error downloading file:', error)
            })
        return
    } else if (props.selectedFiles) {
        const takeoutRes = await downloadManyFiles(props.selectedFiles)

        if (takeoutRes.taskId) {
            downloadTaskId.value = takeoutRes.taskId
        }

        const takeoutInfo = await takeoutRes.takeoutInfo

        if (!takeoutInfo.takeoutId || !takeoutInfo.filename) {
            console.warn('Missing takeoutId or filename returned from downloadManyFiles', takeoutInfo)
            return
        }

        await downloadSingleFile(takeoutInfo.takeoutId, takeoutInfo.filename, 'zip')
            .then(() => {
                menuStore.setMenuOpen(false)
            })
            .catch((error) => {
                console.error('Error downloading file:', error)
            })
            .finally(() => {
                downloadTaskId.value = undefined
            })
    }
}

watch([() => props.targetFile, () => props.selectedFiles], () => {
    downloadTaskId.value = undefined
})

async function handleDeleteFile(): Promise<void> {
    if (!props.targetFile) {
        console.warn('No target file to delete')
        return
    }

    if (!props.selectedFiles) {
        console.warn('No selected files to delete')
        return
    }

    filesStore.setMovedFile(props.selectedFiles, true)

    await useWeblensApi().FilesApi.deleteFiles({ fileIds: props.selectedFiles })
    menuStore.setMenuOpen(false)
}
</script>
