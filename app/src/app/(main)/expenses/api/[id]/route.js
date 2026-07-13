import axiosClient from "@/config/axiosClient";
import { apiConfig } from "@/config/apiConfig";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await axiosClient.put(`${apiConfig.updateExpense}/${id}`, body);
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

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const res = await axiosClient.delete(`${apiConfig.deleteExpense}/${id}`);
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
