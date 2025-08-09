<template>
    <div
        :class="{
            'hidden h-10 w-20 min-w-0 items-start justify-end gap-[2px] rounded transition-[background-color,width,height] sm:flex lg:w-full': true,
        }"
    >
        <OnClickOutside
            :class="{
                'z-40 mt-[-1px] flex h-11 w-10 min-w-10 flex-col gap-1 overflow-hidden p-0.25 transition-all lg:w-30': true,
                'h-33 min-w-24 shrink-0': shapeControlsOpen,
            }"
            @trigger="shapeControlsOpen = false"
        >
            <WeblensButton
                :label="shapeOptions[filesStore.fileShape].label"
                allow-collapse
                :class="{
                    'h-10 shrink-0': true,
                    '!rounded-b-none': shapeControlsOpen,
                }"
                :disabled="locationStore.isInTimeline"
                @click="shapeControlsOpen = !shapeControlsOpen"
            >
                <component :is="shapeOptions[filesStore.fileShape].icon" />
            </WeblensButton>

            <div :class="{ 'bg-background-primary flex w-full flex-col gap-1': true }">
                <WeblensButton
                    v-for="[optionKey, option] in otherShapeOptions"
                    :key="optionKey"
                    :label="option.label"
                    type="outline"
                    merge="column"
                    :disabled="optionKey === 'column'"
                    :class="{ '!rounded-t-none': true }"
                    @click="setShape(optionKey)"
                >
                    <component :is="option.icon" />
                </WeblensButton>
            </div>
        </OnClickOutside>

        <OnClickOutside
            :class="{
                'z-40 mt-[-1px] flex h-11 w-10 min-w-10 flex-col gap-1 overflow-hidden p-0.25 transition-all lg:w-30': true,
                'h-33 !w-30 shrink-0': sortControlsOpen,
            }"
            @trigger="sortControlsOpen = false"
        >
            <WeblensButton
                :label="sortOptions[filesStore.sortCondition].label"
                allow-collapse
                :class="{
                    'h-10 shrink-0 rounded-none rounded-l': true,
                    '!rounded-tl rounded-r-none !rounded-b-none': sortControlsOpen,
                }"
                :disabled="locationStore.isInTimeline"
                @click="sortControlsOpen = !sortControlsOpen"
            >
                <component :is="sortOptions[filesStore.sortCondition].icon" />
            </WeblensButton>

            <div :class="{ 'bg-background-primary flex w-full flex-col gap-1': true }">
                <WeblensButton
                    v-for="[optionKey, option] in otherSortOptions"
                    :key="optionKey"
                    :label="option.label"
                    type="outline"
                    merge="column"
                    :class="{ '!rounded-t-none': true }"
                    @click="setSort(optionKey)"
                >
                    <component :is="option.icon" />
                </WeblensButton>
            </div>
        </OnClickOutside>

        <WeblensButton
            merge="row"
            :class="{ '!rounded-l-none': true }"
            @click="toggleSortDirection"
        >
            <IconSortAscending v-if="filesStore.sortDirection === 1" />
            <IconSortDescending v-if="filesStore.sortDirection === -1" />
        </WeblensButton>
    </div>
</template>

<script setup lang="ts">
import {
    IconCalendar,
    IconFileAnalytics,
    IconLayoutColumns,
    IconLayoutGrid,
    IconLayoutRows,
    IconSortAscending,
    IconSortAZ,
    IconSortDescending,
    type Icon,
} from '@tabler/icons-vue'
import useFilesStore, { type FileShape, type SortCondition } from '~/stores/files'
import WeblensButton from '../atom/WeblensButton.vue'
import { OnClickOutside } from '@vueuse/components'
import useLocationStore from '~/stores/location'

const filesStore = useFilesStore()
const locationStore = useLocationStore()
const sortControlsOpen = ref<boolean>(false)
const shapeControlsOpen = ref<boolean>(false)

type OptionData = {
    label: string
    icon: Icon
}

const sortOptions = {
    filename: { label: 'Filename', icon: IconSortAZ },
    size: { label: 'Size', icon: IconFileAnalytics },
    date: { label: 'Date', icon: IconCalendar },
}

const shapeOptions = {
    square: { label: 'Grid', icon: IconLayoutGrid },
    row: { label: 'Rows', icon: IconLayoutRows },
    column: { label: 'Columns', icon: IconLayoutColumns },
}

const otherSortOptions = computed(() => {
    const opts = Object.entries(sortOptions).filter(([key]) => key !== filesStore.sortCondition)
    return opts as Array<[SortCondition, OptionData]>
})

const otherShapeOptions = computed(() => {
    const opts = Object.entries(shapeOptions).filter(([key]) => key !== filesStore.fileShape)
    return opts as Array<[FileShape, OptionData]>
})

function toggleSortDirection() {
    return filesStore.toggleSortDirection()
}

function setSort(sortCondition: SortCondition) {
    filesStore.setSortCondition(sortCondition)
    sortControlsOpen.value = false
}

function setShape(fileShape: FileShape) {
    console.log('Setting file shape to:', fileShape)
    filesStore.setFileShape(fileShape)
    shapeControlsOpen.value = false
}
</script>
