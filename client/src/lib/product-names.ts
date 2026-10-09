export function formatCompanyProductName(name: string | undefined, productId?: number) {
  const originalName = name?.trim() || "";

  if (!originalName) return productId ? `Produit Suntory ${productId}` : "Produit Suntory";

  return originalName.replace(/\bTELD\b/gi, "Suntory");
}