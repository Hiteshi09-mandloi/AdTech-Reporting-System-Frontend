export const formatNumber = (num: number, isFloat: boolean = false): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(isFloat ? 2 : 1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(isFloat ? 2 : 1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(isFloat ? 2 : 1)}K`;
  }
  return isFloat ? num.toFixed(2) : num.toString();
};