export function pLimit(concurrency: number) {
    let active = 0;
    const queue: (() => void)[] = [];

    const next = () => {
        if (active < concurrency && queue.length > 0) {
            const task = queue.shift();
            if (task) {
                active++;
                task();
            }
        }
    };

    return async <T>(fn: () => Promise<T>): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const task = async () => {
                try {
                    resolve(await fn());
                } catch (e) {
                    reject(e);
                } finally {
                    active--;
                    next();
                }
            };
            queue.push(task);
            next();
        });
    };
}
