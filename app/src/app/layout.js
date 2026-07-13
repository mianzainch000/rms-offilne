import "@/css/globals.css";
import axiosClient from "@/config/axiosClient";
import NextLoader from "@/components/NextTopLoader";
import { SnackbarProvider } from "@/components/Snackbar";
import AxiosInterceptorSetup from "@/components/AxiosInterceptorSetup";

export async function generateMetadata() {
  let restaurantName = "";
  try {
    const res = await axiosClient.get("publicSettings");
    restaurantName = res.data?.restaurantName || "";
  } catch (e) {
    restaurantName = "";
  }
  const displayName = restaurantName?.trim() || "My Restaurant";

  return {
    title: {
      default: `${displayName} — Restaurant Billing & Management`,
      template: `%s — ${displayName}`,
    },
    description: "Manage tables, orders & billing for your restaurant.",
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SnackbarProvider>
          {" "}
          <AxiosInterceptorSetup />
          <NextLoader />
          {children}
        </SnackbarProvider>
        <div id="printArea"></div>
      </body>
    </html>
  );
}
