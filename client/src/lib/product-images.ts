import { suntoryProductImages } from "@/lib/suntory-assets";

export const companyProductImages = suntoryProductImages;

export function getCompanyProductImage(index: number) {
  const normalizedIndex = Math.abs(index) % companyProductImages.length;
  return companyProductImages[normalizedIndex];
}