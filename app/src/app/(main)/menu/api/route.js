import axiosClient from "@/config/axiosClient";
import { apiConfig } from "@/config/apiConfig";

export async function GET() {
  try {
    const res = await axiosClient.get(apiConfig.getMenuItems);
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

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await axiosClient.post(apiConfig.addMenuItem, body);
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
