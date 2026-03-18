import { useAppStore } from '@/stores/appStore';
import { Order } from '@/types/pos';

interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  vatRate: number;
  vatInclusive: boolean;
  currency: string;
}

export const generatePDFReceipt = (order: Order) => {
  const settings = useAppStore.getState().settings;
  const shopSettings: ShopSettings = settings ? {
    shopName: 'MAMA LIAM FRIES',
    address: 'P.O.BOX 20, KENDU BAY',
    phone: '+254 720 172 292',
    email: 'ojolo@gmail.com',
    vatRate: settings.vatRate,
    vatInclusive: settings.vatInclusive,
    currency: settings.currency
  } : {
    shopName: 'MAMA LIAM FRIES',
    address: 'P.O.BOX 20, KENDU BAY',
    phone: '+254 720 172 292',
    email: 'ojolo@gmail.com',
    vatRate: 0, 
    vatInclusive: false,
    currency: 'KES'
  };

  // Calculate VAT based on whether pricing is inclusive or exclusive
  let vatAmount: number;
  let displaySubtotal: number;
  let displayTotal: number;

  if (shopSettings.vatInclusive) {
    // VAT is already included in the prices
    // Calculate the VAT amount by extracting it from the subtotal
    vatAmount = order.subtotal - (order.subtotal / (1 + shopSettings.vatRate / 100));
    displaySubtotal = order.subtotal - vatAmount;
    displayTotal = order.subtotal;
  } else {
    // VAT is added on top of the subtotal
    vatAmount = order.subtotal * (shopSettings.vatRate / 100);
    displaySubtotal = order.subtotal;
    displayTotal = order.subtotal + vatAmount;
  }

  const receiptWindow = window.open('', '_blank');
  if (!receiptWindow) return;

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${order.id}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
            color: #333;
          }
          
          .receipt-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .shop-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .shop-details {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.6;
          }
          
          .receipt-info {
            background: #f8fafc;
            padding: 20px 30px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .receipt-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-group h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 5px;
          }
          
          .info-group p {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .items-section {
            padding: 30px;
          }
          
          .items-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .items-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          
          .item-name {
            font-weight: 600;
            color: #1e293b;
          }
          
          .item-price {
            text-align: right;
            font-weight: 500;
          }
          
          .totals-section {
            background: #f8fafc;
            padding: 25px 30px;
            border-top: 2px solid #e2e8f0;
          }
          
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .totals-table td {
            padding: 8px 0;
            font-size: 16px;
          }
          
          .totals-table .label {
            text-align: left;
            color: #64748b;
          }
          
          .totals-table .amount {
            text-align: right;
            font-weight: 600;
            color: #1e293b;
          }
          
          .grand-total {
            border-top: 2px solid #2563eb;
            padding-top: 15px !important;
            margin-top: 10px;
          }
          
          .grand-total .label {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
          }
          
          .grand-total .amount {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
          }
          
          .payment-info {
            background: white;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .payment-method {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .footer {
            background: #1e293b;
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          
          .thank-you {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          
          .return-policy {
            font-size: 12px;
            opacity: 0.8;
            line-height: 1.5;
            margin-top: 15px;
          }
          
          .powered-by {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #475569;
            font-size: 11px;
            opacity: 0.7;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .receipt-container {
              box-shadow: none;
              border-radius: 0;
            }
            
            .no-print {
              display: none;
            }
          }
          
          @media (max-width: 600px) {
            body {
              padding: 20px 10px;
            }
            
            .header, .receipt-info, .items-section, .totals-section, .payment-info, .footer {
              padding-left: 20px;
              padding-right: 20px;
            }
            
            .receipt-info-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="shop-name">${shopSettings.shopName}</div>
            <div class="shop-details">
              ${shopSettings.address}<br>
              Tel: ${shopSettings.phone}<br>
              Email: ${shopSettings.email}
            </div>
          </div>
          
          <div class="receipt-info">
            <div class="receipt-info-grid">
              <div class="info-group">
                <h3>Receipt Number</h3>
                <p>${order.id}</p>
              </div>
              <div class="info-group">
                <h3>Date & Time</h3>
                <p>${order.timestamp.toLocaleDateString('en-KE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}<br>
                ${order.timestamp.toLocaleTimeString('en-KE')}</p>
              </div>
              <div class="info-group">
                <h3>Served By</h3>
                <p>${order.cashierName}</p>
              </div>
              <div class="info-group">
                <h3>Payment Method</h3>
                <p>${order.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          </div>
          
          <div class="items-section">
            <div class="items-title">Items Purchased</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td class="item-name">${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td class="item-price">${shopSettings.currency} ${item.product.price.toFixed(2)}</td>
                    <td class="item-price">${shopSettings.currency} ${(item.product.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">${shopSettings.currency} ${displaySubtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">VAT (${shopSettings.vatRate}%):</td>
                <td class="amount">${shopSettings.currency} ${vatAmount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td class="label">TOTAL AMOUNT:</td>
                <td class="amount">${shopSettings.currency} ${displayTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="payment-info">
            <span class="payment-method">Paid via ${order.paymentMethod}</span>
          </div>
          
          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div>We appreciate your patronage and look forward to serving you again.</div>
            <div class="return-policy">
              Return Policy: Items can be returned within 7 days with original receipt.<br>
              For support, contact us at ${shopSettings.phone} or ${shopSettings.email}
            </div>
            <div class="powered-by">
              Powered by ShopMaster POS System
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // Wait 7 seconds before closing the window
              setTimeout(() => window.close(), 15000);
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
  
  receiptWindow.document.write(receiptHTML);
  receiptWindow.document.close();
};