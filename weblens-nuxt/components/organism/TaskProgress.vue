<template>
    <div :class="{ 'my-2 flex h-max w-full flex-col': true }">
        <div
            v-for="task of tasksArray"
            :key="task.taskId"
            :class="{ 'h-max': true }"
        >
            <div :class="{ 'mb-1 flex items-center': true }">
                <FileIcon
                    :file="task.targetFile"
                    with-name
                />
                <span
                    v-if="task.percentComplete !== 100"
                    :class="{ 'text-text-secondary ml-auto': true }"
                    >Importing Media...</span
                >
                <span
                    v-else
                    :class="{ 'text-text-secondary ml-auto': true }"
                    >Imported in {{ humanDuration(task.executionTime / (1000 * 1000)) }}</span
                >
            </div>

            <ProgressSquare
                :class="{ 'h-2': true }"
                :progress="task.percentComplete"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import ProgressSquare from '../atom/ProgressSquare.vue'
import FileIcon from '../atom/FileIcon.vue'
import { humanDuration } from '~/util/humanBytes'

const tasksStore = useTasksStore()

const tasksArray = computed(() => {
    const tasksIttr = tasksStore.tasks?.values()
    if (!tasksIttr) {
        return []
    }

    return Array.from(tasksIttr)
})
</script>
