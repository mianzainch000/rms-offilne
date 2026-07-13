import axiosClient from "@/config/axiosClient";
import styles from "@/css/AuthLayout.module.css";
import { RestaurantBrandingProvider } from "@/components/RestaurantBrandingProvider";

export default async function AuthLayout({ children }) {
  let restaurantName = "";
  try {
    const res = await axiosClient.get("publicSettings");
    restaurantName = res.data?.restaurantName || "";
  } catch (e) {
    restaurantName = "";
  }

  return (
    <RestaurantBrandingProvider initialName={restaurantName}>
      <div className={styles.authScreen}>{children}</div>
    </RestaurantBrandingProvider>
  );
}
