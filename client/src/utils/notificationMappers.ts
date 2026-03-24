export type ApiNotificationType =
  | "achievement"
  | "challenge"
  | "friend"
  | "friend_request"
  | "reading"
  | "system"
  | "reminder";
export type UiNotificationType = "achievement" | "challenge" | "friend" | "reading" | "system" | "reminder";

export interface ApiNotification {
  id: number;
  user_id: string;
  type: ApiNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
}

export interface UiNotification {
  id: number;
  userId: string;
  type: UiNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export function toUiNotificationType(type: ApiNotificationType): UiNotificationType {
  if (type === "friend_request") return "friend";
  if (type === "friend") return "friend";
  if (type === "reading" || type === "reminder" || type === "achievement" || type === "challenge" || type === "system") {
    return type;
  }
  return "system";
}

export function toUiNotification(input: ApiNotification): UiNotification {
  return {
    id: input.id,
    userId: input.user_id,
    type: toUiNotificationType(input.type),
    title: input.title,
    message: input.message,
    read: input.is_read,
    createdAt: input.created_at,
    data: input.related_id ? { relatedId: input.related_id } : undefined,
  };
}
