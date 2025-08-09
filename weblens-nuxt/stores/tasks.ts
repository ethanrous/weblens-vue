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

    function removeTask(taskId: string) {
        if (!tasks.value) return

        tasks.value.delete(taskId)

        // Trigger reactivity
        tasks.value = new Map(tasks.value)
    }

    return {
        tasks,
        upsertTask,
        setTaskComplete,
        removeTask,

        taskPromises,
        setTaskPromise,
        removeTaskPromise,
    }
})
