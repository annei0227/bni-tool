export const BOOKING_STATUS = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const OVERRIDE_TYPE = {
  EXTRA: "extra",
  BLOCK: "block",
} as const;
export type OverrideType = (typeof OVERRIDE_TYPE)[keyof typeof OVERRIDE_TYPE];

export const ROLE = {
  MEMBER: "member",
  OFFICER: "officer",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const SLOT_DURATION_MIN = 60; // 一對一固定 60 分鐘一格
export const BOOKING_WINDOW_DAYS = 14; // 可預約未來天數

export const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"] as const;
