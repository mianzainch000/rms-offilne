import axiosClient from "@/config/axiosClient";

export async function POST() {
  try {
    const res = await axiosClient.post("bootstrapRestoreFromCloud");
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
