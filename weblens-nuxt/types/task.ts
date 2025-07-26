import type WeblensFile from './weblensFile'

export enum TaskType {
    ScanFile = 'ScanFile',
}

export class Task {
    taskId: string
    taskType: TaskType
    targetFile: WeblensFile
    executionTime: number = 0
    percentComplete: number = 0

    constructor({ taskId, taskType, targetFile }: { taskId: string; taskType: TaskType; targetFile: WeblensFile }) {
        this.taskId = taskId
        this.taskType = taskType
        this.targetFile = targetFile
    }

    updateProgress(percent: number) {
        this.percentComplete = percent
    }

    setExeTime(executionTime: number) {
        this.executionTime = executionTime
    }
}
