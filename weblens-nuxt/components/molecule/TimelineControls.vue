<template>
    <div :class="{ 'timeline-controls flex h-full w-max items-center': true }">
        <SizeStepper
            v-if="filesStore.timeline"
            :active-step="(mediaStore.timelineImageSize - TIMELINE_IMAGE_MIN_SIZE) / 50"
            :step-count="(TIMELINE_IMAGE_MAX_SIZE - TIMELINE_IMAGE_MIN_SIZE) / 50 + 1"
            @select-step="(v) => mediaStore.updateImageSize(v * 50 + TIMELINE_IMAGE_MIN_SIZE)"
        />
        <WeblensButton
            :class="{ 'ml-2': true }"
            label="Raw"
            :type="mediaStore.showRaw ? 'default' : 'outline'"
            @click="mediaStore.setShowRaw(!mediaStore.showRaw)"
        />
    </div>
</template>

<script setup lang="ts">
import useFilesStore from '~/stores/files'
import SizeStepper from '../atom/SizeStepper.vue'
import WeblensButton from '../atom/WeblensButton.vue'

const filesStore = useFilesStore()
const mediaStore = useMediaStore()
</script>
