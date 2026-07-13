import ui from "@/css/ui.module.css";

const MAP = {
  free: ui.badgeFree,
  occupied: ui.badgeOccupied,
  ready: ui.badgeReady,
  bill_pending: ui.badgeBillPending,
  closed: ui.badgeClosed,
  paid: ui.badgePaid,
  cancelled: ui.badgeCancelled,
  hold: ui.badgeHold,
  kitchen: ui.badgeKitchen,
  confirmed: ui.badgeConfirmed,
};

const LABELS = {
  free: "Free",
  occupied: "Occupied",
  ready: "Ready to Serve",
  bill_pending: "Bill Pending",
  closed: "Closed",
  paid: "Paid",
  cancelled: "Cancelled",
  hold: "Hold",
  kitchen: "In Kitchen",
  confirmed: "Confirmed",
};

export default function Badge({ status }) {
  return (
    <span className={`${ui.badge} ${MAP[status] || ""}`}>
      {LABELS[status] || status}
    </span>
  );
}
