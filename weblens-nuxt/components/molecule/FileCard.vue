<template>
    <div
        ref="fileRef"
        :class="{
            'flex max-h-full select-none': true,
            'aspect-square h-max w-full max-w-full': fileShape === 'square',
            'h-20 w-full max-w-full': fileShape === 'row',
        }"
        @dblclick.stop="navigateToFile"
        @contextmenu.stop.prevent="handleContextMenu"
        @click.stop="filesStore.setSelected(file.id, !isSelected)"
        @mouseup="handleDrop"
        @mousedown="(e) => (downPos = { x: e.clientX, y: e.clientY })"
        @mousemove="
            (e) => {
                if (
                    (e.clientX - downPos.x > 5 || e.clientY - downPos.y > 5) &&
                    mousePressed.pressed.value &&
                    !filesStore.dragging
                ) {
                    filesStore.setDragging(true)
                    filesStore.setSelected(file.id, true)
                }
            }
        "
    >
        <UseElementVisibility
            v-slot="{ isVisible }"
            :class="{ 'h-full w-full': true }"
        >
            <component
                :is="fileComponent"
                :file="file"
                :file-state="fileState"
                @context-menu="handleContextMenu"
            >
                <template #file-visual>
                    <MediaImage
                        v-if="file.contentId"
                        v-show="isVisible"
                        :class="{ 'animate-fade-in': true }"
                        :media="media"
                        :quality="PhotoQuality.LowRes"
                        :should-load="isVisible && file.displayable"
                    />
                    <IconFolder
                        v-else-if="file.IsFolder()"
                        size="80%"
                        stroke="1"
                        :class="{ 'm-auto h-full': true }"
                    />
                </template>
            </component>
        </UseElementVisibility>
    </div>
</template>

<script setup lang="ts">
import type WeblensFile from '@/types/weblensFile'
import FileSquare from '@/components/molecule/FileSquare.vue'
import MediaImage from '../atom/MediaImage.vue'
import { PhotoQuality } from '~/types/weblensMedia'
import { UseElementVisibility } from '@vueuse/components'
import useFilesStore, { type FileShape } from '~/stores/files'
import { IconFolder } from '@tabler/icons-vue'
import { SelectedState } from '@/types/weblensFile'
import { useMousePressed } from '@vueuse/core'
import { moveFiles } from '~/api/FileBrowserApi'
import type { coordinates } from '~/types/style'
import FileRow from './FileRow.vue'

const filesStore = useFilesStore()
const presentationStore = usePresentationStore()
const menuStore = useContextMenuStore()
const mediaStore = useMediaStore()

const downPos = ref<coordinates>({ x: 0, y: 0 })

const fileRef = ref<HTMLDivElement>()

const mousePressed = useMousePressed({ target: fileRef })
watchEffect(() => {
    if (!mousePressed.pressed.value) {
        filesStore.setDragging(false)
    }
})

const fileComponent = computed<typeof FileSquare | typeof FileRow>(() => {
    if (fileShape === 'square') {
        return FileSquare
    } else if (fileShape === 'row') {
        return FileRow
    }

    return FileSquare
})

const { file, fileShape } = defineProps<{
    file: WeblensFile
    fileShape: FileShape
}>()

function navigateToFile() {
    if (!file.IsFolder()) {
        return presentationStore.setPresentationFileId(file.id)
    }

    return file.GoTo()
}

const isSelected = computed(() => {
    return filesStore.selectedFiles.has(file.id)
})

const media = computed(() => {
    return mediaStore.media.get(file.GetContentId())
})

const fileState = computed(() => {
    if (filesStore.movedFiles.has(file.id)) {
        return SelectedState.Moved
    } else if (isSelected.value) {
        return SelectedState.Selected
    } else if (filesStore.dragging && file.IsFolder() && !filesStore.selectedFiles.has(file.id)) {
        return SelectedState.Hovering
    }

    return SelectedState.NotSelected
})

function handleContextMenu(e: MouseEvent) {
    e.stopPropagation()
    menuStore.setTarget(file.Id())
    menuStore.setMenuOpen(true)

    const fbBox = document.getElementById('filebrowser-container')
    if (!fbBox) {
        console.error('File browser container not found')
        return
    }

    const rect = fbBox.getBoundingClientRect()

    menuStore.setMenuPosition({ x: e.pageX - rect.left, y: e.pageY - rect.top })
}

async function handleDrop(e: MouseEvent) {
    e.stopPropagation()
    if (filesStore.dragging && file.IsFolder() && !filesStore.selectedFiles.has(file.id)) {
        await moveFiles(file)
    }
    mousePressed.pressed.value = false
}
</script>
