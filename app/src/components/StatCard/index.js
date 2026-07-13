import ui from "@/css/ui.module.css";

export default function StatCard({ label, value, sub }) {
  return (
    <div className={`${ui.card} ${ui.statCard}`}>
      <div className={ui.label}>{label}</div>
      <div className={ui.val}>{value}</div>
      {sub ? <div className={ui.sub}>{sub}</div> : null}
    </div>
  );
}
