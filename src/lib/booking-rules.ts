// 預約狀態機與權限規則（純函數）

import { BOOKING_STATUS, type BookingStatus } from "./constants";

export interface BookingLike {
  requesterId: number;
  recipientId: number;
  status: string;
}

const { REQUESTED, CONFIRMED, DECLINED, CANCELLED, COMPLETED } = BOOKING_STATUS;

/** 合法狀態轉換表 */
const TRANSITIONS: Record<string, BookingStatus[]> = {
  [REQUESTED]: [CONFIRMED, DECLINED, CANCELLED],
  [CONFIRMED]: [COMPLETED, CANCELLED],
  [DECLINED]: [],
  [CANCELLED]: [],
  [COMPLETED]: [],
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] ?? []).includes(to as BookingStatus);
}

/** 誰能執行哪個動作 */
export function canAct(b: BookingLike, actorId: number, to: BookingStatus): boolean {
  const isRequester = actorId === b.requesterId;
  const isRecipient = actorId === b.recipientId;
  if (!isRequester && !isRecipient) return false;
  if (!canTransition(b.status, to)) return false;

  switch (to) {
    case CONFIRMED:
    case DECLINED:
      return isRecipient; // 只有被約方能確認/婉拒
    case CANCELLED:
      // requested：發起方收回；雙方皆可取消 confirmed；requested 被約方用 declined 而非 cancelled
      return b.status === REQUESTED ? isRequester : true;
    case COMPLETED:
      return true; // 任一方可打卡完成
    default:
      return false;
  }
}

/** 改期提案：雙方皆可，但僅限 requested / confirmed */
export function canProposeReschedule(b: BookingLike, actorId: number): boolean {
  const involved = actorId === b.requesterId || actorId === b.recipientId;
  return involved && (b.status === REQUESTED || b.status === CONFIRMED);
}

/** 改期提案的「另一方」才能接受 */
export function canAcceptReschedule(
  b: BookingLike & { proposedById: number | null },
  actorId: number,
): boolean {
  if (b.proposedById == null) return false;
  const involved = actorId === b.requesterId || actorId === b.recipientId;
  return involved && actorId !== b.proposedById;
}
