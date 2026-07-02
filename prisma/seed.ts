// 開發用 seed：10 名假成員、空檔模式、範例預約、PALMS 快照
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function todayTaipei(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function nextWeekday(weekday: number, offset = 1): string {
  let d = addDays(todayTaipei(), offset);
  while (new Date(d + "T00:00:00Z").getUTCDay() !== weekday) d = addDays(d, 1);
  return d;
}

const MEMBERS = [
  { name: "王大明", company: "安心保險經紀", profession: "保險經紀", industryCategory: "金融保險", speechOrder: 1, avatarColor: "#C0574F", role: "officer" },
  { name: "林美惠", company: "美好家房屋", profession: "房屋仲介", industryCategory: "不動產", speechOrder: 2, avatarColor: "#3F6E8C", role: "member" },
  { name: "陳志豪", company: "豪傑法律事務所", profession: "律師", industryCategory: "專業服務", speechOrder: 3, avatarColor: "#5D7A46", role: "member" },
  { name: "張雅婷", company: "雅信會計師事務所", profession: "會計師", industryCategory: "專業服務", speechOrder: 4, avatarColor: "#8C5A79", role: "member" },
  { name: "李國榮", company: "榮域空間設計", profession: "室內設計", industryCategory: "居家工程", speechOrder: 5, avatarColor: "#A0742B", role: "member" },
  { name: "黃淑芬", company: "幸福婚禮企劃", profession: "婚禮顧問", industryCategory: "生活服務", speechOrder: 6, avatarColor: "#4F6F6A", role: "member" },
  { name: "吳建宏", company: "宏印輸出中心", profession: "印刷輸出", industryCategory: "商業服務", speechOrder: 7, avatarColor: "#7A5C46", role: "member" },
  { name: "劉心怡", company: "心創行銷顧問", profession: "行銷顧問", industryCategory: "商業服務", speechOrder: 8, avatarColor: "#54618C", role: "member" },
  { name: "蔡明哲", company: "明哲企業融資", profession: "企業貸款", industryCategory: "金融保險", speechOrder: 9, avatarColor: "#8C4F5F", role: "member" },
  { name: "郭佩珊", company: "珊瑚營養工作室", profession: "營養師", industryCategory: "健康醫療", speechOrder: 10, avatarColor: "#4E7A5D", role: "member" },
];

// [memberIdx, weekday, startMin, endMin]
const PATTERNS: [number, number, number, number][] = [
  [0, 2, 840, 1020], [0, 5, 540, 720],
  [1, 1, 600, 720], [1, 4, 840, 960],
  [2, 3, 960, 1080],
  [3, 2, 540, 660], [3, 5, 840, 1020],
  [4, 1, 900, 1080],
  [5, 4, 600, 720],
  [6, 3, 540, 720],
  [7, 2, 960, 1080],
  [8, 5, 600, 720],
  [9, 1, 540, 660],
];

async function main() {
  await db.notification.deleteMany();
  await db.booking.deleteMany();
  await db.availabilityOverride.deleteMany();
  await db.availabilityPattern.deleteMany();
  await db.palmsMemberStat.deleteMany();
  await db.palmsSnapshot.deleteMany();
  await db.member.deleteMany();

  const members: { id: number; name: string }[] = [];
  for (let i = 0; i < MEMBERS.length; i++) {
    members.push(
      await db.member.create({
        data: { ...MEMBERS[i], inviteCode: `FL${String(i + 1).padStart(3, "0")}` },
      }),
    );
  }

  for (const [mi, weekday, startMin, endMin] of PATTERNS) {
    await db.availabilityPattern.create({
      data: { memberId: members[mi].id, weekday, startMin, endMin },
    });
  }

  // 範例預約：待王大明回應、待對方確認、已確認、已完成×2
  const B = (r: number, c: number, date: string, startMin: number, status: string, message = "") =>
    db.booking.create({
      data: { requesterId: members[r].id, recipientId: members[c].id, date, startMin, status, message },
    });
  await B(1, 0, nextWeekday(2), 900, "requested", "大明您好，想聊聊保險與房產客戶互相引薦的機會！");
  await B(8, 0, nextWeekday(5, 2), 600, "requested", "想討論中小企業客戶的資金需求。");
  await B(0, 3, nextWeekday(5), 840, "confirmed", "雅婷好，想請教報稅相關，也介紹我的新服務。");
  await B(0, 2, addDays(todayTaipei(), -6), 960, "completed");
  await B(4, 0, addDays(todayTaipei(), -13), 900, "completed");

  await db.notification.create({
    data: {
      memberId: members[0].id,
      type: "booking_requested",
      title: "林美惠 想跟你約一對一",
      body: "等待你的回應",
      linkPath: "/bookings",
    },
  });

  // PALMS 快照（20 週）：涵蓋綠/黃/紅/灰
  const snap = await db.palmsSnapshot.create({
    data: { periodLabel: "2026/01—2026/06", weekCount: 20, importedBy: "seed" },
  });
  const stats = [
    { i: 0, absences: 0, referralsOut: 32, visitors: 4, oneToOnes: 22, ceu: 21, tyfcb: 120 }, // 綠
    { i: 1, absences: 1, referralsOut: 21, visitors: 2, oneToOnes: 16, ceu: 15, tyfcb: 60 },  // 綠
    { i: 2, absences: 2, referralsOut: 12, visitors: 1, oneToOnes: 10, ceu: 16, tyfcb: 30 },  // 黃（差一對一）
    { i: 3, absences: 0, referralsOut: 40, visitors: 1, oneToOnes: 10, ceu: 16, tyfcb: 10 },  // 黃（差一對一/培訓）
    { i: 4, absences: 1, referralsOut: 22, visitors: 2, oneToOnes: 21, ceu: 20, tyfcb: 55 },  // 綠
    { i: 5, absences: 4, referralsOut: 6, visitors: 0, oneToOnes: 5, ceu: 6, tyfcb: 8 },      // 紅
    { i: 6, absences: 1, referralsOut: 15, visitors: 1, oneToOnes: 12, ceu: 11, tyfcb: 25 },  // 黃
    { i: 7, absences: 0, referralsOut: 30, visitors: 2, oneToOnes: 15, ceu: 21, tyfcb: 70 },  // 綠
    { i: 8, absences: 2, referralsOut: 10, visitors: 0, oneToOnes: 8, ceu: 10, tyfcb: 15 },   // 紅/黃
  ];
  for (const s of stats) {
    await db.palmsMemberStat.create({
      data: {
        snapshotId: snap.id,
        memberName: members[s.i].name,
        memberId: members[s.i].id,
        absences: s.absences,
        referralsOut: s.referralsOut,
        visitors: s.visitors,
        oneToOnes: s.oneToOnes,
        ceu: s.ceu,
        tyfcb: s.tyfcb,
      },
    });
  }
  // 郭佩珊不在快照裡（模擬新成員 → 灰）

  console.log(`Seeded: ${members.length} members / ${PATTERNS.length} patterns / 5 bookings / 1 palms snapshot`);
}

main().finally(() => db.$disconnect());
