import { defineStore } from 'pinia'
import { Task, TaskType } from '~/types/task'
import type WeblensFile from '~/types/weblensFile'

export const useTasksStore = defineStore('tasks', () => {
    const tasks = shallowRef<Map<string, Task>>()

    function upsertTask(
        taskId: string,
        {
            percentComplete,
            target,
            executionTime,
        }: { percentComplete: number; target: WeblensFile; executionTime?: number },
    ) {
        if (!tasks.value) {
            tasks.value = new Map()
        }

        let task: Task
        if (!tasks.value.has(taskId)) {
            task = new Task({ taskId, taskType: TaskType.ScanFile, targetFile: target })
            tasks.value.set(taskId, task)
        } else {
            task = tasks.value.get(taskId)!
        }

        task.updateProgress(percentComplete)

        if (executionTime !== undefined) {
            task.setExeTime(executionTime)
        }

        tasks.value = new Map(tasks.value) // Trigger reactivity
    }

    return {
        tasks,
        upsertTask,
    }
})
