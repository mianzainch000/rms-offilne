import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("sessionToken");
  cookieStore.delete("user");
  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
  });
}
