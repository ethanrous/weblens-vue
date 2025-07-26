<template>
    <div
        v-if="file"
        class="mb-1.5 flex items-center gap-1 border-b pb-1.5"
    >
        <FileIcon
            v-if="!namingFile"
            :file="file"
        />
        <span>{{ label }}</span>
    </div>
</template>

<script setup lang="ts">
import type WeblensFile from '~/types/weblensFile'
import FileIcon from '../atom/FileIcon.vue'

const props = defineProps<{
    file?: WeblensFile
    namingFile?: 'rename' | 'newName'
}>()

const label = computed(() => {
    if (props.namingFile === 'rename') {
        return `Rename ${props.file?.GetFilename() ?? ''}`
    }

    if (props.namingFile === 'newName') {
        return 'New folder'
    }

    return props.file?.GetFilename() ?? ''
})
</script>
