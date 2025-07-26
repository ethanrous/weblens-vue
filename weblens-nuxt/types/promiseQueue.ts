export type Task<R = void, A = R> = (args: A) => Promise<R>

export default class TaskQueue {
    queue: Task[] = []
    groupQueue: Map<string, Task[]> = new Map()
    noCollide: (string | undefined)[] = []
    activeRunnerCount: number = 0
    maxConcurrentRunners: number = 1
    waitingGroups: string[] = []

    constructor(maxConcurrentRunners?: number) {
        this.maxConcurrentRunners = maxConcurrentRunners ?? 1
    }

    async addTask(task: Task, taskGroupId?: string) {
        if (taskGroupId !== undefined) {
            let groupQueue = this.groupQueue.get(taskGroupId)
            if (!groupQueue) {
                groupQueue = []
            }

            groupQueue.push(task)
            this.groupQueue.set(taskGroupId, groupQueue)
        } else {
            this.queue.push(task)
        }

        if (taskGroupId && this.noCollide.includes(taskGroupId)) {
            return
        }

        if (this.activeRunnerCount < this.maxConcurrentRunners) {
            this.noCollide[this.activeRunnerCount] = taskGroupId
            this.activeRunnerCount++
            await this.run(this.activeRunnerCount - 1, taskGroupId)
        } else if (taskGroupId) {
            this.waitingGroups.push(taskGroupId)
        }
    }

    async run(runnerId: number, taskGroupId?: string) {
        const task = this.getTask(taskGroupId)
        if (!task) {
            if (this.waitingGroups.length !== 0) {
                taskGroupId = this.waitingGroups.shift()
                await this.run(runnerId, taskGroupId)
                return
            } else {
                this.activeRunnerCount--
                this.noCollide[runnerId] = undefined
                return
            }
        }

        try {
            await task()
        } catch (err) {
            console.error('Task failed:', err)
        } finally {
            await this.run(runnerId, taskGroupId)
        }
    }

    private async runWithNextRunner<T>({
        getNext,
        onFailure,
        initCtx,
    }: {
        getNext: (ctx: T) => Task<T, void> | undefined
        onFailure?: (err: Error) => void
        initCtx: T
    }) {
        let ctx: T = initCtx
        while (true) {
            const task = getNext(ctx)
            if (!task) {
                break // Exit if no more tasks are available
            }

            try {
                ctx = await task()
            } catch (err) {
                console.error('Task failed:', err)
                onFailure?.(err as Error)
                break // Exit on error
            }
        }
    }

    public async runWithNext<T>({
        getNext,
        initCtx,
        onFailure,
        groupId,
    }: {
        getNext: (ctx: T) => Task<T, void> | undefined
        initCtx: T
        onFailure?: (err: Error) => void
        groupId?: string
    }) {
        await this.addTask(() => this.runWithNextRunner({ getNext, onFailure, initCtx }), groupId)
    }

    private getTask(taskGroupId?: string): Task | undefined {
        if (taskGroupId) {
            return this.groupQueue.get(taskGroupId)?.shift()
        }

        return this.queue.shift()
    }
}
