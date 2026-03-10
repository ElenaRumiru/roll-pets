export type OverlayTask = (next: () => void) => void;

export class OverlayQueue {
    private tasks: OverlayTask[] = [];
    private onAllComplete: (() => void) | null = null;
    private running = false;

    enqueue(task: OverlayTask): void {
        this.tasks.push(task);
    }

    start(onAllComplete: () => void): void {
        this.onAllComplete = onAllComplete;
        this.running = true;
        this.advance();
    }

    clear(): void {
        this.tasks = [];
        this.onAllComplete = null;
        this.running = false;
    }

    private advance(): void {
        if (!this.running) return;
        const task = this.tasks.shift();
        if (task) {
            task(() => this.advance());
        } else {
            this.running = false;
            const cb = this.onAllComplete;
            this.onAllComplete = null;
            cb?.();
        }
    }
}
