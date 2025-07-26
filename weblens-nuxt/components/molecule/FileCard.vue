<template>
    <div
        ref="fileRef"
        :class="{
            'flex h-max max-h-full': true,
            'aspect-square w-full max-w-full': true, // TODO: replace when more file shapes
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
            <FileSquare
                :file="file"
                :file-state="fileState"
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
            </FileSquare>
        </UseElementVisibility>
    </div>
</template>

<script setup lang="ts">
import type WeblensFile from '@/types/weblensFile'
import FileSquare from '@/components/molecule/FileSquare.vue'
import MediaImage from '../atom/MediaImage.vue'
import { PhotoQuality } from '~/types/weblensMedia'
import { UseElementVisibility } from '@vueuse/components'
import useFilesStore from '~/stores/files'
import { IconFolder } from '@tabler/icons-vue'
import { SelectedState } from '@/types/weblensFile'
import { useMousePressed } from '@vueuse/core'
import { moveFiles } from '~/api/FileBrowserApi'
import type { coordinates } from '~/types/style'

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

const props = defineProps<{
    file: WeblensFile
}>()

function navigateToFile() {
    if (!props.file.IsFolder()) {
        return presentationStore.setPresentationFileId(props.file.id)
    }

    return props.file.GoTo()
}

const isSelected = computed(() => {
    return filesStore.selectedFiles.has(props.file.id)
})

const media = computed(() => {
    return mediaStore.media.get(props.file.GetContentId())
})

const fileState = computed(() => {
    if (filesStore.movedFiles.has(props.file.id)) {
        return SelectedState.Moved
    } else if (isSelected.value) {
        return SelectedState.Selected
    } else if (filesStore.dragging && props.file.IsFolder() && !filesStore.selectedFiles.has(props.file.id)) {
        return SelectedState.Hovering
    }

    return SelectedState.NotSelected
})

function handleContextMenu(e: MouseEvent) {
    menuStore.setTarget(props.file.Id())
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
    if (filesStore.dragging && props.file.IsFolder() && !filesStore.selectedFiles.has(props.file.id)) {
        await moveFiles(props.file)
    }
    mousePressed.pressed.value = false
}
</script>
