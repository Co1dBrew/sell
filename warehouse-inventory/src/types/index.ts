/**
 * 用户角色类型
 */
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * 客户信息接口
 */
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  debt?: number; // 欠款金额
  createdAt: string;
  updatedAt: string;
}

/**
 * 产品信息接口
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  currentPrice: number;
  unit: string;
  customerId?: string; // 关联的客户ID
  createdAt: string;
  updatedAt: string;
}

/**
 * 客户产品关联接口
 */
export interface CustomerProduct {
  id: string;
  customerId: string;
  productId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 司机信息接口
 */
export interface Driver {
  id: string;
  name: string;
  phone?: string;
  vehicle?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 交易类型枚举
 */
export enum TransactionType {
  IN = 'in',
  OUT = 'out',
}

/**
 * 交易记录接口
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  userId: string;
  customerId: string; // 客户ID
  driverId?: string;
  quantity: number;
  price: number;
  date: string;
  notes?: string;
  paid: boolean; // 是否已付款
  isReversed: boolean; // 是否已红冲
  reversedBy?: string; // 红冲操作的用户ID
  reversedAt?: string; // 红冲时间
  reversedReason?: string; // 红冲原因
  createdAt: string;
  updatedAt: string;
}

/**
 * 带关联信息的交易记录接口
 */
export interface TransactionWithDetails extends Transaction {
  product: Product;
  user: User;
  customer?: Customer; // 客户信息
  driver?: Driver;
  totalAmount: number; // 总金额
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 查询参数接口
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  productId?: string;
  driverId?: string;
  type?: TransactionType;
}