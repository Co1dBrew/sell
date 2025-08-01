import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { Product, Driver, TransactionType } from '../types';
import { calculateTotal, formatCurrency } from '../lib/utils';

export const TransactionIn: React.FC = () => {
  const { user } = useAuth();
  const { products, drivers, addTransaction, userProducts, getUserProducts } = useData();
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userProductsList, setUserProductsList] = useState<Product[]>([]);

  // 当用户选择产品时，设置对应的价格
  useEffect(() => {
    if (selectedProduct && user) {
      // 获取该用户的产品价格
      const userProductList = getUserProducts(user.id);
      const userProduct = userProductList.find(up => up.productId === selectedProduct);
      
      if (userProduct) {
        setPrice(userProduct.price);
      } else {
        // 如果没有用户特定价格，使用产品默认价格
        const product = products.find(p => p.id === selectedProduct);
        if (product) {
          setPrice(product.currentPrice);
        }
      }
    }
  }, [selectedProduct, user, getUserProducts, products]);

  // 当数量或价格变化时，计算总金额
  useEffect(() => {
    setTotalAmount(calculateTotal(quantity, price));
  }, [quantity, price]);

  // 获取用户可用的产品列表
  useEffect(() => {
    if (user) {
      const userProductIds = getUserProducts(user.id).map(up => up.productId);
      // 如果用户有特定产品，则使用这些产品，否则使用所有产品
      const availableProducts = userProductIds.length > 0
        ? products.filter(p => userProductIds.includes(p.id))
        : products;
      
      setUserProductsList(availableProducts);
    }
  }, [user, getUserProducts, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || quantity <= 0 || price <= 0) {
      setMessage({ type: 'error', text: '请填写完整的入库信息' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await addTransaction({
        type: TransactionType.IN,
        productId: selectedProduct,
        userId: user!.id,
        driverId: selectedDriver || undefined,
        quantity,
        price,
        date: new Date().toISOString(),
        notes: notes || undefined,
      });
      
      // 重置表单
      setSelectedProduct('');
      setQuantity(1);
      setPrice(0);
      setSelectedDriver('');
      setNotes('');
      
      setMessage({ type: 'success', text: '入库记录已成功添加' });
    } catch (error) {
      console.error('添加入库记录失败:', error);
      setMessage({ type: 'error', text: '添加入库记录失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">入库记录</h1>
        <p className="text-gray-500">添加新的商品入库记录</p>
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
            {/* 产品选择 */}
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                产品
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                required
              >
                <option value="">选择产品</option>
                {userProductsList.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit})
                  </option>
                ))}
              </select>
            </div>

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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isLoading ? '保存中...' : '保存入库记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};