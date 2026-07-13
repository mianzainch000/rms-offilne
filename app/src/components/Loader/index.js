import styles from "@/css/Loader.module.css";

export default function Loader({
  label = "Loading…",
  inline = false,
  size = "md",
}) {
  return (
    <div className={`${styles.wrap} ${inline ? styles.wrapInline : ""}`}>
      <div
        className={`${styles.spinner} ${size === "sm" ? styles.spinnerSm : ""}`}
      />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
