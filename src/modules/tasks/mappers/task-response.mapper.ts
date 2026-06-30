import {
    TaskResponse,
    TaskEntity,
    TaskMapItemResponse,
    TaskNearbyItemResponse,
    TaskEntityWithDistance,
} from '../tasks.types.js';
import { TaskStatusToApiMap, TaskPriorityToApiMap } from '../tasks.constants.js';

export function mapToTaskResponse(task: TaskEntity): TaskResponse {
    return {
        authorId: task.authorId,
        id: task.id,
        title: task.title,
        description: task.description,
        status: TaskStatusToApiMap[task.status],
        priority: TaskPriorityToApiMap[task.priority],
        deadline: task.deadline,
        isPrivate: task.isPrivate,
        latitude: task.latitude,
        longitude: task.longitude,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
}

export function mapToTaskMapItemResponse(task: TaskEntity): TaskMapItemResponse {
    return {
        id: task.id,
        title: task.title,
        status: TaskStatusToApiMap[task.status],
        priority: TaskPriorityToApiMap[task.priority],
        latitude: task.latitude!,
        longitude: task.longitude!,
    };
}

export function mapToTaskNearbyItemResponse(task: TaskEntityWithDistance): TaskNearbyItemResponse {
    return {
        id: task.id,
        title: task.title,
        status: TaskStatusToApiMap[task.status],
        priority: TaskPriorityToApiMap[task.priority],
        latitude: task.latitude!,
        longitude: task.longitude!,
        distance: task.distance,
    };
}
