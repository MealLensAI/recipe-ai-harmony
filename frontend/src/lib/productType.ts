/**
 * Product Type Management
 * Tracks which product variant the user has selected (normal/cooking or health/chronic disease)
 * Both products share the same authentication, payment, and backend
 */

export type ProductType = 'cooking' | 'health';

const PRODUCT_TYPE_KEY = 'meallensai_product_type';

/**
 * Set the user's preferred product type
 */
export const setProductType = (productType: ProductType): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCT_TYPE_KEY, productType);
  }
};

/**
 * Get the user's preferred product type
 * @returns The product type or null if not set
 */
export const getProductType = (): ProductType | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PRODUCT_TYPE_KEY);
  if (stored === 'cooking' || stored === 'health') {
    return stored as ProductType;
  }
  return null;
};

/**
 * Clear the product type preference
 */
export const clearProductType = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PRODUCT_TYPE_KEY);
  }
};

/**
 * Get product display name
 */
export const getProductDisplayName = (productType: ProductType): string => {
  return productType === 'cooking' 
    ? 'MealLensAI Cooking' 
    : 'MealLensAI Health';
};

/**
 * Get product description
 */
export const getProductDescription = (productType: ProductType): string => {
  return productType === 'cooking'
    ? 'End cooking burnout with AI-powered recipe suggestions and meal planning'
    : 'Improve your health through food with personalized meal plans for chronic conditions';
};
