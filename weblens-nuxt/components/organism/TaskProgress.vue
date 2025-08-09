<template>
    <div
        ref="tasksContainer"
        :class="{ 'my-2 flex h-max w-full flex-col select-none': true }"
    >
        <div
            v-for="task of tasksArray"
            :key="task.taskId"
            :class="{
                'bg-card-background-primary group z-20 mb-3 h-max w-full rounded border p-2 transition-[width] last:mb-0 hover:w-[222px]': true,
            }"
        >
            <div :class="{ 'mb-1 flex flex-col justify-center': true }">
                <div :class="{ 'border-text-tertiary mb-1 flex w-full border-b pb-1': true }">
                    <FileIcon
                        :class="{ 'mr-auto min-w-0': true }"
                        :file="task.targetFile"
                        with-name
                    />
                    <IconX
                        size="20"
                        :class="{
                            'text-text-secondary hover:text-text-primary cursor-pointer opacity-0 transition group-hover:opacity-100': true,
                        }"
                        @click="removeTask(task.taskId)"
                    />
                </div>

                <div v-if="containerSize.width.value > 100">
                    <div
                        v-if="task.status !== 'completed'"
                        :class="{ 'flex py-1': true }"
                    >
                        <span :class="{ 'text-text-secondary text-nowrap': true }">Importing Media</span>

                        <span
                            v-if="task.status === 'in-progress'"
                            :class="{ 'text-text-secondary border-text-tertiary ml-2 border-l pl-2 text-nowrap': true }"
                        >
                            {{ task.countComplete }} / {{ task.countTotal }}
                        </span>
                        <span
                            v-else
                            :class="{ 'text-text-secondary border-text-tertiary ml-2 border-l pl-2 text-nowrap': true }"
                        >
                            {{ task.status }}...
                        </span>
                    </div>

                    <span
                        v-if="task.status === 'completed' && task.isScanDirectoryTask()"
                        :class="{ 'text-text-secondary text-nowrap': true }"
                    >
                        Imported in {{ humanDuration(task.executionTime() / (1000 * 1000)) }}
                    </span>
                </div>
            </div>

            <div :class="{ 'flex flex-row items-center': true }">
                <ProgressSquare
                    :class="{ 'bg-background-primary h-2 w-full min-w-0 !shrink-1': true }"
                    :progress="task.percentComplete"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import ProgressSquare from '../atom/ProgressSquare.vue'
import FileIcon from '../atom/FileIcon.vue'
import { humanDuration } from '~/util/humanBytes'
import { IconX } from '@tabler/icons-vue'
import { useElementSize } from '@vueuse/core'

const tasksStore = useTasksStore()

const tasksContainer = ref<HTMLDivElement>()
const containerSize = useElementSize(tasksContainer)

const tasksArray = computed(() => {
    let tasksIttr = tasksStore.tasks?.values()
    if (!tasksIttr) {
        return []
    }

    tasksIttr = tasksIttr.filter((t) => {
        return t.isScanDirectoryTask()
    })

    const tasks = Array.from(tasksIttr)
    return tasks
})

function removeTask(taskId: string) {
    if (tasksStore.tasks?.get(taskId)?.status === 'completed') {
        tasksStore.removeTask(taskId)
        return
    }
}
</script>
