import getDatabase from './database/db';
import customerService from './customer.service';
import productService from './product.service';

export interface InvoiceLineItem {
  id?: number;
  invoiceId?: number;
  productId: number;
  productQuantity: number;
  productAmountDiscount?: number;
  productPercentDiscount?: number;
  product?: any;
}

export interface TaxLineItem {
  id?: number;
  invoiceId?: number;
  name: string;
  percent: number;
  amount: number;
}

export interface PackagingLineItem {
  id?: number;
  invoiceId?: number;
  name: string;
  amount: number;
}

export interface TransportationLineItem {
  id?: number;
  invoiceId?: number;
  name: string;
  amount: number;
}

export interface Invoice {
  id: number;
  customerId: number;
  totalAmount: number;
  amountDiscount?: number;
  percentDiscount?: number;
  finalAmount: number;
  custPrevBalance: number;
  paidByCustomer: number;
  remainingBalance: number;
  status: 'ACTIVE' | 'VOID';
  createdAt: string;
  updatedAt?: string;
  customer?: any;
  invoiceLineItems?: InvoiceLineItem[];
  taxLineItems?: TaxLineItem[];
  packagingLineItems?: PackagingLineItem[];
  transportationLineItems?: TransportationLineItem[];
}

export interface CreateInvoiceData {
  customerId: number;
  totalAmount: number;
  amountDiscount?: number;
  percentDiscount?: number;
  finalAmount: number;
  paidByCustomer: number;
  invoiceLineItems?: InvoiceLineItem[];
  taxLineItems?: TaxLineItem[];
  packagingLineItems?: PackagingLineItem[];
  transportationLineItems?: TransportationLineItem[];
}

export interface UpdateInvoiceData {
  totalAmount?: number;
  amountDiscount?: number;
  percentDiscount?: number;
  finalAmount?: number;
  paidByCustomer?: number;
  invoiceLineItems?: InvoiceLineItem[];
  taxLineItems?: TaxLineItem[];
  packagingLineItems?: PackagingLineItem[];
  transportationLineItems?: TransportationLineItem[];
}

export interface SearchInvoiceFilters {
  invoiceId?: number;
  phone?: string;
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
}

class InvoiceService {
  // Get All Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    const db = getDatabase();
    const invoices = db.getAllSync<Invoice>(
      `SELECT * FROM Invoice ORDER BY createdAt DESC`
    ) || [];
    
