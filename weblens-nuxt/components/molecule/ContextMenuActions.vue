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
            label="Rename"
            fill-width
            :disabled="!canModifyTarget || protectedFile"
            @click.stop="emit('renameFile')"
        >
            <IconPencil />
        </WeblensButton>

        <WeblensButton
            label="Share"
            fill-width
            :disabled="!canModifyTarget || protectedFile"
            @click.stop="emit('shareFile')"
        >
            <IconUsersPlus />
        </WeblensButton>

        <WeblensButton
            label="Scan Folder"
            fill-width
            :disabled="!canModifyTarget"
            @click.stop="handleScan"
        >
            <IconPhotoScan />
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
import { IconFolderPlus, IconPencil, IconPhotoScan, IconTrash, IconUsersPlus } from '@tabler/icons-vue'
import WeblensButton from '../atom/WeblensButton.vue'
import type WeblensFile from '~/types/weblensFile'
import useFilesStore from '~/stores/files'
import { ScanDirectory } from '~/api/FileBrowserApi'
import { useWeblensApi } from '~/api/AllApi'

const filesStore = useFilesStore()
const menuStore = useContextMenuStore()

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

    if (filesStore.activeShare && !filesStore.activeShare.checkPermission('canDelete')) {
        return false
    }

    if (protectedFile.value) {
        return false
    }

    return true
})

function handleScan() {
    if (!props.targetFile) {
        console.warn('No target file to scan')
        return
    }

    ScanDirectory(props.targetFile)
}

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
