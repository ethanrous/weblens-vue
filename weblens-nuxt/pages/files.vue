<template>
    <div :class="{ 'page-root relative': true }">
        <Presentation />
        <UploadProgress />
        <div :class="{ 'flex h-full w-full max-w-full min-w-0 flex-col': true }">
            <FileHeader />
            <NuxtPage />
            <PathCrumbs />
        </div>
    </div>
</template>

<script setup lang="ts">
import FileHeader from '~/components/organism/FileHeader.vue'
import PathCrumbs from '~/components/organism/PathCrumbs.vue'
import Presentation from '~/components/organism/Presentation.vue'
import UploadProgress from '~/components/organism/UploadProgress.vue'
</script>
