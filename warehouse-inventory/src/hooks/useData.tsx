import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from './useAuth.tsx';
import { calculateTotal } from '../lib/utils';

// 数据上下文接口
interface DataContextType {
  // 客户相关
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<boolean>;
  
  // 产品相关
  products: Product[];
  getProductsByCustomerId: (customerId: string) => Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // 客户产品关联
  customerProducts: CustomerProduct[];
  getCustomerProducts: (customerId: string) => CustomerProduct[];
  addCustomerProduct: (customerProduct: Omit<CustomerProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerProduct>;
  updateCustomerProduct: (id: string, customerProduct: Partial<CustomerProduct>) => Promise<CustomerProduct>;
  deleteCustomerProduct: (id: string) => Promise<boolean>;
  
  // 司机相关
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Driver>;
  updateDriver: (id: string, driver: Partial<Driver>) => Promise<Driver>;
  deleteDriver: (id: string) => Promise<boolean>;
  
  // 交易相关
  transactions: Transaction[];
  getTransactionsByQuery: (params: QueryParams) => Promise<PaginatedResponse<TransactionWithDetails>>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'paid' | 'isReversed'>) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  reverseTransaction: (id: string, reason: string) => Promise<Transaction>; // 红冲交易
  canDeleteProduct: (productId: string) => boolean; // 检查产品是否可删除
  getCustomerDebt: (customerId: string) => number; // 获取客户欠款
  
  // 加载状态
  isLoading: boolean;
}

// 创建数据上下文
const DataContext = createContext<DataContextType | undefined>(undefined);

// 数据提供者属性接口
interface DataProviderProps {
  children: ReactNode;
}

// 生成唯一ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 模拟客户数据
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: '张三建材店',
    phone: '13800138000',
    address: '北京市朝阳区建材街45号',
    debt: 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '李四五金店',
    phone: '13900139000',
    address: '北京市海淀区五金路23号',
    debt: 3200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '王五建筑材料有限公司',
    phone: '13700137000',
    address: '北京市丰台区建筑路78号',
    debt: 12000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 模拟产品数据
