<template>
    <div :class="{ 'bg-card-background-primary flex h-16 w-full shrink-0 items-center justify-between': true }">
        <div :class="{ 'flex min-w-max flex-1 items-center': true }">
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
        </div>

        <div :class="{ 'relative flex h-10 max-w-30 flex-2 justify-center lg:max-w-[500px]': true }">
            <Searchbar ref="searchbar" />
        </div>

        <div :class="{ 'relative mr-4 flex h-10 min-w-0 flex-1 flex-row items-center justify-end gap-2': true }">
            <FileSortControls v-if="!locationStore.isInTimeline" />
            <TimelineControls v-if="locationStore.isInTimeline" />

            <WeblensButton @click="locationStore.setTimeline(!locationStore.isInTimeline)">
                <IconFolder v-if="locationStore.isInTimeline" />
                <IconPhoto v-if="!locationStore.isInTimeline" />
            </WeblensButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconChevronLeft, IconFolder, IconPhoto } from '@tabler/icons-vue'
import useFilesStore from '~/stores/files'
import WeblensFile from '~/types/weblensFile'
import WeblensButton from '../atom/WeblensButton.vue'
import TimelineControls from '../molecule/TimelineControls.vue'
import { onKeyPressed } from '@vueuse/core'
import Searchbar from '../molecule/Searchbar.vue'
import FileSortControls from '../molecule/FileSortControls.vue'
import useLocationStore from '~/stores/location'

const filesStore = useFilesStore()
const locationStore = useLocationStore()
const menuStore = useContextMenuStore()
const userStore = useUserStore()

const searchbar = ref<typeof Searchbar>()

onKeyPressed(['shift', 'K'], (e) => {
    e.preventDefault()
    if (!searchbar.value) {
        return
    }

    searchbar.value.focus()
})

onKeyPressed(['shift', 'R'], (e) => {
    e.preventDefault()
    if (locationStore.isInTimeline) {
        return
    }

    filesStore.setSearchRecurively(!filesStore.searchRecurively)
})

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