    return Promise.all(invoices.map(inv => this.getInvoiceById(inv.id)));
  }

  // Get Invoice by ID (with all relations)
  async getInvoiceById(id: number): Promise<Invoice> {
    const db = getDatabase();
    
    // Get invoice
    const invoice = db.getFirstSync<Invoice>('SELECT * FROM Invoice WHERE id = ?', [id]);
    if (!invoice) {
      throw new Error('Invoice Not Found');
    }
    
    // Get customer
    const customer = await customerService.getCustomerById(invoice.customerId);
    
    // Get invoice line items with products
    const lineItemsRows = db.getAllSync<any>(
      `SELECT ili.*, p.id as product_id, p.name as product_name, p.price as product_price
       FROM InvoiceLineItem ili
       JOIN Product p ON ili.productId = p.id
       WHERE ili.invoiceId = ?`,
      [id]
    ) || [];
    const invoiceLineItems = lineItemsRows.map((row: any) => ({
      id: row.id,
      invoiceId: row.invoiceId,
      productId: row.productId,
      productQuantity: row.productQuantity,
      productAmountDiscount: row.productAmountDiscount,
      productPercentDiscount: row.productPercentDiscount,
      product: {
        id: row.product_id,
        name: row.product_name,
        price: row.product_price,
      },
    }));
    
    // Get tax line items
    const taxLineItems = db.getAllSync<TaxLineItem>(
      'SELECT * FROM TaxLineItem WHERE invoiceId = ?',
      [id]
    ) || [];
    
    // Get packaging line items
    const packagingLineItems = db.getAllSync<PackagingLineItem>(
      'SELECT * FROM PackagingLineItem WHERE invoiceId = ?',
      [id]
    ) || [];
    
    // Get transportation line items
    const transportationLineItems = db.getAllSync<TransportationLineItem>(
      'SELECT * FROM TransportationLineItem WHERE invoiceId = ?',
      [id]
    ) || [];
    
    return {
      ...invoice,
      customer,
      invoiceLineItems,
      taxLineItems,
      packagingLineItems,
      transportationLineItems,
    };
  }

  // Get Invoices by Customer ID
  async getCustomerInvoices(customerId: number): Promise<Invoice[]> {
    const db = getDatabase();
    const invoices = db.getAllSync<Invoice>(
      'SELECT * FROM Invoice WHERE customerId = ? ORDER BY createdAt DESC',
      [customerId]
    ) || [];
    
    return Promise.all(invoices.map(inv => this.getInvoiceById(inv.id)));
  }

  // Create Invoice
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const db = getDatabase();
    
    const customer = await customerService.getCustomerById(data.customerId);
    const prevBalance = customer.balance;
    const remainingBalance = prevBalance + data.finalAmount - data.paidByCustomer;
    
    try {
      const now = new Date().toISOString();
      
      // Create invoice
      const invoiceResult = db.runSync(
        `INSERT INTO Invoice (
          customerId, totalAmount, amountDiscount, percentDiscount, finalAmount,
          custPrevBalance, paidByCustomer, remainingBalance, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.customerId,
          data.totalAmount,
          data.amountDiscount || null,
          data.percentDiscount || null,
          data.finalAmount,
          prevBalance,
          data.paidByCustomer,
          remainingBalance,
          'ACTIVE',
          now,
        ]
      );
      
      const invoiceId = invoiceResult.lastInsertRowId!;
      
      // Update customer balance
      db.runSync(
        'UPDATE Customer SET balance = ?, updatedAt = ? WHERE id = ?',
        [remainingBalance, now, data.customerId]
      );
      
      // Create line items
      if (data.invoiceLineItems?.length) {
        for (const item of data.invoiceLineItems) {
          db.runSync(
            `INSERT INTO InvoiceLineItem (
              invoiceId, productId, productQuantity, productAmountDiscount, productPercentDiscount
            ) VALUES (?, ?, ?, ?, ?)`,
            [
              invoiceId,
              item.productId,
              item.productQuantity,
              item.productAmountDiscount || null,
              item.productPercentDiscount || null,
            ]
          );
        }
      }
      
      if (data.taxLineItems?.length) {
        for (const tax of data.taxLineItems) {
          db.runSync(
            `INSERT INTO TaxLineItem (invoiceId, name, percent, amount, createdAt)
             VALUES (?, ?, ?, ?, ?)`,
            [invoiceId, tax.name, tax.percent, tax.amount, now]
          );
        }
      }
      
      if (data.packagingLineItems?.length) {
        for (const p of data.packagingLineItems) {
          db.runSync(
            `INSERT INTO PackagingLineItem (invoiceId, name, amount, createdAt)
             VALUES (?, ?, ?, ?)`,
            [invoiceId, p.name, p.amount, now]
          );
        }
      }
      
      if (data.transportationLineItems?.length) {
        for (const t of data.transportationLineItems) {
          db.runSync(
            `INSERT INTO TransportationLineItem (invoiceId, name, amount, createdAt)
             VALUES (?, ?, ?, ?)`,
            [invoiceId, t.name, t.amount, now]
          );
        }
      }
      
      return this.getInvoiceById(invoiceId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to Create Invoice');
    }
  }

  // Update Invoice
  async updateInvoice(invoiceId: number, data: UpdateInvoiceData): Promise<Invoice> {
    const db = getDatabase();
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (invoice.status === 'VOID') {
      throw new Error('Cannot Update Voided Invoice');
    }
    
    try {
      const now = new Date().toISOString();
      const finalAmount = data.finalAmount ?? invoice.finalAmount;
      const paidByCustomer = data.paidByCustomer ?? invoice.paidByCustomer;
      const remainingBalance = invoice.custPrevBalance + finalAmount - paidByCustomer;
      
      // Update invoice
      db.runSync(
        `UPDATE Invoice SET
          totalAmount = ?,
          amountDiscount = ?,
          percentDiscount = ?,
          finalAmount = ?,
          paidByCustomer = ?,
          remainingBalance = ?,
          updatedAt = ?
         WHERE id = ?`,
        [
          data.totalAmount ?? invoice.totalAmount,
          data.amountDiscount ?? invoice.amountDiscount,
          data.percentDiscount ?? invoice.percentDiscount,
          finalAmount,
          paidByCustomer,
          remainingBalance,
          now,
          invoiceId,
        ]
      );
      
      // Update customer balance
      db.runSync(
        'UPDATE Customer SET balance = ?, updatedAt = ? WHERE id = ?',
        [remainingBalance, now, invoice.customerId]
      );
      
      // Update line items if provided
      if (data.invoiceLineItems !== undefined) {
        db.runSync('DELETE FROM InvoiceLineItem WHERE invoiceId = ?', [invoiceId]);
        if (data.invoiceLineItems.length) {
          for (const item of data.invoiceLineItems) {
            db.runSync(
              `INSERT INTO InvoiceLineItem (
                invoiceId, productId, productQuantity, productAmountDiscount, productPercentDiscount
              ) VALUES (?, ?, ?, ?, ?)`,
              [
                invoiceId,
                item.productId,
                item.productQuantity,
                item.productAmountDiscount || null,
                item.productPercentDiscount || null,
              ]
            );
          }
        }
      }
      
      if (data.taxLineItems !== undefined) {
        db.runSync('DELETE FROM TaxLineItem WHERE invoiceId = ?', [invoiceId]);
        if (data.taxLineItems.length) {
          for (const tax of data.taxLineItems) {
            db.runSync(
              `INSERT INTO TaxLineItem (invoiceId, name, percent, amount, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [invoiceId, tax.name, tax.percent, tax.amount, now, now]
            );
          }
        }
      }
      
      if (data.packagingLineItems !== undefined) {
        db.runSync('DELETE FROM PackagingLineItem WHERE invoiceId = ?', [invoiceId]);
        if (data.packagingLineItems.length) {
          for (const item of data.packagingLineItems) {
            db.runSync(
              `INSERT INTO PackagingLineItem (invoiceId, name, amount, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?)`,
              [invoiceId, item.name, item.amount, now, now]
            );
          }
        }
      }
      
      if (data.transportationLineItems !== undefined) {
        db.runSync('DELETE FROM TransportationLineItem WHERE invoiceId = ?', [invoiceId]);
        if (data.transportationLineItems.length) {
          for (const item of data.transportationLineItems) {
            db.runSync(
              `INSERT INTO TransportationLineItem (invoiceId, name, amount, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?)`,
              [invoiceId, item.name, item.amount, now, now]
            );
          }
        }
      }
      
      return this.getInvoiceById(invoiceId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to Update Invoice');
    }
  }

  // Void Invoice
  async voidInvoice(invoiceId: number): Promise<Invoice> {
    const db = getDatabase();
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (invoice.status === 'VOID') {
      throw new Error('Invoice is Already Voided');
    }
    
    const updatedBalance = invoice.custPrevBalance;
    
    try {
      const now = new Date().toISOString();
      
      // Update invoice status
      db.runSync(
        'UPDATE Invoice SET status = ?, updatedAt = ? WHERE id = ?',
        ['VOID', now, invoiceId]
      );
      
      // Restore customer balance
      db.runSync(
        'UPDATE Customer SET balance = ?, updatedAt = ? WHERE id = ?',
        [updatedBalance, now, invoice.customerId]
      );
      
      return this.getInvoiceById(invoiceId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to Void Invoice');
    }
  }

  // Search Invoices
  async searchInvoices(filters: SearchInvoiceFilters): Promise<Invoice[]> {
    const db = getDatabase();
    
    let query = 'SELECT DISTINCT i.* FROM Invoice i';
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (filters.invoiceId) {
      conditions.push('i.id = ?');
      values.push(filters.invoiceId);
    }
    
    if (filters.phone || filters.customerName) {
      query += ' JOIN Customer c ON i.customerId = c.id';
      if (filters.phone) {
        conditions.push('c.phone LIKE ?');
        values.push(`%${filters.phone}%`);
      }
      if (filters.customerName) {
        conditions.push('c.name LIKE ?');
        values.push(`%${filters.customerName}%`);
      }
    }
    
    if (filters.dateFrom) {
      conditions.push('i.createdAt >= ?');
      values.push(filters.dateFrom);
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      conditions.push('i.createdAt <= ?');
      values.push(dateTo.toISOString());
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY i.createdAt DESC';
    
    const invoices = db.getAllSync<Invoice>(query, values) || [];
    return Promise.all(invoices.map(inv => this.getInvoiceById(inv.id)));
  }

  // Generate Invoice HTML
  generateInvoiceHtml(invoice: Invoice): string {
    const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

    const productRows = (invoice.invoiceLineItems || [])
      .map((item) => {
        const rate = item.product?.price || 0;
        const qty = item.productQuantity;
        const percentDiscount = item.productPercentDiscount || 0;
        const amountDiscount = item.productAmountDiscount || 0;
        const totalBeforeDiscount = rate * qty;
        const totalDiscount =
          amountDiscount > 0
            ? amountDiscount
            : (totalBeforeDiscount * percentDiscount) / 100;
        const amountAfterDiscount = totalBeforeDiscount - totalDiscount;

        return `
          <tr>
            <td>${item.product?.name || "Unnamed Product"}</td>
            <td>${formatCurrency(rate)}</td>
            <td>${qty}</td>
            <td>${formatCurrency(totalDiscount)}</td>
            <td>${formatCurrency(amountAfterDiscount)}</td>
          </tr>`;
      })
      .join("");

    // Calculate discount display values
    let discountPercent: number;
    let discountAmount: number;

    if ((invoice.amountDiscount || 0) > 0) {
      discountAmount = invoice.amountDiscount || 0;
      discountPercent =
        ((invoice.amountDiscount || 0) / invoice.totalAmount) * 100;
    } else if ((invoice.percentDiscount || 0) > 0) {
      discountPercent = invoice.percentDiscount || 0;
      discountAmount =
        (invoice.totalAmount * (invoice.percentDiscount || 0)) / 100;
    } else {
      discountPercent = 0;
      discountAmount = 0;
    }

    const taxRows = (invoice.taxLineItems || [])
      .map((tax) => {
        const subtotalAfterDiscount = invoice.totalAmount - discountAmount;

        let displayPercent: number;
        let displayAmount: number;

        if (tax.amount > 0) {
          displayAmount = tax.amount;
          displayPercent = (tax.amount / subtotalAfterDiscount) * 100;
        } else if (tax.percent > 0) {
          displayPercent = tax.percent;
          displayAmount = (subtotalAfterDiscount * tax.percent) / 100;
        } else {
          displayPercent = 0;
          displayAmount = 0;
        }

        return `
        <tr>
          <td>Tax: ${tax.name}</td>
          <td></td><td></td>
          <td>${displayPercent.toFixed(2)}%</td>
          <td>${formatCurrency(displayAmount)}</td>
        </tr>`;
      })
      .join("");

    const packagingRows = (invoice.packagingLineItems || [])
      .map(
        (p) => `
        <tr>
          <td>Packaging: ${p.name}</td>
          <td></td><td></td><td></td>
          <td>${formatCurrency(p.amount)}</td>
        </tr>`
      )
      .join("");

    const transportationRows = (invoice.transportationLineItems || [])
      .map(
        (t) => `
        <tr>
          <td>Transport: ${t.name}</td>
          <td></td><td></td><td></td>
          <td>${formatCurrency(t.amount)}</td>
        </tr>`
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #222;
        margin: 0;
        padding: 0;
      }
      .invoice-box {
        width: 210mm;
        min-height: 297mm;
        margin: auto;
        padding: 20mm;
        box-sizing: border-box;
        border: 1px solid #eee;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        line-height: 24px;
        font-size: 14px;
        background: white;
      }
      @media print {
        .invoice-box {
          box-shadow: none;
          border: none;
        }
      }
      .title {
        font-size: 45px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
      }
      .company-details {
        text-align: right;
        line-height: 18px;
      }
      .details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .details div {
        width: 48%;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        table-layout: fixed;
      }
      table th {
        border-bottom: 2px solid #4B00FF;
        text-align: left;
        padding: 10px 0;
        color: #4B00FF;
        text-transform: uppercase;
        font-size: 13px;
      }
      table td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      colgroup col:nth-child(1) { width: 45%; }
      colgroup col:nth-child(2),
      colgroup col:nth-child(3),
      colgroup col:nth-child(4),
      colgroup col:nth-child(5) { width: 13.75%; }
      .totals {
        margin-top: 30px;
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      .totals td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .totals .total {
        font-weight: bold;
        font-size: 16px;
        border-top: 2px solid #000;
      }
      .highlight {
        color: #4B00FF;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header">
        <div>
          <div class="title">Invoice</div>
        </div>
        <div class="company-details">
          <strong>YOUR COMPANY</strong><br />
          1234 Your Street<br />
          City, California 90210<br />
          United States<br />
          1-888-123-4567
        </div>
      </div>

      <div class="details">
        <div>
          <strong>Billed To</strong><br />
          Customer ID: ${invoice.customer?.id || invoice.customerId}<br />
          ${invoice.customer?.name || ''}<br />
          ${invoice.customer?.firm || "No Firm"}<br />
          ${invoice.customer?.address || "No Address"}<br />
        </div>
        <div>
          <table style="width: 100%;">
            <tr><td>Date Issued:</td><td>${new Date(invoice.createdAt).toLocaleDateString()}</td></tr>
            <tr><td>Invoice Number:</td><td>INV-${invoice.id
              .toString()
              .padStart(4, "0")}</td></tr>
            <tr><td><strong>Remaining Balance:</strong></td><td><strong>${formatCurrency(
              invoice.remainingBalance
            )}</strong></td></tr>
          </table>
        </div>
      </div>

      <table>
        <colgroup><col /><col /><col /><col /><col /></colgroup>
        <tr>
          <th>PRODUCTS</th><th>RATE</th><th>QTY</th><th>DISCOUNT</th><th>AMOUNT</th>
        </tr>
        ${productRows}
      </table>

      <table class="totals">
        <colgroup><col /><col /><col /><col /><col /></colgroup>
        <tr><td>Subtotal</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.totalAmount
        )}</td></tr>
        <tr><td>Discount</td><td></td><td></td><td>${discountPercent.toFixed(
          2
        )}%</td><td>${formatCurrency(discountAmount)}</td></tr>
        ${taxRows}
        ${packagingRows}
        ${transportationRows}
        <tr class="total"><td>Total</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.finalAmount
        )}</td></tr>
        <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.paidByCustomer
        )}</td></tr>
        <tr class="highlight"><td>Remaining Balance</td><td></td><td></td><td></td><td>${formatCurrency(
          invoice.remainingBalance
        )}</td></tr>
      </table>
    </div>
  </body>
</html>`;
  }
}

export default new InvoiceService();

