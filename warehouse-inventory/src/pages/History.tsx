import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import * as XLSX from 'xlsx';

// 查询参数接口
interface QueryParams {
  page: number;
  pageSize: number;
  startDate: string;
  endDate: string;
  productId: string;
  driverId: string;
  type: TransactionType | undefined;
}

export const History: React.FC = () => {
  const { getTransactionsByQuery, products, drivers, reverseTransaction } = useData();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 10,
    startDate: '',
    endDate: '',
    productId: '',
    driverId: '',
    type: undefined,
  });

  // 加载交易记录
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await getTransactionsByQuery({
        ...queryParams,
        page: currentPage,
      });
      
      setTransactions(result.data);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('获取交易记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 当查询参数或页码变化时，重新加载数据
  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 处理查询表单提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置为第一页
    loadTransactions();
  };

  // 处理重置查询条件
  const handleReset = () => {
    setQueryParams({
      page: 1,
      pageSize: 10,
      startDate: '',
      endDate: '',
      productId: '',
      driverId: '',
      type: undefined,
    });
    setCurrentPage(1);
  };

  // 处理查询参数变化
  const handleParamChange = (name: string, value: string | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 处理红冲
  const handleReverse = async (transactionId: string) => {
    if (window.confirm('确定要红冲这条记录吗？红冲后该记录将不计入总账目。')) {
      try {
        await reverseTransaction(transactionId);
        // 重新加载数据
        loadTransactions();
      } catch (error) {
        console.error('红冲失败:', error);
        alert('红冲失败，请重试');
      }
    }
  };

  // 导出Excel功能
  const handleExportExcel = () => {
    // 创建工作表数据
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map(transaction => ({
        '日期': formatDate(transaction.date),
        '类型': transaction.type === TransactionType.IN ? '入库' : '出库',
        '客户': transaction.customer ? transaction.customer.name : '-',
        '产品': transaction.product.name,
        '数量': transaction.quantity,
        '单位': transaction.product.unit,
        '单价(元)': transaction.price,
        '总金额(元)': transaction.totalAmount,
        '司机': transaction.driver ? transaction.driver.name : '-',
        '状态': transaction.isReversed ? '已红冲' : '正常',
        '备注': transaction.notes || '-'
      }))
    );
    
    // 设置列宽
    const columnWidths = [
      { wch: 12 }, // 日期
      { wch: 6 },  // 类型
      { wch: 15 }, // 客户
      { wch: 15 }, // 产品
      { wch: 6 },  // 数量
      { wch: 6 },  // 单位
      { wch: 10 }, // 单价
      { wch: 10 }, // 总金额
      { wch: 10 }, // 司机
      { wch: 8 },  // 状态
      { wch: 20 }  // 备注
    ];
    worksheet['!cols'] = columnWidths;
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');
    
    // 生成文件名
    const fileName = `库房交易记录_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 导出Excel
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">历史查询</h1>
        <p className="text-gray-500">查询历史交易记录</p>
      </div>

      {/* 查询表单 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSearch} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 日期范围 */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                开始日期
              </label>
              <input
                type="date"
                id="startDate"
                value={queryParams.startDate}
                onChange={(e) => handleParamChange('startDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                结束日期
              </label>
              <input
                type="date"
                id="endDate"
                value={queryParams.endDate}
                onChange={(e) => handleParamChange('endDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 sm:text-sm"
              />
            </div>
            
            {/* 产品筛选 */}
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                产品
              </label>
              <select
                id="product"
                value={queryParams.productId}
                onChange={(e) => handleParamChange('productId', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 sm:text-sm"
              >
                <option value="">所有产品</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 司机筛选 */}
            <div>
              <label htmlFor="driver" className="block text-sm font-medium text-gray-700">
                司机
              </label>
              <select
                id="driver"
                value={queryParams.driverId}
                onChange={(e) => handleParamChange('driverId', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 sm:text-sm"
              >
                <option value="">所有司机</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 交易类型 */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                交易类型
              </label>
              <select
                id="type"
                value={queryParams.type}
                onChange={(e) => handleParamChange('type', e.target.value as TransactionType | undefined)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 sm:text-sm"
              >
                <option value="">所有类型</option>
                <option value={TransactionType.IN}>入库</option>
                <option value={TransactionType.OUT}>出库</option>
              </select>
            </div>
            
            {/* 按钮组 */}
            <div className="flex items-end space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isLoading ? '查询中...' : '查询'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                重置
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 查询结果 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">查询结果</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={isLoading || transactions.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出Excel
            </button>
            <span className="text-sm text-gray-500">
              共 {totalRecords} 条记录
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        客户
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        产品
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        单价
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        总金额
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        司机
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        备注
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === TransactionType.IN
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === TransactionType.IN ? '入库' : '出库'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.customer ? transaction.customer.name : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.quantity} {transaction.product.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.driver ? transaction.driver.name : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {transaction.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.isReversed
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.isReversed ? '已红冲' : '正常'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!transaction.isReversed && (
                              <button
                                onClick={() => handleReverse(transaction.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                红冲
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                          暂无交易记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      下一页
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        显示第 <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> 到 
                        <span className="font-medium">
                          {Math.min(currentPage * 10, totalRecords)}
                        </span> 条，共 
                        <span className="font-medium">{totalRecords}</span> 条
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <span className="sr-only">上一页</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // 显示当前页附近的页码
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-primary text-white border-primary'
                                  : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <span className="sr-only">下一页</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};