export function evaluateBargainOffer({
  product,
  offeredPrice,
  userLoyaltyPoints = 0,
  cartCount = 0,
  attemptNumber = 1
}) {
  const originalPrice = Number(product.price);
  const stock = Number(product.stock || 0);

  // 1. Calculate dynamic maximum discount % (base 10% + bonuses up to 22%)
  let maxDiscountRate = 0.10;
  if (userLoyaltyPoints >= 200) maxDiscountRate += 0.05; // VIP loyalty bonus
  if (cartCount >= 2) maxDiscountRate += 0.04;           // Bundle buyer bonus
  if (stock > 10) maxDiscountRate += 0.03;               // Overstock clearance bonus

  const floorPrice = Math.round(originalPrice * (1 - maxDiscountRate));
  const midCounterPrice = Math.round((originalPrice + floorPrice) / 2);

  // 2. Reject invalid or absurdly low offers (< 50% of original price)
  if (isNaN(offeredPrice) || offeredPrice <= 0) {
    return {
      status: "invalid",
      reply: "Please enter a valid numeric price offer (e.g., 18500)."
    };
  }

  if (offeredPrice < originalPrice * 0.5) {
    return {
      status: "rejected",
      reply: `Whoa, ₹${offeredPrice.toLocaleString()} is way below our warehouse cost! Give me a realistic offer closer to ₹${midCounterPrice.toLocaleString()}.`
    };
  }

  // 3. Accept if offer is >= floorPrice
  if (offeredPrice >= floorPrice) {
    const finalPrice = Math.min(offeredPrice, originalPrice);
    const discountAmount = originalPrice - finalPrice;

    if (discountAmount <= 0) {
      return {
        status: "accepted_full",
        reply: `Deal! You offered the full price of ₹${originalPrice.toLocaleString()}. Add it straight to your cart!`
      };
    }

    return {
      status: "accepted",
      finalPrice,
      discountAmount,
      reply: `🤝 Deal! Because you're a valued ShopSphere shopper${
        userLoyaltyPoints >= 200 ? ` with ${userLoyaltyPoints} loyalty points` : ""
      }, I accept ₹${finalPrice.toLocaleString()} (You save ₹${discountAmount.toLocaleString()}). Grab your 3-minute flash code below!`
    };
  }

  // 4. Generate Counter-Offer if offer is below floorPrice
  const counterPrice = attemptNumber >= 2 ? floorPrice : midCounterPrice;
  const counterDiscount = originalPrice - counterPrice;

  return {
    status: "counter",
    counterPrice,
    discountAmount: counterDiscount,
    reply:
      attemptNumber >= 2
        ? `My absolute lowest manager-approved price is ₹${floorPrice.toLocaleString()} (saving you ₹${counterDiscount.toLocaleString()}). Take it before the timer runs out!`
        : `I can't go as low as ₹${offeredPrice.toLocaleString()} with only ${stock} units left in stock—but I can meet you at ₹${midCounterPrice.toLocaleString()}! Want to lock that in, or try one more offer?`
  };
}