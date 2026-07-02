"use client";

import Link from "next/link";
import { useState } from "react";

// 一對一目標計算機（BNI 大數據：每次一對一平均產生 1.5 張引薦單；每年以 50 週計）
const REFERRALS_PER_O2O = 1.5;
const WEEKS_PER_YEAR = 50;

export default function GoalCalcPage() {
  const [annualGoal, setAnnualGoal] = useState(1000); // 萬
  const [dealSize, setDealSize] = useState(15); // 萬
  const [closeRate, setCloseRate] = useState(70); // %

  const deals = dealSize > 0 ? Math.ceil(annualGoal / dealSize) : 0;
  const referrals = closeRate > 0 ? Math.ceil(deals / (closeRate / 100)) : 0;
  const o2oYear = Math.ceil(referrals / REFERRALS_PER_O2O);
  const o2oWeek = Math.ceil((o2oYear / WEEKS_PER_YEAR) * 10) / 10;

  const field = (
    label: string,
    value: number,
    set: (n: number) => void,
    unit: string,
  ) => (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-lg font-bold"
        />
        <span className="text-sm text-neutral-500">{unit}</span>
      </span>
    </label>
  );

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 py-6">
      <Link href="/me" className="mb-3 inline-block text-sm font-bold text-bni">‹ 返回</Link>
      <h1 className="text-xl font-extrabold">我的事業在 BNI 的目標</h1>
      <p className="mt-1 text-sm text-neutral-500">輸入你的數字，算出每週需要幾次一對一。</p>

      <div className="mt-5 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        {field("A. 預計在 BNI 獲得年營業額", annualGoal, setAnnualGoal, "萬")}
        {field("B. 每筆交易平均金額", dealSize, setDealSize, "萬")}
        {field("D. 成交率", closeRate, setCloseRate, "%")}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
        {[
          { v: `${deals} 件`, l: "C. 必須成交案件（A÷B）" },
          { v: `${referrals} 張`, l: "E. 所需引薦單（C÷D）" },
          { v: `${o2oYear} 次`, l: `G. 年度一對一（E÷${REFERRALS_PER_O2O}）` },
          { v: `${o2oWeek} 次`, l: "H. 每週一對一（G÷50 週）" },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="text-xl font-extrabold text-bni">{x.v}</div>
            <div className="mt-0.5 text-[11px] text-neutral-500">{x.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-bni p-4 text-center text-white">
        <p className="text-sm opacity-90">目標達成公式</p>
        <p className="mt-1 text-lg font-extrabold">每週至少安排 {Math.ceil(o2oWeek)} 次一對一</p>
        <Link href="/members" className="mt-3 block rounded-xl bg-white py-2.5 text-sm font-bold text-bni">
          現在就去約 →
        </Link>
      </div>
      <p className="mt-3 text-center text-[11px] text-neutral-400">
        ＊每次一對一產生 {REFERRALS_PER_O2O} 張引薦單為 BNI 大數據統計；每年以 {WEEKS_PER_YEAR} 週計
      </p>
    </div>
  );
}
