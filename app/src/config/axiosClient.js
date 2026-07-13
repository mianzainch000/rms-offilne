import axios from "axios";
import https from "https";
import { cookies } from "next/headers";
import { apiConfig } from "./apiConfig";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const axiosClient = axios.create({
  baseURL: apiConfig.baseUrl,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
  httpsAgent,
});

axiosClient.interceptors.request.use(async function (config) {
  const cookieStore = await cookies();
  const sessionInfo = cookieStore.get("sessionToken");
  if (sessionInfo?.value) {
    config.headers["Authorization"] = `Bearer ${sessionInfo.value}`;
  }
  return config;
});

export default axiosClient;
