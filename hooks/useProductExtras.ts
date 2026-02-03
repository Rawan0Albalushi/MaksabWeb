'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Stock, Extra, Addon, TypedExtra, UiExtra, ExtrasType } from '@/types';

interface UseProductExtrasProps {
  stocks: Stock[];
  initialStock?: Stock;
}

interface UseProductExtrasReturn {
  selectedStock: Stock | null;
  typedExtras: TypedExtra[];
  selectedExtrasIndexes: number[];
  selectExtra: (groupIndex: number, extraIndex: number) => void;
  toggleAddon: (addonIndex: number) => void;
  incrementAddon: (addonIndex: number) => void;
  decrementAddon: (addonIndex: number) => void;
  calculateTotalPrice: (productQuantity: number) => number;
  getActiveAddons: () => Addon[];
  hasExtras: boolean;
  hasAddons: boolean;
}

/**
 * Hook for managing product extras and addons selection
 * 
 * Key concepts:
 * - Extras: Required selections that determine which stock (variant) is selected
 * - Addons: Optional items with quantities that add to the total price
 * - Each unique combination of extras maps to a specific stock_id
 */
export const useProductExtras = ({
  stocks,
  initialStock,
}: UseProductExtrasProps): UseProductExtrasReturn => {
  // Get the number of extra groups from the first stock
  const extraGroupsCount = useMemo(() => {
    if (!stocks.length || !stocks[0].extras?.length) return 0;
    return stocks[0].extras.length;
  }, [stocks]);

  // Initialize selected indexes (one index per extra group, all start at 0)
  const [selectedExtrasIndexes, setSelectedExtrasIndexes] = useState<number[]>(() => {
    return Array(extraGroupsCount).fill(0);
  });

  // Track addons state separately (active status and quantity)
  const [addonsState, setAddonsState] = useState<Map<number, { active: boolean; quantity: number }>>(new Map());

  // Build typed extras for UI rendering
  const typedExtras = useMemo((): TypedExtra[] => {
    if (!stocks.length || !extraGroupsCount) return [];

    const result: TypedExtra[] = [];

    for (let groupIndex = 0; groupIndex < extraGroupsCount; groupIndex++) {
      // Get available options for this group based on previous selections
      const availableStocks = filterStocksByPreviousSelections(stocks, selectedExtrasIndexes, groupIndex);
      
      // Get unique values for this group
      const uniqueValues = getUniqueExtraValues(availableStocks, groupIndex);
      
      // Get group info from first available stock
      const groupInfo = availableStocks[0]?.extras?.[groupIndex]?.group;
      
      if (!groupInfo || !uniqueValues.length) continue;

      const uiExtras: UiExtra[] = uniqueValues.map((value, index) => ({
        index,
        value,
        isSelected: index === selectedExtrasIndexes[groupIndex],
      }));

      result.push({
        groupId: groupInfo.id,
        groupIndex,
        type: (groupInfo.type as ExtrasType) || 'text',
        title: groupInfo.translation?.title || '',
        uiExtras,
      });
    }

    return result;
  }, [stocks, extraGroupsCount, selectedExtrasIndexes]);

  // Find the selected stock based on current extras selection
  const selectedStock = useMemo((): Stock | null => {
    if (!stocks.length) return null;
    if (!extraGroupsCount) return stocks[0];

    // Get the unique values for each group based on selections
    const selectedValues: string[] = [];
    let filteredStocks = [...stocks];

    for (let groupIndex = 0; groupIndex < extraGroupsCount; groupIndex++) {
      const uniqueValues = getUniqueExtraValues(filteredStocks, groupIndex);
      const selectedIndex = Math.min(selectedExtrasIndexes[groupIndex], uniqueValues.length - 1);
      const selectedValue = uniqueValues[selectedIndex];
      selectedValues.push(selectedValue);

      // Filter stocks for next iteration
      filteredStocks = filteredStocks.filter(
        stock => stock.extras?.[groupIndex]?.value === selectedValue
      );
    }

    return filteredStocks[0] || stocks[0];
  }, [stocks, extraGroupsCount, selectedExtrasIndexes]);

  // Initialize addons state when selected stock changes
  useEffect(() => {
    if (selectedStock?.addons) {
      const newAddonsState = new Map<number, { active: boolean; quantity: number }>();
      selectedStock.addons.forEach((addon, index) => {
        const existingState = addonsState.get(addon.id);
        newAddonsState.set(addon.id, {
          active: existingState?.active ?? addon.active ?? false,
          quantity: existingState?.quantity ?? addon.quantity ?? addon.product?.min_qty ?? 1,
        });
      });
      setAddonsState(newAddonsState);
    }
  }, [selectedStock?.id]);

  // Select an extra option
  const selectExtra = useCallback((groupIndex: number, extraIndex: number) => {
    setSelectedExtrasIndexes(prev => {
      const newIndexes = [...prev];
      newIndexes[groupIndex] = extraIndex;

      // Reset all subsequent group selections to 0
      for (let i = groupIndex + 1; i < newIndexes.length; i++) {
        newIndexes[i] = 0;
      }

      return newIndexes;
    });
  }, []);

  // Toggle addon active state
  const toggleAddon = useCallback((addonIndex: number) => {
    if (!selectedStock?.addons?.[addonIndex]) return;

    const addon = selectedStock.addons[addonIndex];
    setAddonsState(prev => {
      const newState = new Map(prev);
      const currentState = newState.get(addon.id);
      const newActive = !(currentState?.active ?? false);
      
      newState.set(addon.id, {
        active: newActive,
        quantity: newActive ? (addon.product?.min_qty ?? 1) : (currentState?.quantity ?? 1),
      });
      
      return newState;
    });
  }, [selectedStock?.addons]);

  // Increment addon quantity
  const incrementAddon = useCallback((addonIndex: number) => {
    if (!selectedStock?.addons?.[addonIndex]) return;

    const addon = selectedStock.addons[addonIndex];
    const maxQty = addon.product?.max_qty ?? Infinity;
    const stockQty = addon.stocks?.quantity ?? addon.product?.stocks?.[0]?.quantity ?? Infinity;
    const maxAllowed = Math.min(maxQty, stockQty);

    setAddonsState(prev => {
      const newState = new Map(prev);
      const currentState = newState.get(addon.id);
      const currentQty = currentState?.quantity ?? 1;

      if (currentQty < maxAllowed) {
        newState.set(addon.id, {
          active: currentState?.active ?? false,
          quantity: currentQty + 1,
        });
      }

      return newState;
    });
  }, [selectedStock?.addons]);

  // Decrement addon quantity
  const decrementAddon = useCallback((addonIndex: number) => {
    if (!selectedStock?.addons?.[addonIndex]) return;

    const addon = selectedStock.addons[addonIndex];
    const minQty = addon.product?.min_qty ?? 1;

    setAddonsState(prev => {
      const newState = new Map(prev);
      const currentState = newState.get(addon.id);
      const currentQty = currentState?.quantity ?? 1;

      if (currentQty > minQty) {
        newState.set(addon.id, {
          active: currentState?.active ?? false,
          quantity: currentQty - 1,
        });
      }

      return newState;
    });
  }, [selectedStock?.addons]);

  // Get active addons with their current state
  const getActiveAddons = useCallback((): Addon[] => {
    if (!selectedStock?.addons) return [];

    return selectedStock.addons
      .map(addon => {
        const state = addonsState.get(addon.id);
        return {
          ...addon,
          active: state?.active ?? false,
          quantity: state?.quantity ?? addon.product?.min_qty ?? 1,
        };
      })
      .filter(addon => addon.active && addon.quantity > 0);
  }, [selectedStock?.addons, addonsState]);

  // Helper function to get addon price from various possible fields
  const getAddonPrice = (addon: Addon): number => {
    // Check addon.stocks first (direct stock reference)
    if (addon.stocks) {
      return addon.stocks.total_price ?? addon.stocks.totalPrice ?? addon.stocks.price ?? 0;
    }
    
    // Check addon.product.stock (singular - common in API response)
    if (addon.product?.stock) {
      return addon.product.stock.total_price ?? addon.product.stock.totalPrice ?? addon.product.stock.price ?? 0;
    }
    
    // Check addon.product.stocks array
    if (addon.product?.stocks?.[0]) {
      const stock = addon.product.stocks[0];
      return stock.total_price ?? stock.totalPrice ?? stock.price ?? 0;
    }
    
    // Fallback to addon.price
    return addon.price ?? 0;
  };

  // Calculate total price including addons
  const calculateTotalPrice = useCallback((productQuantity: number): number => {
    if (!selectedStock) return 0;

    let addonsTotal = 0;

    selectedStock.addons?.forEach(addon => {
      const state = addonsState.get(addon.id);
      if (state?.active) {
        const addonPrice = getAddonPrice(addon);
        const addonQty = state.quantity ?? 1;
        addonsTotal += addonPrice * addonQty;
      }
    });

    const basePrice = selectedStock.total_price ?? selectedStock.totalPrice ?? selectedStock.price ?? 0;
    return (basePrice + addonsTotal) * productQuantity;
  }, [selectedStock, addonsState]);

  const hasExtras = extraGroupsCount > 0;
  const hasAddons = (selectedStock?.addons?.length ?? 0) > 0;

  return {
    selectedStock,
    typedExtras,
    selectedExtrasIndexes,
    selectExtra,
    toggleAddon,
    incrementAddon,
    decrementAddon,
    calculateTotalPrice,
    getActiveAddons,
    hasExtras,
    hasAddons,
    addonsState, // Expose addons state for UI
  };
};

// Helper: Filter stocks by previous selections
function filterStocksByPreviousSelections(
  stocks: Stock[],
  selectedIndexes: number[],
  currentGroupIndex: number
): Stock[] {
  let filtered = [...stocks];

  for (let i = 0; i < currentGroupIndex; i++) {
    const uniqueValues = getUniqueExtraValues(filtered, i);
    const selectedValue = uniqueValues[Math.min(selectedIndexes[i], uniqueValues.length - 1)];
    
    filtered = filtered.filter(stock => stock.extras?.[i]?.value === selectedValue);
  }

  return filtered;
}

// Helper: Get unique extra values for a group from stocks
function getUniqueExtraValues(stocks: Stock[], groupIndex: number): string[] {
  const values = stocks
    .map(stock => stock.extras?.[groupIndex]?.value)
    .filter((value): value is string => value !== undefined);

  return [...new Set(values)];
}

export default useProductExtras;
