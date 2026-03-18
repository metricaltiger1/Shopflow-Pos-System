
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (orderData: any): Buffer => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('ShopMaster POS', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Receipt', 105, 30, { align: 'center' });
  
  // Order details
  doc.text(`Order ID: ${orderData.id}`, 20, 50);
  doc.text(`Date: ${new Date(orderData.timestamp).toLocaleString()}`, 20, 60);
  doc.text(`Cashier: ${orderData.user.fullName}`, 20, 70);
  doc.text(`Payment: ${orderData.paymentMethod}`, 20, 80);
  
  // Items table
  const tableData = orderData.items.map((item: any) => [
    item.product.name,
    item.quantity.toString(),
    `KES ${item.price.toFixed(2)}`,
    `KES ${(item.quantity * item.price).toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 90,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  doc.text(`Subtotal: KES ${orderData.subtotal.toFixed(2)}`, 20, finalY);
  doc.text(`Tax (16%): KES ${orderData.tax.toFixed(2)}`, 20, finalY + 10);
  doc.setFontSize(14);
  doc.text(`Total: KES ${orderData.total.toFixed(2)}`, 20, finalY + 25);
  
  return Buffer.from(doc.output('arraybuffer'));
};

export const generateSalesReportPDF = (reportData: any, filters: any): Buffer => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text('Sales Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
  
  let yPosition = 50;
  
  // Summary
  if (reportData.summary) {
    doc.setFontSize(14);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Orders: ${reportData.summary.totalOrders}`, 20, yPosition);
    doc.text(`Total Revenue: KES ${reportData.summary.totalRevenue.toFixed(2)}`, 20, yPosition + 10);
    doc.text(`Average Order: KES ${reportData.summary.averageOrder.toFixed(2)}`, 20, yPosition + 20);
    yPosition += 40;
  }
  
  // Orders by shift
  if (reportData.shifts && reportData.shifts.length > 0) {
    reportData.shifts.forEach((shift: any) => {
      doc.setFontSize(12);
      doc.text(`Shift: ${shift.user.fullName}`, 20, yPosition);
      doc.text(`${new Date(shift.startTime).toLocaleString()} - ${shift.endTime ? new Date(shift.endTime).toLocaleString() : 'Active'}`, 20, yPosition + 8);
      yPosition += 20;
      
      if (shift.orders && shift.orders.length > 0) {
        const tableData = shift.orders.map((order: any) => [
          order.id.substring(0, 8),
          new Date(order.timestamp).toLocaleTimeString(),
          order.items.length.toString(),
          `KES ${order.total.toFixed(2)}`,
          order.paymentMethod
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Order ID', 'Time', 'Items', 'Total', 'Payment']],
          body: tableData,
          margin: { left: 20 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }
  
  return Buffer.from(doc.output('arraybuffer'));
};
