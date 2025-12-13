import { defineStore } from 'pinia'
import { Task, type TaskType, type TaskParams } from '~/types/task'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskPromiseParams<T = any> = {
    resolve: (ti: T) => void
    taskId: string
}

export const useTasksStore = defineStore('tasks', () => {
    const tasks = shallowRef<Map<string, Task<TaskType>>>()
    const taskPromises = shallowRef<Map<string, TaskPromiseParams>>(new Map())

    const anyRunning = computed(() => {
        if (!tasks.value) return false

        return Array.from(tasks.value.values()).some((task) => task.isRunning)
    })

    function setTaskPromise<T>(params: TaskPromiseParams<T>) {
        taskPromises.value.set(params.taskId, params)
    }

    function removeTaskPromise(taskId: string) {
        taskPromises.value.delete(taskId)
    }

    function upsertTask(taskId: string, params: TaskParams) {
        if (!tasks.value) {
            tasks.value = new Map()
        }

        let task: Task
        if (!tasks.value.has(taskId)) {
            task = new Task(params)
            tasks.value.set(taskId, task)
        } else {
            task = tasks.value.get(taskId)!
            task.updateProgress(params)
        }

        tasks.value = new Map(tasks.value) // Trigger reactivity
    }

    function setTaskComplete<T>(taskId: string, content: T) {
        if (!tasks.value || !tasks.value.has(taskId)) return

        const task = tasks.value.get(taskId)!
        task.setComplete()

        const taskProm = taskPromises.value.get(taskId)
        if (taskProm) {
            taskProm.resolve(content)

            // Remove the promise from the map
            taskPromises.value.delete(taskId)
        }

        // Trigger reactivity
        tasks.value = new Map(tasks.value)
    }

    function cancelTask(taskId: string) {
        if (!tasks.value || !tasks.value.has(taskId)) return

        const task = tasks.value.get(taskId)!
        task.setCanceled()

        // Trigger reactivity
        tasks.value = new Map(tasks.value)
    }

    function failTask(taskId: string, opts?: { tasksFailed?: number }) {
        if (!tasks.value || !tasks.value.has(taskId)) {
            console.warn('Tried to fail a task that does not exist:', taskId)
            return
        }

        const task = tasks.value.get(taskId)!
        task.setFailed(opts)

        // Trigger reactivity
        tasks.value = new Map(tasks.value)
    }

    function removeTask(taskId: string) {
        if (!tasks.value) return

        tasks.value.delete(taskId)

        // Trigger reactivity
        tasks.value = new Map(tasks.value)
    }

    return {
        tasks,
        anyRunning,
        taskPromises,

        upsertTask,
        setTaskComplete,
        removeTask,
        cancelTask,
        failTask,

        setTaskPromise,
        removeTaskPromise,
    }
})
