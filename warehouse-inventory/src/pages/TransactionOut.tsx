import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth.tsx';
import { Product, Driver, TransactionType, Customer } from '../types';
import { calculateTotal, formatCurrency } from '../lib/utils';

export const TransactionOut: React.FC = () => {
  const { user } = useAuth();
  const { 
    customers, 
    products, 
    drivers, 
    addTransaction, 
    getProductsByCustomerId,
    addCustomer,
    addProduct
  } = useData();
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customerProducts, setCustomerProducts] = useState<Product[]>([]);
  
  // 新增客户相关状态
  const [showAddCustomer, setShowAddCustomer] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  
  // 新增商品相关状态
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductUnit, setNewProductUnit] = useState<string>('袋');

  // 当选择客户时，获取该客户的产品列表
  useEffect(() => {
    if (selectedCustomer) {
      const customerProds = getProductsByCustomerId(selectedCustomer);
      setCustomerProducts(customerProds);
      // 重置选中的产品
      setSelectedProduct('');
      setPrice(0);
    } else {
      setCustomerProducts([]);
    }
  }, [selectedCustomer, getProductsByCustomerId]);

  // 当选择产品时，设置对应的价格
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        setPrice(product.currentPrice);
      }
    }
  }, [selectedProduct, products]);

  // 当数量或价格变化时，计算总金额
  useEffect(() => {
    setTotalAmount(calculateTotal(quantity, price));
  }, [quantity, price]);

  // 处理新增客户
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      setMessage({ type: 'error', text: '请输入客户名称' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const newCustomer = await addCustomer({
        name: newCustomerName.trim(),
        phone: '',
        address: '',
        debt: 0
      });
      
      // 重置表单并选中新客户
      setNewCustomerName('');
      setShowAddCustomer(false);
      setSelectedCustomer(newCustomer.id);
      
      setMessage({ type: 'success', text: '客户已成功添加' });
    } catch (error) {
      console.error('添加客户失败:', error);
      setMessage({ type: 'error', text: '添加客户失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理新增商品
  const handleAddProduct = async () => {
    if (!selectedCustomer) {
      setMessage({ type: 'error', text: '请先选择客户' });
      return;
    }
    
    if (!newProductName.trim() || newProductPrice <= 0) {
      setMessage({ type: 'error', text: '请输入完整的商品信息' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const newProduct = await addProduct({
        name: newProductName.trim(),
        description: '',
        currentPrice: newProductPrice,
        unit: newProductUnit || '袋',
        customerId: selectedCustomer
      });
      
      // 重置表单并选中新商品
      setNewProductName('');
      setNewProductPrice(0);
      setNewProductUnit('袋');
      setShowAddProduct(false);
      
      // 更新客户产品列表
      setCustomerProducts([...customerProducts, newProduct]);
      setSelectedProduct(newProduct.id);
      
      setMessage({ type: 'success', text: '商品已成功添加' });
    } catch (error) {
      console.error('添加商品失败:', error);
      setMessage({ type: 'error', text: '添加商品失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !selectedProduct || quantity <= 0 || price <= 0) {
      setMessage({ type: 'error', text: '请填写完整的出库信息' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await addTransaction({
        type: TransactionType.OUT,
        productId: selectedProduct,
        userId: user!.id,
        driverId: selectedDriver || undefined,
        quantity,
        price,
        date: new Date().toISOString(),
        notes: notes || undefined,
        customerId: selectedCustomer, // 添加客户ID
      });
      
      // 重置表单
      setQuantity(1);
      setSelectedDriver('');
      setNotes('');
      
      setMessage({ type: 'success', text: '出库记录已成功添加' });
    } catch (error) {
      console.error('添加出库记录失败:', error);
      setMessage({ type: 'error', text: '添加出库记录失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">销售记录</h1>
        <p className="text-gray-500">添加新的商品销售记录</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 客户选择 */}
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                客户
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <select
                  id="customer"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  disabled={isLoading || showAddCustomer}
                  className="flex-1 min-w-0 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                >
                  <option value="">选择客户</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                  <option value="new">+ 新增客户</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {showAddCustomer ? '取消' : '新增'}
                </button>
              </div>
            </div>

            {/* 新增客户表单 */}
            {showAddCustomer && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">新增客户</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newCustomerName" className="block text-sm font-medium text-gray-700">
                      客户名称
                    </label>
                    <input
                      type="text"
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      disabled={isLoading || !newCustomerName.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isLoading ? '保存中...' : '保存客户'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 产品选择 */}
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                产品
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  disabled={isLoading || !selectedCustomer || showAddProduct}
                  className="flex-1 min-w-0 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  required
                >
                  <option value="">选择产品</option>
                  {customerProducts && customerProducts.length > 0 ? (
                    customerProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.unit})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>该客户暂无产品</option>
                  )}
                  <option value="new">+ 新增商品</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  disabled={!selectedCustomer}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {showAddProduct ? '取消' : '新增'}
                </button>
              </div>
            </div>

            {/* 新增商品表单 */}
            {showAddProduct && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">新增商品</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="newProductName" className="block text-sm font-medium text-gray-700">
                      商品名称
                    </label>
                    <input
                      type="text"
                      id="newProductName"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newProductPrice" className="block text-sm font-medium text-gray-700">
                      单价 (元)
                    </label>
                    <input
                      type="number"
                      id="newProductPrice"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newProductUnit" className="block text-sm font-medium text-gray-700">
                      单位
                    </label>
                    <select
                      id="newProductUnit"
                      value={newProductUnit}
                      onChange={(e) => setNewProductUnit(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option value="袋">袋</option>
                      <option value="吨">吨</option>
                      <option value="块">块</option>
                      <option value="个">个</option>
                      <option value="箱">箱</option>
                      <option value="桶">桶</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={isLoading || !newProductName.trim() || newProductPrice <= 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isLoading ? '保存中...' : '保存商品'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 数量 */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                数量
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                disabled={isLoading || !selectedProduct}
                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>

            {/* 单价 */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                单价 (元)
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                step="0.01"
                disabled={isLoading || !selectedProduct}
                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>

            {/* 总金额 */}
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                总金额 (元)
              </label>
              <input
                type="text"
                id="totalAmount"
                value={formatCurrency(totalAmount)}
                readOnly
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-50 rounded-md shadow-sm focus:outline-none sm:text-sm"
              />
            </div>

            {/* 司机 */}
            <div>
              <label htmlFor="driver" className="block text-sm font-medium text-gray-700">
                送货司机
              </label>
              <select
                id="driver"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">选择司机 (可选)</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} {driver.vehicle ? `(${driver.vehicle})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 备注 */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLoading}
                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !selectedCustomer || !selectedProduct || quantity <= 0 || price <= 0}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? '保存中...' : '保存销售记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
