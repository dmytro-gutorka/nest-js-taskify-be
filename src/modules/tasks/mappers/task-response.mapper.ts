import { TaskResponse, TaskEntity } from '../tasks.types.js';
import { TaskStatusToApiMap, TaskPriorityToApiMap } from '../tasks.constants.js';

export function mapToTaskResponse(task: TaskEntity): TaskResponse {
    return {
        ...task,
        status: TaskStatusToApiMap[task.status],
        priority: TaskPriorityToApiMap[task.priority],
    };
}
