import Link from "next/link";
import Badge from "@/components/Badge";
import styles from "@/css/TableTile.module.css";

const ICONS = { free: "✓", occupied: "●", bill_pending: "⏱" };
const TILE_CLASS = {
  free: styles.free,
  occupied: styles.occupied,
  bill_pending: styles.billPending,
};

export default function TableTile({ table }) {
  return (
    <Link
      href="/order"
      className={`${styles.tile} ${TILE_CLASS[table.status] || ""}`}
    >
      <div className={styles.ticon}>{ICONS[table.status]}</div>
      <div className={styles.tname}>{table.name}</div>
      <div className={styles.tstatus}>
        <Badge status={table.status} />
      </div>
      <div className={styles.tmeta}>{table.meta}</div>
    </Link>
  );
}
