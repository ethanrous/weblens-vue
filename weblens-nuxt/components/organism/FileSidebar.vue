<template>
    <div
        :class="{
            'flex h-full shrink-0 flex-col gap-1 border py-4 transition-[width,padding] duration-300': true,
            'w-64 px-4': !collapsed,
            'w-16 px-2': collapsed,
        }"
    >
        <WeblensButton
            label="Home"
            :type="'light'"
            :selected="filesStore.activeFile?.IsHome()"
            allow-collapse
            @click.stop="WeblensFile.Home().GoTo()"
        >
            <IconHome size="18" />
        </WeblensButton>

        <WeblensButton
            label="Trash"
            :type="'light'"
            :selected="filesStore.activeFile?.IsTrash()"
            allow-collapse
            @click.stop="WeblensFile.Trash().GoTo()"
        >
            <IconTrash size="18" />
        </WeblensButton>

        <Divider />

        <WeblensButton
            label="Upload"
            allow-collapse
            @click.stop="handleUpload"
        >
            <IconUpload size="18" />
        </WeblensButton>

        <div :class="{ 'mt-auto w-full': true }">
            <TaskProgress />

            <WeblensButton
                label="Settings"
                :type="(route.name as string).startsWith('settings') ? 'default' : 'outline'"
                fill-width
                allow-collapse
                @click.stop="goToSettings"
            >
                <IconSettings size="18" />
            </WeblensButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IconHome, IconSettings, IconTrash, IconUpload } from '@tabler/icons-vue'
import WeblensButton from '../atom/WeblensButton.vue'
import Divider from '../atom/Divider.vue'
import useFilesStore from '~/stores/files'
import WeblensFile from '~/types/weblensFile'
import TaskProgress from './TaskProgress.vue'

const filesStore = useFilesStore()
const route = useRoute()

defineProps<{
    collapsed?: boolean
}>()

async function handleUpload(e) {}

function goToSettings() {
    navigateTo('/settings')
}
</script>
