"use client";
import axios from "axios";
import { useEffect } from "react";
import { getCookie, deleteCookie } from "cookies-next";

let interceptorRegistered = false;

export default function AxiosInterceptorSetup() {
  useEffect(() => {
    if (interceptorRegistered) return;
    interceptorRegistered = true;

    axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err.response?.status;
        const logoutFlag = err.response?.data?.logout;

        if ((status === 401 || logoutFlag) && getCookie("user")) {
          deleteCookie("user");
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            window.location.href = "/login";
          }
        }

        return Promise.reject(err);
      },
    );
  }, []);

  return null;
}
