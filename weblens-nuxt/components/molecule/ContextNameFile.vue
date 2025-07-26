<template>
    <WeblensInput :value="value" @submit="(v) => emit('submit', v)" />
</template>

<script setup lang="ts">
import WeblensInput from '../atom/WeblensInput.vue'

const emit = defineEmits<{
    (e: 'submit', value: string): void
}>()

defineProps<{
    value?: string
}>()
</script>
