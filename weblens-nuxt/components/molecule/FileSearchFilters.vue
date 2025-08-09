<template>
    <div :class="{ 'flex h-full w-full flex-col p-4': true }">
        <WeblensCheckbox
            label="Search Recursively"
            :checked="filesStore.searchRecurively"
            @changed="filesStore.setSearchRecurively"
        />
        <span :class="{ 'text-text-tertiary': true }">Tip: Use shift+r to toggle recursive search</span>
        <WeblensButton
            :class="{ 'mt-auto ml-auto w-1/3': true }"
            label="Done"
            center-content
            @click="$emit('done')"
        />
    </div>
</template>

<script setup lang="ts">
import useFilesStore from '~/stores/files'
import WeblensCheckbox from '../atom/WeblensCheckbox.vue'
import WeblensButton from '../atom/WeblensButton.vue'

const filesStore = useFilesStore()
defineEmits<{
    (e: 'done'): void
}>()
</script>
