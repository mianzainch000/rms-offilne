"use client";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

const RestaurantBrandingContext = createContext("");

export function RestaurantBrandingProvider({ initialName = "", children }) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/publicSettings")
      .then((res) => {
        if (mounted && res.data?.restaurantName) {
          setName(res.data.restaurantName);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <RestaurantBrandingContext.Provider value={name}>
      {children}
    </RestaurantBrandingContext.Provider>
  );
}

export function useRestaurantBrandingContext() {
  return useContext(RestaurantBrandingContext);
}
