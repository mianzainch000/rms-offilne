"use client";
import { useRestaurantBrandingContext } from "@/components/RestaurantBrandingProvider";

export function useRestaurantBranding() {
  return useRestaurantBrandingContext();
}
