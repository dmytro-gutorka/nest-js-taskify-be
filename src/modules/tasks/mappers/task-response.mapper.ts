import {TaskResponse, TaskEntity} from "../task.types.js";
import {TaskStatusApiMap, TaskPriorityApiMap} from "../tasks.constants.js";

export function mapToTaskResponse(task: TaskEntity): TaskResponse {
    return {
        ...task,
        status: TaskStatusApiMap[task.status],
        priority: TaskPriorityApiMap[task.priority],
    };
}