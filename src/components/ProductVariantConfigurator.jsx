import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";

function ProductVariantConfigurator({ product, onVariantChange }) {
  const { formatPrice } = useCurrency();
  const hasVariants = product?.variants && (product.variants.colors?.length > 0 || product.variants.options?.length > 0);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (!hasVariants) return;

    const initialColor = product.variants.colors?.[0] || null;
    const initialOption = product.variants.options?.[0] || null;

    setSelectedColor(initialColor);
    setSelectedOption(initialOption);
  }, [product, hasVariants]);

  useEffect(() => {
    if (!hasVariants) return;

    const activeImage = selectedColor?.image || product.image;
    const activePrice = Number(product.price) + Number(selectedOption?.priceDelta || 0);
    const activeStock = selectedOption !== null ? Number(selectedOption.stock) : Number(product.stock);
    const variantSummary = [selectedColor?.name, selectedOption?.label].filter(Boolean).join(" / ");

    onVariantChange({
      image: activeImage,
      price: activePrice,
      stock: activeStock,
      variantSummary
    });
  }, [selectedColor, selectedOption, product, hasVariants, onVariantChange]);

  if (!hasVariants) return null;

  return (
    <div className="variant-configurator-box">
      {/* Color Swatch Selector */}
      {product.variants.colors?.length > 0 && (
        <div className="variant-group">
          <label className="variant-label">
            Finish / Color: <strong>{selectedColor?.name}</strong>
          </label>
          <div className="color-swatches-row">
            {product.variants.colors.map((colorObj) => {
              const isSelected = selectedColor?.name === colorObj.name;
              return (
                <button
                  key={colorObj.name}
                  type="button"
                  title={colorObj.name}
                  className={`color-swatch-btn ${isSelected ? "selected" : ""}`}
                  style={{ backgroundColor: colorObj.hex }}
                  onClick={() => setSelectedColor(colorObj)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Storage / Size Selector */}
      {product.variants.options?.length > 0 && (
        <div className="variant-group">
          <label className="variant-label">
            Configuration / Size: <strong>{selectedOption?.label}</strong>
          </label>
          <div className="option-pills-row">
            {product.variants.options.map((opt) => {
              const isSelected = selectedOption?.label === opt.label;
              const isOut = opt.stock <= 0;
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`option-pill-btn ${isSelected ? "selected" : ""} ${isOut ? "out-of-stock-pill" : ""}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  <span className="pill-title">{opt.label}</span>
                  <span className="pill-delta">
                    {opt.priceDelta === 0 ? "Included" : `+${formatPrice(opt.priceDelta)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductVariantConfigurator;