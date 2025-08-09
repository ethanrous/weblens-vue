<template>
    <div
        id="filebrowser-container"
        :class="{ 'filebrowser-container relative flex h-full min-h-0 w-full min-w-60 items-center': true }"
    >
        <FileDragCounter />
        <div v-if="error">
            <span>Failed loading files: {{ error }}</span>
        </div>
        <div
            v-else-if="isLoading"
            :class="{ 'm-auto': true }"
        >
            <Loader :class="{ 'h-8 w-8': true }" />
        </div>

        <FileScroller
            v-else-if="filesStore.files && !locationStore.isInTimeline"
            :files="filesStore.files"
        />

        <MediaTimeline v-else-if="locationStore.isInTimeline" />
    </div>
</template>

<script setup lang="ts">
import Loader from '~/components/atom/Loader.vue'
import FileDragCounter from '~/components/organism/FileDragCounter.vue'
import FileScroller from '~/components/organism/FileScroller.vue'
import MediaTimeline from '~/components/organism/MediaTimeline.vue'
import useFilesStore from '~/stores/files'
import useLocationStore from '~/stores/location'

const filesStore = useFilesStore()
const locationStore = useLocationStore()

const isLoading = computed(() => {
    return filesStore.children === undefined || filesStore.status === 'pending' || filesStore.status === 'idle'
})

const error = computed(() => {
    return filesStore.error
})
</script>
