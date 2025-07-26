<template>
    <div
        :class="{
            'border-card-background-primary flex aspect-square h-full w-full cursor-pointer flex-col rounded border transition': true,
            'bg-card-background-selected': fileState.Has(SelectedState.Selected),
            'hover:bg-card-background-selected/50 hover:border-theme-primary hover:border': fileState.Has(
                SelectedState.Hovering,
            ),
            'bg-card-background-primary hover:bg-card-background-hover': !fileState.Has(SelectedState.Selected),
            'bg-card-background-disabled !text-text-tertiary pointer-events-none': fileState.Has(SelectedState.Moved),
        }"
    >
        <div
            :class="{
                'flex aspect-square h-full min-h-0 w-full min-w-0 items-center p-1.5 transition-[padding] sm:p-3': true,
            }"
        >
            <div :class="{ 'h-full w-full overflow-hidden rounded': true }">
                <slot name="file-visual" />
            </div>
        </div>
        <div
            :class="{
                'flex h-[15%] min-h-max flex-col justify-end gap-0.5 px-2 pb-1 select-none sm:min-h-12 sm:pb-2': true,
            }"
        >
            <span :class="{ 'truncate font-semibold text-nowrap': true }">{{ file.GetFilename() }}</span>
            <span
                :class="{
                    'hidden text-xs sm:inline-block': true,
                    'text-text-secondary': !fileState.Has(SelectedState.Moved),
                }"
            >
                {{ file.FormatSize() + ' - ' + file.FormatModified() }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { SelectedState } from '@/types/weblensFile'
import type WeblensFile from '@/types/weblensFile'

defineProps<{
    file: WeblensFile
    fileState: SelectedState
}>()
</script>
