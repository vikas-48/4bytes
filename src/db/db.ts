// DEPRECATED: GraminDB (Dexie.js) is replaced by MongoDB Atlas.
// This file now only provides common interfaces.

export interface Product {
  _id?: string;
  id?: number; // legacy
  name: string;
  price: number;
  stock: number;
  minStock: number;
  icon: string;
  category: string;
  unit: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface Customer {
  _id?: string;
  id?: number; // legacy
  name?: string;
  phoneNumber: string; // updated from phone
  khataBalance: number;
  totalTransactions?: number;
  trustScore?: number;
  visitValidation?: number;
  lastVisit?: string | number;
  loyaltyPoints?: number;
  totalPurchases?: number;
  createdAt?: string | number;
}

// Dummy db implementation to prevent crash on minor untouched files
export const db: any = {
  products: { toArray: async () => [], add: async () => { }, update: async () => { }, count: async () => 0 },
  customers: { toArray: async () => [], add: async () => { }, update: async () => { }, where: () => ({ equals: () => ({ first: async () => null }) }) },
  ledger: { toArray: async () => [], add: async () => { }, reverse: () => ({ toArray: async () => [] }), orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }) },
  transactions: { toArray: async () => [], add: async () => { }, where: () => ({ above: () => ({ toArray: async () => [] }) }) },
  payments: { toArray: async () => [], add: async () => { } },
  transaction: async (mode: string, tables: string[], fn: Function) => await fn()
};
