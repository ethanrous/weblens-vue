<template>
    <input
        v-model="value"
        :placeholder="placeholder"
        :type="password ? 'password' : ''"
    />
</template>

<script setup lang="ts">
import { onKeyDown } from '@vueuse/core'

defineProps<{
    placeholder?: string
    password?: boolean
}>()

const value = defineModel<string>('value')

const emit = defineEmits<{
    (e: 'update' | 'submit', value: string): void
}>()

onKeyDown(['Enter'], (e) => {
    e.preventDefault()
    if (!value.value) {
        return
    }

    emit('submit', value.value)
})
</script>
