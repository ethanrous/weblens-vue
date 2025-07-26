<template>
    <div :class="{ 'fileIcon flex items-center': true }">
        <IconHome v-if="file.IsHome()" />
        <IconUser v-else-if="file.IsShareRoot()" />
        <IconTrash v-else-if="file.IsTrash()" />
        <IconFolder v-else-if="file.IsFolder()" />
        <IconFile v-else />

        <h5
            v-if="withName"
            :class="{ 'ml-1 truncate text-nowrap select-none': true }"
        >
            {{ file.GetFilename() }}
        </h5>
    </div>
</template>

<script setup lang="ts">
import { IconFile, IconFolder, IconHome, IconTrash, IconUser } from '@tabler/icons-vue'
import type WeblensFile from '~/types/weblensFile'

defineProps<{
    file: WeblensFile
    withName?: boolean
}>()
</script>
