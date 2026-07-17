export type CartLineItem = { productSlug?: string; optionId?: string };

export function getCartLineItemCount(items: readonly CartLineItem[]) {
  return items.length;
}
