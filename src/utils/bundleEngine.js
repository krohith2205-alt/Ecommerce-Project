export function getFrequentlyBoughtTogether(currentProduct, allProducts) {
  if (!currentProduct || !allProducts || allProducts.length < 3) return [];

  // Find products in the same category or related categories
  const categoryMatches = allProducts.filter(
    (p) => p.category === currentProduct.category && p.id !== currentProduct.id
  );

  // Find other popular products as fallback
  const fallbackProducts = allProducts.filter((p) => p.id !== currentProduct.id);

  // Select up to 2 complementary items to bundle with the current product
  const item1 = categoryMatches[0] || fallbackProducts[0];
  const item2 = categoryMatches[1] || fallbackProducts[1];

  if (!item1 || !item2) return [];

  return [currentProduct, item1, item2];
}