const mockProducts: Product[] = [
  {
    id: '1',
    name: '水泥',
    description: '通用型水泥',
    currentPrice: 50,
    unit: '袋',
    customerId: '1', // 关联到张三建材店
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '钢筋',
    description: '建筑用钢筋',
    currentPrice: 4500,
    unit: '吨',
    customerId: '1', // 关联到张三建材店
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '砖块',
    description: '标准红砖',
    currentPrice: 0.8,
    unit: '块',
    customerId: '2', // 关联到李四五金店
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: '水泥',
    description: '特种水泥',
    currentPrice: 55,
    unit: '袋',
    customerId: '2', // 关联到李四五金店
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: '钢筋',
    description: '高强度钢筋',
    currentPrice: 4800,
    unit: '吨',
    customerId: '3', // 关联到王五建筑材料有限公司
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 模拟客户产品关联数据
const mockCustomerProducts: CustomerProduct[] = [
  {
    id: '1',
    customerId: '1',
    productId: '1',
    price: 48,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    customerId: '1',
    productId: '2',
    price: 4300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    customerId: '2',
    productId: '3',
    price: 0.75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    customerId: '2',
    productId: '4',
    price: 52,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    customerId: '3',
    productId: '5',
    price: 4600,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 模拟司机数据
const mockDrivers: Driver[] = [
  {
    id: '1',
    name: '张三',
    phone: '13800138000',
    vehicle: '货车A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '李四',
    phone: '13900139000',
    vehicle: '货车B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 模拟交易数据
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: TransactionType.OUT,
    productId: '1',
    userId: '1',
    driverId: '1',
    quantity: 100,
    price: 48,
    date: new Date().toISOString(),
    notes: '销售100袋水泥',
    customerId: '1',
    paid: false,
    isReversed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: TransactionType.OUT,
    productId: '2',
    userId: '1',
    driverId: '2',
    quantity: 2,
    price: 4300,
    date: new Date().toISOString(),
    notes: '销售2吨钢筋',
    customerId: '1',
    paid: true,
    isReversed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 数据提供者组件
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用本地存储保存数据
  const [customers, setCustomers] = useLocalStorage<Customer[]>('warehouse-customers', mockCustomers);
  const [products, setProducts] = useLocalStorage<Product[]>('warehouse-products', mockProducts);
  const [customerProducts, setCustomerProducts] = useLocalStorage<CustomerProduct[]>('warehouse-customer-products', mockCustomerProducts);
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('warehouse-drivers', mockDrivers);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('warehouse-transactions', mockTransactions);

  // 客户相关操作
  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newCustomer: Customer = {
        ...customer,
        id: generateId(),
        debt: customer.debt || 0,
        createdAt: now,
        updatedAt: now,
      };
      
      setCustomers([...customers, newCustomer]);
      setIsLoading(false);
      return newCustomer;
    } catch (error) {
      console.error('添加客户失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedCustomers = customers.map(c => {
        if (c.id === id) {
          return {
            ...c,
            ...customer,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      
      setCustomers(updatedCustomers);
      setIsLoading(false);
      return updatedCustomers.find(c => c.id === id) as Customer;
    } catch (error) {
      console.error('更新客户失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCustomers(customers.filter(c => c.id !== id));
      // 同时删除该客户的所有产品
      setProducts(products.filter(p => p.customerId !== id));
      // 同时删除该客户的所有产品关联
      setCustomerProducts(customerProducts.filter(cp => cp.customerId !== id));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('删除客户失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 产品相关操作
  const getProductsByCustomerId = (customerId: string): Product[] => {
    return products.filter(p => p.customerId === customerId);
  };
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newProduct: Product = {
        ...product,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      
      setProducts([...products, newProduct]);
      setIsLoading(false);
      return newProduct;
    } catch (error) {
      console.error('添加产品失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedProducts = products.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...product,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      
      setProducts(updatedProducts);
      setIsLoading(false);
      return updatedProducts.find(p => p.id === id) as Product;
    } catch (error) {
      console.error('更新产品失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 检查产品是否可删除（有交易记录的产品不可删除）
  const canDeleteProduct = (productId: string): boolean => {
    return !transactions.some(t => t.productId === productId && !t.isReversed);
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 检查是否可以删除
      if (!canDeleteProduct(id)) {
        throw new Error('该产品已有交易记录，无法删除');
      }
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProducts(products.filter(p => p.id !== id));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('删除产品失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 客户产品关联操作
  const getCustomerProducts = (customerId: string): CustomerProduct[] => {
    return customerProducts.filter(cp => cp.customerId === customerId);
  };

  const addCustomerProduct = async (customerProduct: Omit<CustomerProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerProduct> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newCustomerProduct: CustomerProduct = {
        ...customerProduct,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      
      setCustomerProducts([...customerProducts, newCustomerProduct]);
      setIsLoading(false);
      return newCustomerProduct;
    } catch (error) {
      console.error('添加客户产品关联失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateCustomerProduct = async (id: string, customerProduct: Partial<CustomerProduct>): Promise<CustomerProduct> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedCustomerProducts = customerProducts.map(cp => {
        if (cp.id === id) {
          return {
            ...cp,
            ...customerProduct,
            updatedAt: new Date().toISOString(),
          };
        }
        return cp;
      });
      
      setCustomerProducts(updatedCustomerProducts);
      setIsLoading(false);
      return updatedCustomerProducts.find(cp => cp.id === id) as CustomerProduct;
    } catch (error) {
      console.error('更新客户产品关联失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const deleteCustomerProduct = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setCustomerProducts(customerProducts.filter(cp => cp.id !== id));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('删除客户产品关联失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 司机相关操作
  const addDriver = async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Promise<Driver> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      const newDriver: Driver = {
        ...driver,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      
      setDrivers([...drivers, newDriver]);
      setIsLoading(false);
      return newDriver;
    } catch (error) {
      console.error('添加司机失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateDriver = async (id: string, driver: Partial<Driver>): Promise<Driver> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedDrivers = drivers.map(d => {
        if (d.id === id) {
          return {
            ...d,
            ...driver,
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      
      setDrivers(updatedDrivers);
      setIsLoading(false);
      return updatedDrivers.find(d => d.id === id) as Driver;
    } catch (error) {
      console.error('更新司机失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const deleteDriver = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDrivers(drivers.filter(d => d.id !== id));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('删除司机失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 交易相关操作
  const getTransactionsByQuery = async (params: QueryParams): Promise<PaginatedResponse<TransactionWithDetails>> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredTransactions = [...transactions];
      
      // 应用筛选条件
      if (params.startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= params.startDate!);
      }
      
      if (params.endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= params.endDate!);
      }
      
      if (params.userId) {
        filteredTransactions = filteredTransactions.filter(t => t.userId === params.userId);
      }
      
      if (params.productId) {
        filteredTransactions = filteredTransactions.filter(t => t.productId === params.productId);
      }
      
      if (params.driverId) {
        filteredTransactions = filteredTransactions.filter(t => t.driverId === params.driverId);
      }
      
      if (params.type) {
        filteredTransactions = filteredTransactions.filter(t => t.type === params.type);
      }
      
      // 分页
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const total = filteredTransactions.length;
      const totalPages = Math.ceil(total / pageSize);
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      // 添加关联信息
      const transactionsWithDetails: TransactionWithDetails[] = paginatedTransactions.map(t => {
        const product = products.find(p => p.id === t.productId)!;
        const user = { id: t.userId, username: '', name: '用户' + t.userId, role: 'viewer', createdAt: '', updatedAt: '' } as User;
        const driver = t.driverId ? drivers.find(d => d.id === t.driverId) : undefined;
        const customer = customers.find(c => c.id === t.customerId);
        
        // 计算总金额
        const totalAmount = t.quantity * t.price;
        
        return {
          ...t,
          product,
          user,
          driver,
          customer,
          totalAmount,
        };
      });
      
      setIsLoading(false);
      return {
        data: transactionsWithDetails,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('获取交易记录失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 红冲交易
  const reverseTransaction = async (id: string, reason: string): Promise<Transaction> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedTransactions = transactions.map(t => {
        if (t.id === id) {
          return {
            ...t,
            isReversed: true,
            reversedBy: user?.id,
            reversedAt: new Date().toISOString(),
            reversedReason: reason,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      
      setTransactions(updatedTransactions);
      setIsLoading(false);
      return updatedTransactions.find(t => t.id === id) as Transaction;
    } catch (error) {
      console.error('红冲交易失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 获取客户欠款
  const getCustomerDebt = (customerId: string): number => {
    // 获取该客户的所有出库交易记录（销售记录）
    const customerTransactions = transactions.filter(t => {
      return t.customerId === customerId && t.type === TransactionType.OUT;
    });
    
    // 计算总欠款（不包括已支付和已红冲的交易）
    return customerTransactions.reduce((total, t) => {
      // 如果交易已支付或已红冲，则不计入欠款
      if (t.paid || t.isReversed) return total;
      return total + (t.quantity * t.price);
    }, 0);
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'paid' | 'isReversed'>): Promise<Transaction> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const now = new Date().toISOString();
      
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        paid: false, // 默认未支付
        isReversed: false, // 默认未红冲
        createdAt: now,
        updatedAt: now,
      };
      
      setTransactions([...transactions, newTransaction]);
      setIsLoading(false);
      return newTransaction;
    } catch (error) {
      console.error('添加交易记录失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedTransactions = transactions.map(t => {
        if (t.id === id) {
          const updatedTransaction = {
            ...t,
            ...transaction,
            updatedAt: new Date().toISOString(),
          };
          
          // 如果数量或价格变化，重新计算总金额
          if (transaction.quantity !== undefined || transaction.price !== undefined) {
            const quantity = transaction.quantity !== undefined ? transaction.quantity : t.quantity;
            const price = transaction.price !== undefined ? transaction.price : t.price;
            updatedTransaction.totalAmount = calculateTotal(quantity, price);
          }
          
          return updatedTransaction;
        }
        return t;
      });
      
      setTransactions(updatedTransactions);
      setIsLoading(false);
      return updatedTransactions.find(t => t.id === id) as Transaction;
    } catch (error) {
      console.error('更新交易记录失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setTransactions(transactions.filter(t => t.id !== id));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('删除交易记录失败:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // 上下文值
  const value = {
    // 客户相关
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    
    // 产品相关
    products,
    getProductsByCustomerId,
    addProduct,
    updateProduct,
    deleteProduct,
    canDeleteProduct,
    
    // 客户产品关联
    customerProducts,
    getCustomerProducts,
    addCustomerProduct,
    updateCustomerProduct,
    deleteCustomerProduct,
    
    // 司机相关
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
    
    // 交易相关
    transactions,
    getTransactionsByQuery,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    reverseTransaction,
    getCustomerDebt,
    
    // 加载状态
    isLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// 使用数据钩子
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData必须在DataProvider内部使用');
  }
  return context;
};