'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CartContext = createContext(null);

export function CartProvider({ children, userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('cart_items')
      .select(`
        id, quantity,
        parts(id, part_number, name, name_en, description),
        machines(id, serial_number, nickname, machine_types(name)),
        custom_parts(id, part_number, name, name_en)
      `)
      .eq('customer_id', userId)
      .order('created_at');
    setItems(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadCart(); }, [loadCart]);

  async function addItem({ partId, machineId, customPartId }) {
    if (!userId) return;
    // Kijk of het item al in de winkelwagen zit
    const existing = items.find(i =>
      (partId && i.parts?.id === partId && i.machines?.id === machineId) ||
      (customPartId && i.custom_parts?.id === customPartId)
    );
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + 1);
      return;
    }
    const insert = { customer_id: userId, quantity: 1 };
    if (partId) { insert.part_id = partId; insert.machine_id = machineId; }
    if (customPartId) { insert.custom_part_id = customPartId; }
    await supabase.from('cart_items').insert(insert);
    loadCart();
  }

  async function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) { await removeItem(cartItemId); return; }
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    setItems(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity } : i));
  }

  async function removeItem(cartItemId) {
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    setItems(prev => prev.filter(i => i.id !== cartItemId));
  }

  async function clearCart() {
    if (!userId) return;
    await supabase.from('cart_items').delete().eq('customer_id', userId);
    setItems([]);
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, totalItems, addItem, updateQuantity, removeItem, clearCart, refreshCart: loadCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart moet binnen CartProvider gebruikt worden');
  return ctx;
}
