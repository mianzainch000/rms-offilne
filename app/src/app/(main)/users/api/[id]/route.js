import axiosClient from "@/config/axiosClient";

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const res = await axiosClient.put(`updateUser/${params.id}`, body);
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
    const res = await axiosClient.delete(`deleteUser/${params.id}`);
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
