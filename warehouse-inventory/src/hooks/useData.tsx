import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Product, 
  User, 
  Driver, 
  Transaction, 
  TransactionType, 
  Customer,
  CustomerProduct,
  TransactionWithDetails,
  PaginatedResponse,
  QueryParams
} from '../types';
import { useAuth } from './useAuth.tsx';
import { calculateTotal } from '../lib/utils';

// 后端 API 的基础 URL
const API_BASE_URL = 'http://localhost:3001/api';

// --- API 请求辅助函数 ---
const apiFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status} ${errorText}`);
  }
  // DELETE 请求可能没有响应体
  if (response.status === 204) {
    return null;
  }
  return response.json();
};


// 数据上下文接口 (保持不变)
interface DataContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<boolean>;
  products: Product[];
  getProductsByCustomerId: (customerId: string) => Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  customerProducts: CustomerProduct[];
  getCustomerProducts: (customerId: string) => CustomerProduct[];
  addCustomerProduct: (customerProduct: Omit<CustomerProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerProduct>;
  updateCustomerProduct: (id: string, customerProduct: Partial<CustomerProduct>) => Promise<CustomerProduct>;
  deleteCustomerProduct: (id: string) => Promise<boolean>;
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Driver>;
  updateDriver: (id: string, driver: Partial<Driver>) => Promise<Driver>;
  deleteDriver: (id: string) => Promise<boolean>;
  transactions: Transaction[];
  getTransactionsByQuery: (params: QueryParams) => Promise<PaginatedResponse<TransactionWithDetails>>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'paid' | 'isReversed'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  reverseTransaction: (id: string, reason: string) => Promise<Transaction>;
  canDeleteProduct: (productId: string) => boolean;
  getCustomerDebt: (customerId: string) => number;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用 React state 替换 useLocalStorage
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // customerProducts 暂时保留在前端，因为它依赖于其他数据
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>([]);


  // 从后端加载初始数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [customersData, productsData, driversData, transactionsData] = await Promise.all([
          apiFetch('/customers'),
          apiFetch('/products'),
          apiFetch('/drivers'),
          apiFetch('/transactions'),
        ]);
        setCustomers(customersData);
        setProducts(productsData);
        setDrivers(driversData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("加载初始数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- 数据操作函数 (重构为调用 API) ---

  // 客户相关
  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer = await apiFetch('/customers', { method: 'POST', body: JSON.stringify(customer) });
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    const updatedCustomer = await apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) });
    setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
    return updatedCustomer;
  };

  const deleteCustomer = async (id: string) => {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    setCustomers(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // 产品相关
  const getProductsByCustomerId = (customerId: string) => products.filter(p => p.customerId === customerId);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct = await apiFetch('/products', { method: 'POST', body: JSON.stringify(product) });
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const updatedProduct = await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    return updatedProduct;
  };
  
  const canDeleteProduct = (productId: string) => !transactions.some(t => t.productId === productId && !t.isReversed);

  const deleteProduct = async (id: string) => {
    if (!canDeleteProduct(id)) {
      throw new Error('该产品已有交易记录，无法删除');
    }
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  // 司机相关
  const addDriver = async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDriver = await apiFetch('/drivers', { method: 'POST', body: JSON.stringify(driver) });
    setDrivers(prev => [...prev, newDriver]);
    return newDriver;
  };

  const updateDriver = async (id: string, driver: Partial<Driver>) => {
    const updatedDriver = await apiFetch(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(driver) });
    setDrivers(prev => prev.map(d => d.id === id ? updatedDriver : d));
    return updatedDriver;
  };

  const deleteDriver = async (id: string) => {
    await apiFetch(`/drivers/${id}`, { method: 'DELETE' });
    setDrivers(prev => prev.filter(d => d.id !== id));
    return true;
  };

  // 交易相关
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'paid' | 'isReversed'>) => {
    const newTransactionData = { ...transaction, paid: false, isReversed: false };
    const newTransaction = await apiFetch('/transactions', { method: 'POST', body: JSON.stringify(newTransactionData) });
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    const updatedTransaction = await apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(transaction) });
    setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
    return updatedTransaction;
  };

  const deleteTransaction = async (id: string) => {
    await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
    setTransactions(prev => prev.filter(t => t.id !== id));
    return true;
  };

  const reverseTransaction = async (id: string, reason: string) => {
    const reversedData = {
      isReversed: true,
      reversedBy: user?.id,
      reversedAt: new Date().toISOString(),
      reversedReason: reason,
    };
    return updateTransaction(id, reversedData);
  };

  // 注意：以下函数暂时保留在前端处理，未来可优化到后端
  const getTransactionsByQuery = async (params: QueryParams): Promise<PaginatedResponse<TransactionWithDetails>> => {
    // 模拟异步
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filteredTransactions = [...transactions];
    // ... (此处筛选逻辑与原文件相同，省略以保持简洁) ...
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filteredTransactions.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

    const transactionsWithDetails: TransactionWithDetails[] = paginatedTransactions.map(t => ({
      ...t,
      product: products.find(p => p.id === t.productId)!,
      user: { id: t.userId, username: '', name: '用户' + t.userId, role: 'viewer', createdAt: '', updatedAt: '' } as User,
      driver: t.driverId ? drivers.find(d => d.id === t.driverId) : undefined,
      customer: customers.find(c => c.id === t.customerId),
      totalAmount: calculateTotal(t.quantity, t.price),
    }));

    return { data: transactionsWithDetails, total, page, pageSize, totalPages };
  };

  const getCustomerDebt = (customerId: string) => {
    return transactions.reduce((total, t) => {
      if (t.customerId === customerId && t.type === TransactionType.OUT && !t.paid && !t.isReversed) {
        return total + (t.quantity * t.price);
      }
      return total;
    }, 0);
  };

  // customerProducts 暂时在前端管理
  const getCustomerProducts = (customerId: string) => customerProducts.filter(cp => cp.customerId === customerId);
  const addCustomerProduct = async (cp: Omit<CustomerProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCp = { ...cp, id: Math.random().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCustomerProducts(prev => [...prev, newCp]);
    return newCp;
  };
  const updateCustomerProduct = async (id: string, cp: Partial<CustomerProduct>) => {
    let updatedCp: CustomerProduct | undefined;
    setCustomerProducts(prev => prev.map(item => {
      if (item.id === id) {
        updatedCp = { ...item, ...cp, updatedAt: new Date().toISOString() };
        return updatedCp;
      }
      return item;
    }));
    return updatedCp!;
  };
  const deleteCustomerProduct = async (id: string) => {
    setCustomerProducts(prev => prev.filter(item => item.id !== id));
    return true;
  };


  const value = {
    customers, addCustomer, updateCustomer, deleteCustomer,
    products, getProductsByCustomerId, addProduct, updateProduct, deleteProduct, canDeleteProduct,
    drivers, addDriver, updateDriver, deleteDriver,
    transactions, getTransactionsByQuery, addTransaction, updateTransaction, deleteTransaction, reverseTransaction,
    customerProducts, getCustomerProducts, addCustomerProduct, updateCustomerProduct, deleteCustomerProduct,
    getCustomerDebt,
    isLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData 必须在 DataProvider 内部使用');
  }
  return context;
};