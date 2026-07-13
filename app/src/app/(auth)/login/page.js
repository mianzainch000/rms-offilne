import LoginTemplate from "./template";
import axiosClient from "@/config/axiosClient";

export const metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  let signupOpen = true;
  try {
    const res = await axiosClient.get("signupStatus");
    signupOpen = res.data?.open !== false;
  } catch (e) {
    signupOpen = true;
  }

  return <LoginTemplate signupOpen={signupOpen} />;
}
