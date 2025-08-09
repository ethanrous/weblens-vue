<template>
    <div
        :class="{
            'h-2 w-2 rounded-[2px]': true,
            'bg-valid': wsStore.status === 'OPEN',
            'bg-warn': wsStore.status === 'CONNECTING',
            'bg-danger': wsStore.status === 'CLOSED',
        }"
    ></div>
</template>

<script setup lang="ts">
const wsStore = useWebsocketStore()
</script>
