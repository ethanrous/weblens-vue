<template>
    <div :class="{ 'bg-card-background-primary flex h-16 w-full shrink-0 items-center': true }">
        <IconChevronLeft
            :class="{
                'mx-1 flex items-center justify-center rounded pr-0.5 transition md:mx-2': true,
                'text-text-secondary': !canNavigate,
                'hover:bg-card-background-hover cursor-pointer': canNavigate,
            }"
            @click="navigateBack"
        />
        <h3
            :class="{ 'max-h-max cursor-pointer truncate text-lg text-nowrap select-none md:text-2xl': true }"
            @contextmenu.stop.prevent="openContextMenu"
            @click.stop="openContextMenu"
        >
            {{ fileName }}
        </h3>
        <div :class="{ 'relative mr-4 ml-auto flex h-10 flex-row items-center gap-2': true }">
            <TimelineControls v-if="filesStore.timeline" />

            <WeblensButton @click="toggleSortDirection">
                <IconSortAscending v-if="sortDirection === 1" />
                <IconSortDescending v-if="sortDirection === -1" />
            </WeblensButton>

            <div :class="{ 'flex items-center': true }">
                <WeblensButton
                    :type="filesStore.sortCondition === 'filename' ? 'default' : 'outline'"
                    merge="row"
                    :disabled="filesStore.timeline"
                    @click="filesStore.setSortCondition('filename')"
                >
                    <IconSortAZ />
                </WeblensButton>

                <WeblensButton
                    :type="filesStore.sortCondition === 'size' ? 'default' : 'outline'"
                    merge="row"
                    :disabled="filesStore.timeline"
                    @click="filesStore.setSortCondition('size')"
                >
                    <IconFileAnalytics />
                </WeblensButton>

                <WeblensButton
                    :type="filesStore.sortCondition === 'date' || filesStore.timeline ? 'default' : 'outline'"
                    merge="row"
                    @click="
                        () => {
                            if (filesStore.timeline) return
                            filesStore.setSortCondition('date')
                        }
                    "
                >
                    <IconCalendar />
                </WeblensButton>
            </div>

            <WeblensButton @click="filesStore.setTimeline(!filesStore.timeline)">
                <IconPhoto />
            </WeblensButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    IconCalendar,
    IconChevronLeft,
    IconFileAnalytics,
    IconPhoto,
    IconSortAscending,
    IconSortAZ,
    IconSortDescending,
} from '@tabler/icons-vue'
import useFilesStore from '~/stores/files'
import WeblensFile from '~/types/weblensFile'
import WeblensButton from '../atom/WeblensButton.vue'
import TimelineControls from '../molecule/TimelineControls.vue'

const filesStore = useFilesStore()
const mediaStore = useMediaStore()
const menuStore = useContextMenuStore()
const userStore = useUserStore()

const activeFile = computed(() => {
    return filesStore.activeFile
})

const fileName = computed(() => {
    return activeFile.value ? activeFile.value.GetFilename() : ''
})

const canNavigate = computed(() => {
    if (userStore.user.homeId === activeFile.value?.id || activeFile.value?.parentId === 'USERS') {
        return false
    }

    return true
})

const sortDirection = computed(() => {
    if (filesStore.timeline) {
        return mediaStore.timelineSortDirection
    } else {
        return filesStore.sortDirection
    }
})

function toggleSortDirection() {
    if (filesStore.timeline) {
        return mediaStore.toggleSortDirection()
    } else {
        return filesStore.toggleSortDirection()
    }
}

function navigateBack() {
    if (!canNavigate.value) {
        return
    }

    return new WeblensFile({ id: activeFile.value?.parentId }).GoTo()
}

function openContextMenu(e: MouseEvent) {
    if (!filesStore.activeFile?.Id()) return

    menuStore.setTarget(filesStore.activeFile?.Id())
    menuStore.setMenuOpen(true)

    const fbBox = document.getElementById('filebrowser-container')
    if (!fbBox) {
        console.error('File browser container not found')
        return
    }

    const rect = fbBox.getBoundingClientRect()

    menuStore.setMenuPosition({ x: e.pageX - rect.left, y: e.pageY - rect.top })
}
</script>
