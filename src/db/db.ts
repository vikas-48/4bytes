import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  _id?: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  icon: string;
  category: string;
  unit: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Customer {
  id?: number;
  _id?: string;
  name: string;
  phoneNumber: string;
  khataScore: number;
  khataLimit: number;
  activeKhataAmount: number;
  maxHistoricalKhataAmount: number;
  lastScoreUpdate?: number;
  totalTransactions: number;
  khataTransactions: number;
  latePayments: number;
  lastPaymentDate?: number;
  createdAt: number;
}

export interface LedgerEntry {
  id?: number;
  customerId: string; // Phone number or UUID
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'KHATA' | 'DEBIT' | 'CREDIT';
  type: 'debit' | 'credit';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: number;
  paidAt?: number;
  items?: any[];
}

export class GraminLinkDB extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  ledger!: Table<LedgerEntry>;

  constructor() {
    super('GraminLinkDB');
    this.version(3).stores({
      products: '++id, _id, name, category',
      customers: '++id, _id, phoneNumber, khataScore',
      ledger: '++id, customerId, paymentMode, status, createdAt'
    });
  }
}

export const db = new GraminLinkDB();
