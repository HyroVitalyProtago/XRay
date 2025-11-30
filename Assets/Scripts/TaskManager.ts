@component
export class TaskManager extends BaseScriptComponent {
    private static instance: TaskManager;
    public static getInstance(): TaskManager {
        if (!TaskManager.instance) {
            throw new Error(`
                Trying to get TaskManager instance, but it hasn't been set.
                You need to call it later (e.g. onStart) or add TaskManager in your scene.
            `);
        }
        return TaskManager.instance;
    }

    private tasks = []; // coroutines

    onAwake() {
        if (!TaskManager.instance) {
            TaskManager.instance = this;
        } else {
            throw new Error("TaskManager already has an instance. Aborting.")
        }
        this.createEvent('UpdateEvent').bind(this.update.bind(this));
    }

    private update() {
        this.runTasks()
    }

    // runningCallback is called on each intermediate value of coroutine
    public async runTask(coroutine, runningCallback?) {
        return await new Promise((resolve, reject) => {
            this.tasks.push({coroutine, resolve, reject, runningCallback})
        })
    }
    
    private runTasks() {
        for (let i = this.tasks.length - 1; i >= 0; i--) {
            const { coroutine, resolve, reject, runningCallback } = this.tasks[i]
            try {
                const { done, value } = coroutine.next()
                if (done) {
                    resolve(value)
                    this.tasks.splice(i, 1)
                } else if (value && runningCallback) {
                    runningCallback(value)
                }
            } catch(err) {
                this.tasks.splice(i, 1)
                reject(err)
            }
        }
    }
}