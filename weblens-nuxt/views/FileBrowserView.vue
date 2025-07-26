<template>
    <div>
        <FileCard :file="file" />
    </div>
</template>

<script setup lang="ts">
import WeblensFile from '@/types/weblensFile'
import { computed } from 'vue'
import FileCard from '~/molecule/FileCard.vue'

const file = computed(() => {
    return new WeblensFile({
        id: 'file-id',
        size: 1234,
        portablePath: 'USERS:ethan/My File',
    })
})
</script>
