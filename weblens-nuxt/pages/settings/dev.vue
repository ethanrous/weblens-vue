<template>
    <div :class="{ 'flex gap-1': true }">
        <WeblensButton
            label="Clear Media HDIR Data"
            flavor="danger"
            @click="handleClearHDIRs"
        />
        <WeblensButton
            label="Clean Media"
            flavor="danger"
            @click="handleCleanMedia"
        />
    </div>
</template>

<script setup lang="ts">
import { useWeblensApi } from '~/api/AllApi'
import WeblensButton from '~/components/atom/WeblensButton.vue'

async function handleCleanMedia() {
    await useWeblensApi().MediaApi.dropMedia()
}
async function handleClearHDIRs() {
    await useWeblensApi().MediaApi.dropHDIRs()
}
</script>
