<template>
    <div :class="{ 'page-root relative': true }">
        <FileContextMenu />

        <div
            ref="scrollerContainer"
            :class="{
                'relative flex h-full w-full flex-col': true,
                'after:bg-theme-secondary/50 after:border-theme-primary after:pointer-events-none after:absolute after:inset-0 after:h-full after:w-full after:border':
                    hovering,
            }"
            @mousemove="
                () => {
                    if (hovering == true) {
                        hovering = false
                    }
                }
            "
            @drop.stop.prevent="handleDrop"
            @dragover.stop="handleDragOver"
            @dragleave.stop="handleDragLeave"
            @click.stop="handleClick"
            @contextmenu.stop.prevent="handleContextMenu"
        >
            <div
                v-if="files.length === 0"
                :class="{ 'text-text-tertiary absolute flex h-full w-full items-center justify-center gap-1': true }"
            >
                <IconFileSad />
                <span :class="{ 'select-none': true }">This folder is empty</span>
            </div>
            <div
                v-else
                id="file-scroller"
                :class="{ 'file-scroller': true }"
                :style="{
                    maxWidth: `min(100%, calc(var(--spacing) * 80 * ${files.length > 0 ? files.length : 1} - var(--spacing) * 2))`,
                }"
            >
                <FileCard
                    v-for="file of files"
                    :key="file.id"
                    :file="file"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type WeblensFile from '~/types/weblensFile'
import FileCard from '../molecule/FileCard.vue'
import { isParent } from '~/util/domHelpers'
import { HandleDrop } from '~/api/uploadApi'
import useFilesStore from '~/stores/files'
import { IconFileSad } from '@tabler/icons-vue'
import { onKeyDown, useActiveElement, useMagicKeys } from '@vueuse/core'
import FileContextMenu from './FileContextMenu.vue'

const filesStore = useFilesStore()
const menuStore = useContextMenuStore()
const presentationStore = usePresentationStore()

const scrollerContainer = useTemplateRef('scrollerContainer')
const hovering = ref(false)

defineProps<{ files: WeblensFile[] }>()

const activeElement = useActiveElement()
const notUsingInput = computed(
    () => activeElement.value?.tagName !== 'INPUT' && activeElement.value?.tagName !== 'TEXTAREA',
)

onKeyDown(
    ['Escape'],
    (e) => {
        if (menuStore.isSharing) {
            menuStore.setSharing(false)
            return
        }

        if (presentationStore.presentationFileId) {
            return
        }

        e.stopPropagation()
        filesStore.clearSelected()
    },
    { dedupe: true },
)

const { Ctrl_A, Cmd_A, space } = useMagicKeys({
    passive: false,
    onEventFired: (e) => {
        if ((((e.ctrlKey || e.metaKey) && e.key === 'a') || /* Spacebar */ e.key === ' ') && notUsingInput.value) {
            e.preventDefault()
        }
    },
})

watch([Ctrl_A, Cmd_A], () => {
    if ((Ctrl_A.value || Cmd_A.value) && notUsingInput.value) {
        filesStore.selectAll()
    }
})

watch(space, (isPressed) => {
    if (isPressed && filesStore.lastSelected && presentationStore.presentationFileId === '') {
        presentationStore.setPresentationFileId(filesStore.lastSelected)
    }
})

onKeyDown(
    ['Escape'],
    (e) => {
        if (usePresentationStore().presentationFileId) {
            return
        }

        e.stopPropagation()
        filesStore.clearSelected()
    },
    { dedupe: true },
)

function handleClick() {
    filesStore.clearSelected()
}

function handleContextMenu(e: MouseEvent) {
    menuStore.setTarget(filesStore.activeFolderId)
    menuStore.setMenuOpen(true)
    menuStore.setMenuPosition({ x: e.offsetX, y: e.offsetY })
}

function handleDragOver(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    hovering.value = true
}

function handleDragLeave(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (!hovering.value) {
        return
    }

    if (!event.relatedTarget) {
        hovering.value = false
        return
    }

    if (!scrollerContainer.value || !event.relatedTarget) {
        return
    }

    if (
        scrollerContainer.value === event.relatedTarget ||
        isParent(scrollerContainer.value, event.relatedTarget as Element)
    ) {
        return
    }

    hovering.value = false
}

function handleDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    hovering.value = false

    if (!event.dataTransfer) {
        console.warn('No files to drop')
        return
    }

    HandleDrop(event.dataTransfer.items, useFilesStore().activeFolderId, false, '')

    // Handle the drop logic here
    console.log('Files dropped:', event.dataTransfer?.files)
}
</script>

<style scoped>
.file-scroller {
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--spacing) * 60), 1fr));

    @media (max-width: 1250px) {
        grid-template-columns: repeat(auto-fit, minmax(calc(var(--spacing) * 40), 1fr));
    }

    position: relative;
    display: grid;
    height: max-content;
    width: 100%;

    gap: 0.5rem;
    overflow-y: auto;
    padding: 1rem;
}
</style>
