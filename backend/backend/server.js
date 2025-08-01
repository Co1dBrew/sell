const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- 辅助函数 ---
const generateId = () => Math.random().toString(36).substring(2, 15);

// --- 内存数据库 (使用前端的模拟数据作为初始值) ---
let customers = [
  { id: '1', name: '张三建材店', phone: '13800138000', address: '北京市朝阳区建材街45号', debt: 5000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: '李四五金店', phone: '13900139000', address: '北京市海淀区五金路23号', debt: 3200, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: '王五建筑材料有限公司', phone: '13700137000', address: '北京市丰台区建筑路78号', debt: 12000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
let products = [
  { id: '1', name: '水泥', description: '通用型水泥', currentPrice: 50, unit: '袋', customerId: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: '钢筋', description: '建筑用钢筋', currentPrice: 4500, unit: '吨', customerId: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: '砖块', description: '标准红砖', currentPrice: 0.8, unit: '块', customerId: '2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
let drivers = [
  { id: '1', name: '张三', phone: '13800138000', vehicle: '货车A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: '李四', phone: '13900139000', vehicle: '货车B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
let transactions = [
    { id: '1', type: 'OUT', productId: '1', userId: '1', driverId: '1', quantity: 100, price: 48, date: new Date().toISOString(), notes: '销售100袋水泥', customerId: '1', paid: false, isReversed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', type: 'OUT', productId: '2', userId: '1', driverId: '2', quantity: 2, price: 4300, date: new Date().toISOString(), notes: '销售2吨钢筋', customerId: '1', paid: true, isReversed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// --- API 路由 ---

// 客户 API
app.get('/api/customers', (req, res) => res.json(customers));
app.post('/api/customers', (req, res) => {
  const now = new Date().toISOString();
  const newCustomer = { ...req.body, id: generateId(), createdAt: now, updatedAt: now };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});
app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const index = customers.findIndex(c => c.id === id);
    if (index > -1) {
        customers[index] = { ...customers[index], ...req.body, updatedAt: new Date().toISOString() };
        res.json(customers[index]);
    } else {
        res.status(404).send('客户未找到');
    }
});
app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    customers = customers.filter(c => c.id !== id);
    res.status(204).send();
});


// 产品 API
app.get('/api/products', (req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const now = new Date().toISOString();
  const newProduct = { ...req.body, id: generateId(), createdAt: now, updatedAt: now };
  products.push(newProduct);
  res.status(201).json(newProduct);
});
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);
    if (index > -1) {
        products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
        res.json(products[index]);
    } else {
        res.status(404).send('产品未找到');
    }
});
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    res.status(204).send();
});


// 司机 API
app.get('/api/drivers', (req, res) => res.json(drivers));
app.post('/api/drivers', (req, res) => {
  const now = new Date().toISOString();
  const newDriver = { ...req.body, id: generateId(), createdAt: now, updatedAt: now };
  drivers.push(newDriver);
  res.status(201).json(newDriver);
});
app.put('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const index = drivers.findIndex(d => d.id === id);
    if (index > -1) {
        drivers[index] = { ...drivers[index], ...req.body, updatedAt: new Date().toISOString() };
        res.json(drivers[index]);
    } else {
        res.status(404).send('司机未找到');
    }
});
app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    drivers = drivers.filter(d => d.id !== id);
    res.status(204).send();
});

// 交易 API
app.get('/api/transactions', (req, res) => {
    // 在真实应用中，这里会处理查询参数 req.query
    res.json(transactions);
});
app.post('/api/transactions', (req, res) => {
  const now = new Date().toISOString();
  const newTransaction = { ...req.body, id: generateId(), createdAt: now, updatedAt: now };
  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const index = transactions.findIndex(t => t.id === id);
    if (index > -1) {
        transactions[index] = { ...transactions[index], ...req.body, updatedAt: new Date().toISOString() };
        res.json(transactions[index]);
    } else {
        res.status(404).send('交易未找到');
    }
});
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    transactions = transactions.filter(t => t.id !== id);
    res.status(204).send();
});


// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`后端服务正在 http://localhost:${port} 运行`);
});