import styles from "@/css/AuthCard.module.css";

export default function AuthCard({ tagline, children, restaurantName }) {
  const displayName = restaurantName?.trim() || "My Restaurant";

  return (
    <div className={styles.loginCard}>
      <div className={styles.loginBrand}>
        <div className={styles.logoMark}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span>{displayName}</span>
      </div>
      {tagline ? <p className={styles.tagline}>{tagline}</p> : null}
      {children}
    </div>
  );
}
