export function formatCurrency(
  amount: number,
  locale: string = "en-US",
  currency: string = "ZAR"
): string {
  // Handle invalid amounts
  if (typeof amount !== "number" || isNaN(amount)) {
    return "R0.00";
  }

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);

    // Replace ZAR with R
    return formatted.replace("ZAR", "R");
  } catch (error) {
    // Fallback if formatting fails
    return `R${amount.toFixed(2)}`;
  }
}
