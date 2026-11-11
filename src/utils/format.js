import { commonFields, categoryFields } from '../data/productFields';

export const money = (n) => `₹${Number(n || 0).toFixed(0)}`;

export const discounted = (price, percent) =>
  Number(price || 0) - (Number(price || 0) * Number(percent || 0)) / 100;

export const calcProductPrice = (item, quantity) =>
  Math.round(discounted(item?.price, item?.discount_percent) * quantity) || 0;

export const formatValue = (value, format) => {
  if (format) return format(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
};

export const getProductDetailRows = (item) => {
  const cat = (item?.main_category || '').toLowerCase().replace(/s$/, '');
  return [...commonFields, ...(categoryFields[cat] || [])].filter(([key]) => {
    const v = item?.[key];
    return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  });
};