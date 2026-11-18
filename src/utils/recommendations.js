
export function getPersonalizedRecommendations(
  products,
  wishlist,
  recentlyViewed,
  orders
) {
  if (!products || products.length === 0) {
    return {
      recommendedProducts: [],
      topCategory: "Popular Products",
    };
  }

  const categoryScores = {};

  // Wishlist preferences
  wishlist.forEach((item) => {
    const category = item.category;
    if (category) {
      categoryScores[category] =
        (categoryScores[category] || 0) + 3;
    }
  });

  // Recently viewed preferences
  recentlyViewed.forEach((item) => {
    const category = item.category;
    if (category) {
      categoryScores[category] =
        (categoryScores[category] || 0) + 2;
    }
  });

  // Previous order preferences
  orders.forEach((order) => {
    order.items?.forEach((item) => {
      const category = item.category;

      if (category) {
        categoryScores[category] =
          (categoryScores[category] || 0) + 5;
      }
    });
  });

  // Find the user's most preferred category
  const topCategory =
    Object.keys(categoryScores).sort(
      (a, b) => categoryScores[b] - categoryScores[a]
    )[0] || "Popular Products";

  // Exclude products already in wishlist
  const wishlistIds = wishlist.map((item) => String(item.id));

  // Exclude recently viewed products
  const viewedIds = recentlyViewed.map((item) => String(item.id));

  const recommendedProducts = products
    .filter((product) => product.stock > 0)
    .map((product) => {
      let score = 0;

      if (product.category === topCategory) {
        score += 10;
      }

      if (wishlistIds.includes(String(product.id))) {
        score += 3;
      }

      if (viewedIds.includes(String(product.id))) {
        score += 2;
      }

      return { ...product, recommendationScore: score };
    })
    .filter(
      (product) =>
        !wishlistIds.includes(String(product.id)) &&
        !viewedIds.includes(String(product.id))
    )
    .sort(
      (a, b) =>
        b.recommendationScore - a.recommendationScore
    )
    .slice(0, 8);

  return {
    recommendedProducts,
    topCategory,
  };
}
