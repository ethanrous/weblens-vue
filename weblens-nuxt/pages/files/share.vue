<template>
    <div
        id="filebrowser-container"
        :class="{ 'page-root': true }"
    >
        <FileScroller
            v-if="inShareRoot && children"
            :files="children"
        />
        <NuxtPage v-if="!inShareRoot" />
    </div>
</template>

<script setup lang="ts">
import FileScroller from '~/components/organism/FileScroller.vue'
import useFilesStore from '~/stores/files'

const filesStore = useFilesStore()

const inShareRoot = computed(() => {
    return !filesStore.activeShareId?.length
})

const children = computed(() => {
    return filesStore.children
})
</script>
