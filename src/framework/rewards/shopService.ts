import { INITIAL_SHOP_ITEMS, SHOP_ITEMS_BY_ID } from '../../config/rewards/shopItems';
import { debitWallet } from '../economy/personalWallet';
import type {
  CosmeticSlot,
  FrameworkState,
  ShopItemDefinition,
  StudioThemeId,
} from '../types';

export interface PurchaseEvaluation {
  canBuy: boolean;
  reason?: string;
}

export function evaluateShopPurchase(
  state: Pick<FrameworkState, 'wallet' | 'inventory'>,
  itemId: string
): PurchaseEvaluation {
  const item = SHOP_ITEMS_BY_ID[itemId];
  if (!item) {
    return { canBuy: false, reason: 'Item not found in shop catalog.' };
  }
  if (state.inventory.ownedItemIds.includes(itemId)) {
    return { canBuy: false, reason: 'You already own this item.' };
  }
  if (state.wallet.balance < item.price) {
    return {
      canBuy: false,
      reason: `Need ${item.price - state.wallet.balance} more coins to unlock ${item.name}.`,
    };
  }
  return { canBuy: true };
}

export function purchaseShopItem(
  state: FrameworkState,
  itemId: string,
  timestamp?: string
): { state: FrameworkState; ok: boolean; error?: string } {
  const item = SHOP_ITEMS_BY_ID[itemId];
  const check = evaluateShopPurchase(state, itemId);
  if (!check.canBuy || !item) {
    return { state, ok: false, error: check.reason ?? 'Cannot purchase item.' };
  }

  const debitResult = debitWallet(
    state.wallet,
    item.price,
    `Purchased ${item.name}`,
    {
      type: 'shop_purchase',
      relatedItemId: item.id,
      timestamp,
    }
  );
  if (!debitResult.ok) {
    return { state, ok: false, error: debitResult.error };
  }

  return {
    ok: true,
    state: {
      ...state,
      wallet: debitResult.wallet,
      inventory: {
        ownedItemIds: [...state.inventory.ownedItemIds, item.id],
        // Automatically equip newly bought cosmetic in its slot for instant joy
        equippedSlots: {
          ...state.inventory.equippedSlots,
          [item.slot]: item.id,
        },
      },
    },
  };
}

export function equipShopItem(
  state: FrameworkState,
  itemId: string
): FrameworkState {
  const item = SHOP_ITEMS_BY_ID[itemId];
  if (!item || !state.inventory.ownedItemIds.includes(itemId)) {
    return state;
  }

  return {
    ...state,
    inventory: {
      ...state.inventory,
      equippedSlots: {
        ...state.inventory.equippedSlots,
        [item.slot]: item.id,
      },
    },
  };
}

export function unequipShopItem(
  state: FrameworkState,
  itemId: string
): FrameworkState {
  const item = SHOP_ITEMS_BY_ID[itemId];
  if (!item) {
    return state;
  }
  const currentInSlot = state.inventory.equippedSlots[item.slot];
  if (currentInSlot !== itemId) {
    return state;
  }

  const nextSlots: Partial<Record<CosmeticSlot, string>> = {
    ...state.inventory.equippedSlots,
  };
  delete nextSlots[item.slot];

  return {
    ...state,
    inventory: {
      ...state.inventory,
      equippedSlots: nextSlots,
    },
  };
}

export function isShopItemEquipped(
  inventory: FrameworkState['inventory'],
  itemId: string
): boolean {
  const item = SHOP_ITEMS_BY_ID[itemId];
  if (!item) {
    return false;
  }
  return inventory.equippedSlots[item.slot] === itemId;
}

export function getActiveStudioTheme(
  inventory: FrameworkState['inventory']
): StudioThemeId {
  const equippedThemeId = inventory.equippedSlots.theme;
  if (!equippedThemeId) {
    return 'default';
  }
  const item = SHOP_ITEMS_BY_ID[equippedThemeId];
  return item?.themeValue ?? 'default';
}

export function getEquippedCosmeticIds(
  inventory: FrameworkState['inventory']
): string[] {
  return Object.values(inventory.equippedSlots).filter(
    (value): value is string => Boolean(value)
  );
}

export function listShopCatalog(): ShopItemDefinition[] {
  return INITIAL_SHOP_ITEMS;
}
