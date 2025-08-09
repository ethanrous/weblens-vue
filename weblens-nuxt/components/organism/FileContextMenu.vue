<template>
    <div
        ref="contextMenu"
        :class="{
            'file-context-menu animate-fade-in shadow-lg': true,
            'gone hidden': !menuStore.isOpen,
        }"
        :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
    >
        <ContextMenuHeader
            :file="targetFile"
            :selected-files="selectedFiles"
            :naming-file="menuStore.menuMode"
        />
        <ContextMenuActions
            v-if="!menuStore.menuMode"
            :target-file="targetFile"
            :selected-files="selectedFiles"
            @create-folder="menuStore.setMenuMode('newName')"
            @rename-file="menuStore.setMenuMode('rename')"
            @share-file="menuStore.setSharing(true)"
        />
        <ContextNameFile
            v-else
            :value="menuStore.menuMode === 'rename' ? targetFile?.GetFilename() : ''"
            @submit="handleNameFile"
        />
    </div>
    <ShareModal
        v-if="targetFile && menuStore.isSharing"
        :file="targetFile"
    />
</template>

<script setup lang="ts">
import useFilesStore from '~/stores/files'
import ContextMenuHeader from '../molecule/ContextMenuHeader.vue'
import { onClickOutside, onKeyDown, useElementBounding, useElementSize } from '@vueuse/core'
import ContextMenuActions from '../molecule/ContextMenuActions.vue'
import ContextNameFile from '../molecule/ContextNameFile.vue'
import useLocationStore from '~/stores/location'
import ShareModal from './ShareModal.vue'
import { useWeblensApi } from '~/api/AllApi'

const menuStore = useContextMenuStore()
const locationStore = useLocationStore()

const menuRef = useTemplateRef('contextMenu')
const menuSize = useElementSize(menuRef)
const containerBounds = useElementBounding(document.getElementById('filebrowser-container'))

onClickOutside(menuRef, () => {
    if (menuStore.isOpen) {
        menuStore.setMenuOpen(false)
    }
})

onKeyDown(['Escape'], (e) => {
    e.stopPropagation()
    if (menuStore.isOpen) {
        menuStore.setMenuOpen(false)
    }
})

const menuPosition = computed(() => {
    const menuPos = {
        x: Math.min(
            menuStore.menuPosition.x,
            containerBounds.right.value - containerBounds.left.value - menuSize.width.value - 24,
        ),
        y: Math.min(
            menuStore.menuPosition.y,
            containerBounds.bottom.value - containerBounds.top.value - menuSize.height.value - 24,
        ),
    }

    return menuPos
})

const targetFile = computed(() => {
    return useFilesStore().getFileById(menuStore.directTargetId)
})

const selectedFiles = computed(() => {
    const selectedFiles = useFilesStore().selectedFiles
    if (!selectedFiles.size) {
        return [menuStore.directTargetId]
    }

    if (!selectedFiles.has(menuStore.directTargetId)) {
        return [menuStore.directTargetId]
    }

    return [...selectedFiles]
})

async function handleNameFile(newName: string) {
    if (!targetFile.value) {
        console.warn('No active file to rename or create folder for.')
        return
    }

    if (menuStore.menuMode === 'rename') {
        const updateFileRequest = { newName }
        await useWeblensApi().FilesApi.updateFile(targetFile.value.id, updateFileRequest, locationStore.activeShareId)
    } else if (menuStore.menuMode === 'newName') {
        const newFolderRequest = { newFolderName: newName, parentFolderId: targetFile.value.Id() }
        await useWeblensApi().FoldersApi.createFolder(newFolderRequest)
    }

    menuStore.setMenuMode()
    menuStore.setMenuOpen(false)
}
</script>

<style>
@reference '../../assets/css/base.css';

.file-context-menu {
    background-color: var(--color-background-primary);
    position: absolute;
    height: max-content;
    width: max-content;
    border-radius: 0.375rem; /* rounded */
    border: 1px solid var(--color-border);
    padding: calc(var(--spacing) * 2);
    transition: height 0.1s var(--ease-wl-default);
    transition-property: height, top, left, opacity;

    border: 1px solid var(--color-border-primary);
    z-index: 10;

    @apply shadow-sm;
}
</style>
