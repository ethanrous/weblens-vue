<template>
    <div
        id="filebrowser-container"
        :class="{ 'flex h-full w-full min-h-0': true }"
    >
        <FileDragCounter />
        <FileScroller
            v-if="children && !filesStore.timeline"
            :files="children"
        />
        <MediaTimeline v-else-if="filesStore.timeline" />
    </div>
</template>

<script setup lang="ts">
import FileDragCounter from '~/components/organism/FileDragCounter.vue'
import FileScroller from '~/components/organism/FileScroller.vue'
import MediaTimeline from '~/components/organism/MediaTimeline.vue'
import useFilesStore from '~/stores/files'

const filesStore = useFilesStore()

const children = computed(() => {
    return filesStore.children
})
</script>
