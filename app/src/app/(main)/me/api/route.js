import axiosClient from "@/config/axiosClient";

export async function GET() {
  try {
    const res = await axiosClient.get("me");
    return new Response(JSON.stringify(res.data), { status: res.status });
  } catch (error) {
    return new Response(
      JSON.stringify({
        logout: error.response?.data?.logout || false,
        message: error.response?.data?.message || error.message,
      }),
      { status: error.response?.status || 500 },
    );
  }
}
