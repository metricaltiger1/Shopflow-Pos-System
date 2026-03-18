
import { Order } from '@/types/pos';
import { User } from '@/types/auth';

interface ShiftSalesData {
  staffName: string;
  staffId: string;
  shiftDate: string;
  orders: Order[];
  totalOrders: number;
  totalRevenue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
}

export const generateSalesReportPDF = (
  filteredOrders: Order[],
  period: string,
  selectedStaff: string = 'all'
) => {
  const shopSettings: ShopSettings = JSON.parse(
    localStorage.getItem('shopSettings') || JSON.stringify({
      shopName: 'MAMA LIAM FRIES',
      address: 'P.O.BOX 20, KENDU BAY',
      phone: '+254 720 172 292',
      email: 'ojolo@gmail.com',
      currency: 'KES'
    })
  );

  // Group orders by staff and date
  const shiftGroups = new Map<string, ShiftSalesData>();
  
  filteredOrders.forEach(order => {
    const shiftKey = `${order.cashierName}_${order.timestamp.toDateString()}`;
    
    if (!shiftGroups.has(shiftKey)) {
      shiftGroups.set(shiftKey, {
        staffName: order.cashierName,
        staffId: order.shiftId || 'N/A',
        shiftDate: order.timestamp.toDateString(),
        orders: [],
        totalOrders: 0,
        totalRevenue: 0,
        topProducts: []
      });
    }
    
    const shiftData = shiftGroups.get(shiftKey)!;
    shiftData.orders.push(order);
    shiftData.totalOrders++;
    shiftData.totalRevenue += order.total;
  });

  // Calculate top products for each shift
  shiftGroups.forEach((shiftData) => {
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    shiftData.orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.product.name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.product.price * item.quantity)
        });
      });
    });
    
    shiftData.topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return;

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const reportHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales Report - ${period}</title>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Arial', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
          }
          
          .report-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 40px;
            text-align: center;
          }
          
          .shop-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .report-title {
            font-size: 24px;
            margin: 20px 0 10px;
            opacity: 0.95;
          }
          
          .report-period {
            font-size: 16px;
            opacity: 0.9;
            text-transform: capitalize;
          }
          
          .summary-section {
            background: #f1f5f9;
            padding: 30px 40px;
            border-bottom: 3px solid #e2e8f0;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          
          .summary-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 8px;
          }
          
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }
          
          .summary-value.revenue { color: #10b981; }
          .summary-value.orders { color: #3b82f6; }
          .summary-value.average { color: #8b5cf6; }
          
          .shifts-section {
            padding: 30px 40px;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          
          .shift-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 30px;
            overflow: hidden;
          }
          
          .shift-header {
            background: #334155;
            color: white;
            padding: 20px 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .shift-info h3 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          
          .shift-date {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .shift-stats {
            text-align: right;
          }
          
          .shift-revenue {
            font-size: 20px;
            font-weight: bold;
          }
          
          .shift-orders {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .shift-content {
            padding: 25px;
          }
          
          .products-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
          }
          
          .top-products {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .products-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          
          .product-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .product-item:last-child {
            border-bottom: none;
          }
          
          .product-name {
            font-weight: 500;
            color: #374151;
          }
          
          .product-stats {
            text-align: right;
            font-size: 14px;
          }
          
          .product-revenue {
            font-weight: bold;
            color: #10b981;
          }
          
          .product-quantity {
            color: #6b7280;
          }
          
          .orders-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .orders-table th {
            background: #f1f5f9;
            padding: 15px 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            font-weight: 600;
          }
          
          .orders-table td {
            padding: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          
          .orders-table tr:hover {
            background: #f8fafc;
          }
          
          .order-time {
            color: #6b7280;
            font-size: 13px;
          }
          
          .order-total {
            font-weight: bold;
            color: #059669;
          }
          
          .footer {
            background: #1e293b;
            color: white;
            padding: 30px 40px;
            text-align: center;
          }
          
          .footer-info {
            margin-bottom: 15px;
          }
          
          .generated-time {
            font-size: 12px;
            opacity: 0.8;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; border-radius: 0; }
            .shift-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="shop-name">${shopSettings.shopName}</div>
            <div class="report-title">Sales Report</div>
            <div class="report-period">Period: ${period.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            ${selectedStaff !== 'all' ? `<div class="report-period">Staff: ${selectedStaff}</div>` : ''}
          </div>
          
          <div class="summary-section">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">Total Revenue</div>
                <div class="summary-value revenue">${shopSettings.currency} ${totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Total Orders</div>
                <div class="summary-value orders">${totalOrders}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Average Order</div>
                <div class="summary-value average">${shopSettings.currency} ${averageOrderValue.toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Active Staff</div>
                <div class="summary-value">${shiftGroups.size}</div>
              </div>
            </div>
          </div>
          
          <div class="shifts-section">
            <div class="section-title">Staff Performance by Shift</div>
            
            ${Array.from(shiftGroups.values()).map(shift => `
              <div class="shift-card">
                <div class="shift-header">
                  <div class="shift-info">
                    <h3>${shift.staffName}</h3>
                    <div class="shift-date">${shift.shiftDate}</div>
                  </div>
                  <div class="shift-stats">
                    <div class="shift-revenue">${shopSettings.currency} ${shift.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
                    <div class="shift-orders">${shift.totalOrders} orders</div>
                  </div>
                </div>
                
                <div class="shift-content">
                  <div class="products-grid">
                    <div class="top-products">
                      <div class="products-title">🏆 Top Products</div>
                      ${shift.topProducts.map(product => `
                        <div class="product-item">
                          <div>
                            <div class="product-name">${product.name}</div>
                            <div class="product-quantity">${product.quantity} units</div>
                          </div>
                          <div class="product-stats">
                            <div class="product-revenue">${shopSettings.currency} ${product.revenue.toFixed(2)}</div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    
                    <div class="top-products">
                      <div class="products-title">📊 Shift Summary</div>
                      <div class="product-item">
                        <div class="product-name">Orders Processed</div>
                        <div class="product-stats">
                          <div class="product-revenue">${shift.totalOrders}</div>
                        </div>
                      </div>
                      <div class="product-item">
                        <div class="product-name">Average Order Value</div>
                        <div class="product-stats">
                          <div class="product-revenue">${shopSettings.currency} ${(shift.totalRevenue / shift.totalOrders).toFixed(2)}</div>
                        </div>
                      </div>
                      <div class="product-item">
                        <div class="product-name">Items Sold</div>
                        <div class="product-stats">
                          <div class="product-revenue">${shift.orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <table class="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Time</th>
                        <th>Items</th>
                        <th>Payment</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${shift.orders.map(order => `
                        <tr>
                          <td>${order.id}</td>
                          <td class="order-time">${order.timestamp.toLocaleTimeString('en-KE')}</td>
                          <td>${order.items.length} items</td>
                          <td>${order.paymentMethod.toUpperCase()}</td>
                          <td class="order-total">${shopSettings.currency} ${order.total.toFixed(2)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <div class="footer-info">
              ${shopSettings.address}<br>
              Tel: ${shopSettings.phone} | Email: ${shopSettings.email}
            </div>
            <div class="generated-time">
              Report generated on ${new Date().toLocaleString('en-KE')}
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
  
  reportWindow.document.write(reportHTML);
  reportWindow.document.close();
};
