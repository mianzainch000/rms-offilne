import { cookies } from "next/headers";
import axiosClient from "@/config/axiosClient";
import { apiConfig } from "@/config/apiConfig";

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await axiosClient.post(apiConfig.login, body);

    const { token, user } = res.data;
    const cookieStore = await cookies();

    cookieStore.set("user", JSON.stringify(user), {
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    cookieStore.set("sessionToken", token, {
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });

    return new Response(JSON.stringify(res.data), { status: res.status });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: error.response?.data?.message || error.message,
      }),
      { status: error.response?.status || 500 },
    );
  }
}
