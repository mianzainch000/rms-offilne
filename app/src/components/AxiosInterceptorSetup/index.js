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

                // Only treat this as "session expired" if the user was actually
                // logged in (a "user" cookie exists). This keeps /login,
                // /forgotpassword, /signup etc. unaffected, since those pages
                // never have a "user" cookie and their own 401s (e.g. wrong
                // password) are meant to be shown on that same page, not
                // redirected away from.
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