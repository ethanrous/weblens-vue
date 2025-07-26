<template>
    <WeblensButton
        label="Clean Media"
        flavor="danger"
        @click="handleCleanMedia"
    />
</template>

<script setup lang="ts">
import { useWeblensApi } from '~/api/AllApi'
import WeblensButton from '~/components/atom/WeblensButton.vue'

async function handleCleanMedia() {
    await useWeblensApi().MediaApi.dropMedia()
}
</script>
