import { Dexie, type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
  minStock: number; // Reorder point
  icon: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  photo?: string;
  khataBalance: number;
  trustScore: number;
  visitValidation: number;
  lastVisit?: number;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: number;
}

export interface TransactionItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discountApplied?: number;
}

export interface Transaction {
  id?: number;
  timestamp: number;
  type: 'SALE' | 'PAYMENT' | 'RETURN';
  amount: number;
  items: TransactionItem[];
  customerId?: number;
  paymentMethod: 'CASH' | 'KHATA' | 'UPI' | 'CHECK';
  discountAmount?: number;
  invoiceNumber?: string;
}

export interface Payment {
  id?: number;
  customerId: number;
  amount: number;
  timestamp: number;
  type: 'PARTIAL' | 'FULL';
  paymentMethod: 'CASH' | 'UPI' | 'CHECK' | 'BANK';
  notes?: string;
  referenceNumber?: string;
}

export interface Discount {
  id?: number;
  name: string;
  type: 'PERCENTAGE' | 'FLAT' | 'BULK';
  value: number;
  minPurchase?: number;
  minQuantity?: number; // For bulk discounts
  applicableProducts?: number[]; // Empty = all products
  startDate: number;
  endDate: number;
  isActive: boolean;
  createdAt: number;
}

export interface StockMovement {
  id?: number;
  productId: number;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: string;
  timestamp: number;
  reference?: string;
}

export interface UserSettings {
  id?: string;
  darkMode: boolean;
  language: 'en' | 'hi';
  currency: string;
  timeZone: string;
  lastSyncTime: number;
}

export class GraminDB extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  payments!: Table<Payment>;
  discounts!: Table<Discount>;
  stockMovements!: Table<StockMovement>;
  userSettings!: Table<UserSettings>;

  constructor() {
    super('GraminDB');
    this.version(1).stores({
      products: '++id, name, category, minStock',
      customers: '++id, name, phone, khataBalance, createdAt',
      transactions: '++id, timestamp, type, customerId, paymentMethod',
      payments: '++id, customerId, timestamp',
      discounts: '++id, type, startDate, endDate, isActive',
      stockMovements: '++id, productId, timestamp',
      userSettings: 'id'
    });
  }
}

export const db = new GraminDB();
