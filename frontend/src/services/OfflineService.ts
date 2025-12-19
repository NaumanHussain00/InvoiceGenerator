import db from './DatabaseService';

// Helper to escape strings for SQL
const safeStr = (str: string | null | undefined) => (str ? str.replace(/'/g, "''") : '');

// --- CUSTOMER SERVICE ---

const getISTTime = () => {
  const now = new Date();
  const offsetMs = 5.5 * 60 * 60 * 1000; // +5:30
  const istDate = new Date(now.getTime() + offsetMs);
  return istDate.toISOString().replace('Z', '+05:30');
};

export const getCustomersInfo = async () => {
  try {
    const results = db.execute('SELECT * FROM Customer ORDER BY createdAt DESC');
    return {
      success: true,
      data: results.rows?._array || [], // quick-sqlite returns { rows: { _array: [...] } } or similar depending on version
      message: 'Customers Fetched Successfully'
    };
  } catch (error: any) {
    console.error('Offline Error:', error);
    throw new Error(error.message);
  }
};

export const searchCustomers = async (searchTerm: string) => {
  try {
    const query = `
      SELECT * FROM Customer 
      WHERE name LIKE '%${safeStr(searchTerm)}%' 
      OR phone LIKE '%${safeStr(searchTerm)}%'
      ORDER BY createdAt DESC
    `;
    const results = db.execute(query);
    return {
      success: true,
      data: results.rows?._array || [],
      message: 'Customers Found'
    };
  } catch (error: any) {
    console.error('Offline Error:', error);
    throw new Error(error.message);
  }
};

export const addCustomer = async (data: any) => {
  const { name, phone, firm, address, balance } = data;
  try {
    // Check duplicates
    const check = db.execute(`SELECT id FROM Customer WHERE phone = '${safeStr(phone)}' OR firm = '${safeStr(firm)}'`);
    if (check.rows && check.rows.length > 0) {
      throw new Error('Customer with this Phone or Firm already exists');
    }

    const result = db.execute(
      `INSERT INTO Customer (name, phone, firm, address, balance, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, firm, address, balance ? Number(balance) : 0, getISTTime(), getISTTime()]
    );
    
    // Fetch created customer
    const created = db.execute(`SELECT * FROM Customer WHERE id = ${result.insertId}`);
    return {
      success: true,
      data: created.rows?.item(0),
      message: 'Customer Created Successfully'
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateCustomer = async (id: number, data: any) => {
  const { name, phone, firm, balance } = data;
  try {
    db.execute(
      `UPDATE Customer SET name = ?, phone = ?, firm = ?, balance = ?, updatedAt = ? WHERE id = ?`,
      [name, phone, firm, balance ? Number(balance) : 0, getISTTime(), id]
    );
    const updated = db.execute(`SELECT * FROM Customer WHERE id = ?`, [id]);
    return {
      success: true,
      data: updated.rows?.item(0),
      message: 'Customer Updated Successfully'
    };
  } catch(error: any) {
    throw new Error(error.message);
  }
};

export const deleteCustomer = async (id: number) => {
  try {
    db.execute(`DELETE FROM Customer WHERE id = ?`, [id]);
    return {
      success: true,
      data: null,
      message: 'Customer Deleted Successfully'
    };
  } catch(error: any) {
    throw new Error(error.message);
  }
};


export const getCustomerLedger = async (customerId: number) => {
    // Implementing simple fetch for now - ideally this aggregates invoices and credits
    // Since backend implementation of ledger wasn't fully inspected, assuming it returns customer + balance history
    // We will just return customer info and recent invoices/credits for now.
    const customer = db.execute(`SELECT * FROM Customer WHERE id = ${customerId}`);
    return {
        success: true,
        data: customer.rows?.item(0),
    };
}


// --- PRODUCT SERVICE ---

export const getProducts = async () => {
  try {
    const results = db.execute('SELECT * FROM Product ORDER BY createdAt DESC');
    return {
      success: true,
      data: results.rows?._array || [],
      message: 'Products Fetched Successfully'
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const addProduct = async (data: any) => {
  const { name, price } = data;
  try {
    const result = db.execute(
      `INSERT INTO Product (name, price, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [name, price, getISTTime(), getISTTime()]
    );
    const created = db.execute(`SELECT * FROM Product WHERE id = ${result.insertId}`);
    return {
      success: true,
      data: created.rows?.item(0),
      message: 'Product Added Successfully'
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateProduct = async (id: number, data: any) => {
  const { name, price } = data;
  try {
    db.execute(
      `UPDATE Product SET name = ?, price = ?, updatedAt = ? WHERE id = ?`,
      [name, price, getISTTime(), id]
    );
     const updated = db.execute(`SELECT * FROM Product WHERE id = ?`, [id]);
    return {
      success: true,
      data: updated.rows?.item(0),
      message: 'Product Updated Successfully'
    };
  } catch(error: any) {
    throw new Error(error.message);
  }
};

export const deleteProduct = async (id: number) => {
  try {
    db.execute(`DELETE FROM Product WHERE id = ?`, [id]);
    return {
      success: true,
      data: null,
      message: 'Product Deleted Successfully'
    };
  } catch(error: any) {
     throw new Error(error.message);
  }
};

// --- INVOICE SERVICE ---

export const addInvoice = async (data: any) => {
  const {
    customerId,
    totalAmount,
    amountDiscount,
    percentDiscount,
    finalAmount,
    paidByCustomer,
    invoiceLineItems,
    taxLineItems,
    packagingLineItems,
    transportationLineItems,
    numberOfCartons,
  } = data;

  try {
    db.execute('BEGIN TRANSACTION');

    // 1. Get Customer
    const custRes = db.execute(`SELECT * FROM Customer WHERE id = ?`, [customerId]);
    if (custRes.rows?.length === 0) {
        db.execute('ROLLBACK');
        throw new Error('Customer Not Found');
    }
    const customer = custRes.rows?.item(0);

    const prevBalance = customer.balance;
    const remainingBalance = prevBalance + finalAmount - paidByCustomer;

    // 2. Create Invoice
    const now = getISTTime();
    const invRes = db.execute(
      `INSERT INTO Invoice (
        customerId, totalAmount, amountDiscount, percentDiscount, finalAmount, 
        custPrevBalance, paidByCustomer, remainingBalance, numberOfCartons,
        customerName, customerPhone, customerFirm, customerAddress, 
        status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [
        customerId, totalAmount, amountDiscount, percentDiscount, finalAmount,
        prevBalance, paidByCustomer, remainingBalance, numberOfCartons ? Number(numberOfCartons) : null,
        customer.name, customer.phone, customer.firm, customer.address,
        now, now
      ]
    );
    
    if (!invRes.insertId) {
        db.execute('ROLLBACK');
        throw new Error('Failed to create invoice record');
    }
    const invoiceId = invRes.insertId;

    // 3. Update Customer Balance
    db.execute(`UPDATE Customer SET balance = ? WHERE id = ?`, [remainingBalance, customerId]);

    // 4. Line Items
    if (invoiceLineItems && invoiceLineItems.length > 0) {
      for (const item of invoiceLineItems) {
          // Fetch product for snapshot
          const prodRes = db.execute(`SELECT * FROM Product WHERE id = ?`, [item.productId]);
          const product = (prodRes.rows && prodRes.rows.length > 0) ? prodRes.rows.item(0) : null;
          
          const pPrice = item.productPrice !== undefined ? Number(item.productPrice) : (product ? product.price : 0);
          
          db.execute(
              `INSERT INTO InvoiceLineItem (
                invoiceId, productId, productName, productPrice, 
                productQuantity, productAmountDiscount, productPercentDiscount
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                  invoiceId, item.productId, product?.name, pPrice,
                  item.productQuantity, item.productAmountDiscount, item.productPercentDiscount
              ]
          );
      }
    }

    // 5. Tax, Packaging, Transport
    if (taxLineItems?.length) {
      for (const tax of taxLineItems) {
          db.execute(
              `INSERT INTO TaxLineItem (invoiceId, name, percent, amount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
              [invoiceId, tax.name, tax.percent, tax.amount, now, now]
          );
      }
    }

    if (packagingLineItems?.length) {
      for (const p of packagingLineItems) {
           db.execute(
              `INSERT INTO PackagingLineItem (invoiceId, name, amount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
              [invoiceId, p.name, p.amount, now, now]
          );
      }
    }

    if (transportationLineItems?.length) {
      for (const tr of transportationLineItems) {
           db.execute(
              `INSERT INTO TransportationLineItem (invoiceId, name, amount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
              [invoiceId, tr.name, tr.amount, now, now]
          );
      }
    }

    db.execute('COMMIT');

    const responseData = { id: invoiceId, ...data, remainingBalance }; 

    return {
      success: true,
      data: responseData,
      message: 'Invoice Created Successfully (Offline)'
    };

  } catch (error: any) {
    console.error('Offline Transaction Failed:', error);
    try {
        db.execute('ROLLBACK');
    } catch(e) { /* ignore rollback error if no transaction active */ }
    throw new Error(error.message);
  }
};


// --- HTML GENERATION ---

export const generateInvoiceHtml = async (invoiceId: number) => {
 try {
   // Fetch full invoice details
   let invoice: any = null;
   
   // Direct execution for synchronous fetching
   const invRes = db.execute('SELECT * FROM Invoice WHERE id = ?', [invoiceId]);
   if (invRes.rows?.length === 0) throw new Error('Invoice Not Found');
   invoice = invRes.rows?.item(0);

   // Line items
   const lines = db.execute('SELECT * FROM InvoiceLineItem WHERE invoiceId = ?', [invoiceId]);
   invoice.invoiceLineItems = lines.rows?._array || [];

   // Tax
   const tax = db.execute('SELECT * FROM TaxLineItem WHERE invoiceId = ?', [invoiceId]);
   invoice.taxLineItems = tax.rows?._array || [];

   // Packaging
   const pkg = db.execute('SELECT * FROM PackagingLineItem WHERE invoiceId = ?', [invoiceId]);
   invoice.packagingLineItems = pkg.rows?._array || [];

   // Transport
   const tr = db.execute('SELECT * FROM TransportationLineItem WHERE invoiceId = ?', [invoiceId]);
   invoice.transportationLineItems = tr.rows?._array || [];

    // Formatting Logic (Copied from backend)
    const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

    const productRows = invoice.invoiceLineItems
      .map((item: any) => {
        const name = item.productName || "Unnamed Product";
        const rate = Number(item.productPrice || 0);
        
        const qty = item.productQuantity;
        const total = rate * qty;

        return `
          <tr>
            <td>${name}</td>
            <td>${formatCurrency(rate)}</td>
            <td>${qty}</td>
            <td>${formatCurrency(total)}</td>
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

    const taxRows = invoice.taxLineItems
      .map((tax: any) => {
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

        const formattedPercent = displayPercent % 1 === 0 ? displayPercent.toFixed(0) : displayPercent.toFixed(2);
        return `
        <tr>
          <td>${tax.name} ${displayPercent > 0 ? `(${formattedPercent}%)` : ''}</td>
          <td></td><td></td>
          <td>${formatCurrency(displayAmount)}</td>
        </tr>`;
      })
      .join("");

    const cartonCount = invoice.numberOfCartons ? Number(invoice.numberOfCartons) : 0;
    const multiplier = cartonCount > 0 ? cartonCount : 1;

    const packagingRows = invoice.packagingLineItems
      .map(
        (p: any) => {
          const totalAmount = p.amount * multiplier;
          const label = `Packaging: ${p.name}`;
          const details = cartonCount > 0 ? `${formatCurrency(p.amount)} × ${cartonCount}` : '';
          
          return `
        <tr>
          <td>${label} ${details ? `(${details})` : ''}</td>
          <td></td><td></td>
          <td>${formatCurrency(totalAmount)}</td>
        </tr>`;
        }
      )
      .join("");

    const transportationRows = invoice.transportationLineItems
      .map(
        (t: any) => {
          const totalAmount = t.amount * multiplier;
          const label = `Transport: ${t.name}`;
          const details = cartonCount > 0 ? `${formatCurrency(t.amount)} × ${cartonCount}` : '';

          return `
        <tr>
          <td>${label} ${details ? `(${details})` : ''}</td>
          <td></td><td></td>
          <td>${formatCurrency(totalAmount)}</td>
        </tr>`;
        }
      )
      .join("");

    // Date formatting
    const createdAtDate = new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const totalQuantity = invoice.invoiceLineItems.reduce((sum: number, item: any) => sum + (Number(item.productQuantity) || 0), 0);

    const html = `
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
        padding: 10px 5px;
        color: #4B00FF;
        text-transform: uppercase;
        font-size: 13px;
      }
      table td {
        padding: 8px 5px;
        border-bottom: 1px solid #eee;
      }
      colgroup col:nth-child(1) { width: 50%; }
      colgroup col:nth-child(2) { width: 15%; }
      colgroup col:nth-child(3) { width: 10%; }
      colgroup col:nth-child(4) { width: 25%; }
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
          ${cartonCount ? `<div style="font-size: 14px; color: #666; margin-top: 5px;"><strong>No. of Cartons:</strong> ${cartonCount}</div>` : ''}
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
          Customer Phone: ${invoice.customerPhone || "N/A"}<br />
          ${invoice.customerName || ''}<br />
          ${invoice.customerFirm || "No Firm"}<br />
          ${invoice.customerAddress || "No Address"}<br />
        </div>
        <div>
          <table style="width: 100%;">
            <tr><td>Date Issued:</td><td>${createdAtDate}</td></tr>
            <tr><td>Invoice Number:</td><td>INV-${invoice.id.toString().padStart(4, "0")}</td></tr>
            <tr><td><strong>Remaining Balance:</strong></td><td><strong>${formatCurrency(invoice.remainingBalance)}</strong></td></tr>
          </table>
        </div>
      </div>

      <table>
        <colgroup><col /><col /><col /><col /></colgroup>
          <tr>
            <th>PRODUCTS</th>
            <th>RATE</th>
            <th>QTY</th>
            <th>AMOUNT</th>
          </tr>
        ${productRows}
      </table>

      <table class="totals">
        <colgroup><col /><col /><col /><col /></colgroup>
      <table class="totals">
        <colgroup><col /><col /><col /><col /></colgroup>
        <tr><td>Subtotal</td><td></td><td><strong>${totalQuantity}</strong></td><td>${formatCurrency(invoice.totalAmount)}</td></tr>
        ${discountAmount > 0 ? `<tr><td>Discount ${discountPercent > 0 ? `(${discountPercent.toFixed(2)}%)` : ''}</td><td></td><td></td><td>${formatCurrency(discountAmount)}</td></tr>` : ''}
        ${taxRows}
        ${packagingRows}
        ${transportationRows}
        <tr class="total"><td>Total</td><td></td><td></td><td>${formatCurrency(invoice.finalAmount)}</td></tr>
        <tr><td>Amount Paid by Customer</td><td></td><td></td><td>${formatCurrency(invoice.paidByCustomer)}</td></tr>
        <tr class="highlight"><td>Remaining Balance</td><td></td><td></td><td>${formatCurrency(invoice.remainingBalance)}</td></tr>
      </table>
    </div>
  </body>
</html>`;

    return {
      success: true,
      data: html,
      message: 'HTML Generated Successfully'
    };

 } catch (error: any) {
    throw new Error(error.message);
 }
};

// Transform HTML for print (A4 landscape with A5 portrait pages side-by-side)
export const generatePrintHtml = (htmlContent: string): string => {
  // Extract the invoice-box content from the original HTML
  const invoiceBoxMatch = htmlContent.match(/<div[^>]*class="invoice-box"[^>]*>([\s\S]*?)<\/div>\s*(?=<\/body>|$)/i);
  const invoiceContent = invoiceBoxMatch ? invoiceBoxMatch[1] : htmlContent.replace(/<body[^>]*>|<\/body>/gi, '');

  // A4 landscape: 297mm × 210mm
  // A5 portrait: 148mm × 210mm (fits 2 side-by-side on A4 landscape)
  const printHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice - Print</title>
    <script>
      // Force landscape orientation
      (function() {
        if (window.matchMedia) {
          var mediaQuery = window.matchMedia('print');
          mediaQuery.addListener(function(mq) {
            if (mq.matches) {
              document.body.style.width = '297mm';
              document.body.style.height = '210mm';
              document.body.style.transform = 'rotate(0deg)';
            }
          });
        }
        window.onbeforeprint = function() {
          document.body.style.width = '297mm';
          document.body.style.height = '210mm';
        };
      })();
    </script>
    <style>
      @page {
        size: landscape;
        size: 297mm 210mm;
        margin: 0;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html {
        width: 297mm;
        height: 210mm;
        margin: 0;
        padding: 0;
      }
      body {
        width: 297mm !important;
        height: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #222;
        background: white;
        overflow: hidden;
        transform: rotate(0deg);
      }
      .print-sheet {
        width: 297mm; /* A4 landscape width */
        height: 210mm; /* A4 landscape height */
        display: flex;
        flex-direction: row;
        page-break-after: auto;
      }
      .print-sheet:nth-child(2n) {
        page-break-after: always;
      }
      .a5-page {
        width: 148.5mm; /* Exactly half of A4 landscape width (297mm / 2) */
        height: 210mm; /* A5 height matches A4 landscape height */
        padding: 5mm;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        page-break-inside: avoid;
        border-right: 1px solid #ddd;
        overflow: hidden;
      }
      .a5-page:last-child {
        border-right: none;
      }
      .invoice-box {
        width: 138.5mm; /* A5 width (148.5mm) - 10mm total padding */
        min-height: 200mm; /* A5 height (210mm) - 10mm total padding */
        padding: 12mm;
        box-sizing: border-box;
        background: white;
        font-size: 12px;
        line-height: 1.4;
      }
      .title {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 25px;
      }
      .company-details {
        text-align: right;
        line-height: 16px;
        font-size: 12px;
      }
      .details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 18px;
        font-size: 12px;
      }
      .details div {
        width: 48%;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
        table-layout: fixed;
        font-size: 11px;
      }
      table th {
        border-bottom: 2px solid #4B00FF;
        text-align: left;
        padding: 8px 5px;
        color: #4B00FF;
        text-transform: uppercase;
        font-size: 11px;
      }
      table td {
        padding: 7px 5px;
        border-bottom: 1px solid #eee;
      }
      colgroup col:nth-child(1) { width: 50%; }
      colgroup col:nth-child(2) { width: 15%; }
      colgroup col:nth-child(3) { width: 10%; }
      colgroup col:nth-child(4) { width: 25%; }
      .totals {
        margin-top: 25px;
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 11px;
      }
      .totals td {
        padding: 7px 0;
        border-bottom: 1px solid #eee;
      }
      .totals .total {
        font-weight: bold;
        font-size: 13px;
        border-top: 2px solid #000;
      }
      .highlight {
        color: #4B00FF;
        font-weight: bold;
      }
      @media print {
        @page {
          size: landscape;
          size: 297mm 210mm;
          margin: 0;
        }
        html {
          width: 297mm !important;
          height: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body {
          width: 297mm !important;
          height: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          transform: rotate(0deg) !important;
        }
        .print-sheet {
          display: flex !important;
          flex-direction: row !important;
          page-break-after: auto;
          width: 297mm !important;
          height: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .print-sheet:nth-child(2n) {
          page-break-after: always;
        }
        .a5-page {
          page-break-inside: avoid;
          border-right: 1px solid #ddd;
          width: 148.5mm !important;
          height: 210mm !important;
          flex-shrink: 0;
        }
      }
      
      /* Fallback: If page is still portrait, rotate the entire content */
      @media print and (orientation: portrait) {
        body {
          transform: rotate(90deg) !important;
          transform-origin: center center !important;
          width: 210mm !important;
          height: 297mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-sheet">
      <div class="a5-page">
        <div class="invoice-box">
          ${invoiceContent}
        </div>
      </div>
      <div class="a5-page">
        <!-- Second A5 page for next invoice page or empty -->
      </div>
    </div>
  </body>
</html>`;

  return printHtml;
};

export const getInvoices = async () => {
     try {
        const results = db.execute(`
            SELECT 
                Invoice.*, 
                Customer.name as customer_name, 
                Customer.phone as customer_phone 
            FROM Invoice 
            LEFT JOIN Customer ON Invoice.customerId = Customer.id 
            ORDER BY Invoice.createdAt DESC
        `);
        
        const invoices = results.rows?._array.map((inv: any) => ({
            ...inv,
            customer: {
                name: inv.customer_name,
                phone: inv.customer_phone,
            }
        }));

        return {
            success: true,
            data: invoices,
            message: 'Invoices Fetched Successfully'
        };
     } catch (error: any) {
         throw new Error(error.message);
     }
}

// --- CREDIT SERVICE (Added) ---

export const createCredit = async (customerId: number, amountPaidByCustomer: number) => {
  try {
    let responseData: any = null;
    try {
        db.execute('BEGIN TRANSACTION');

        // 1. Get Customer to check balance
        const custRes = db.execute('SELECT * FROM Customer WHERE id = ?', [customerId]);
        if (custRes.rows?.length === 0) {
            db.execute('ROLLBACK');
            throw new Error('Customer Not Found');
        }
        const customer = custRes.rows?.item(0);

        const previousBalance = customer.balance;
        const finalBalance = previousBalance - amountPaidByCustomer;
        const now = getISTTime();

        // 2. Update Customer Balance
        db.execute('UPDATE Customer SET balance = ? WHERE id = ?', [finalBalance, customerId]);

        // 3. Create Credit Record
        const insertRes = db.execute(
            `INSERT INTO Credit (
                 customerId, previousBalance, amountPaidByCustomer, finalBalance, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
            [customerId, previousBalance, amountPaidByCustomer, finalBalance, now, now]
        );

        db.execute('COMMIT');

        // Fetch back for response
        responseData = {
            id: insertRes.insertId,
            customerId,
            previousBalance,
            amountPaidByCustomer,
            finalBalance,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
            customer: customer // include basic customer info
        };
    } catch(e: any) {
        try { db.execute('ROLLBACK'); } catch(err) {/* ignore */}
        throw e;
    }

    return {
        success: true,
        data: responseData,
        message: 'Credit Created Successfully'
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const generateCreditHtml = async (creditId: number) => {
  try {
      // Fetch credit + customer
      const res = db.execute(`
        SELECT Credit.*, 
               Customer.name as c_name, Customer.firm as c_firm, Customer.address as c_address, Customer.phone as c_phone
        FROM Credit 
        JOIN Customer ON Credit.customerId = Customer.id
        WHERE Credit.id = ?
      `, [creditId]);

      if (res.rows?.length === 0) throw new Error('Credit Not Found');
      const credit = res.rows?.item(0);

      // Map joined fields back to structure expected by template
      const customer = {
          id: credit.customerId,
          name: credit.c_name,
          firm: credit.c_firm,
          address: credit.c_address,
          phone: credit.c_phone
      };

      const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Credit Note</title>
        <style>
          @page { size: A4; margin: 0; }
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
              <div class="title">Credit Note</div>
              <div style="font-size: 18px;">Credit ID: ${credit.id}</div>
              <div>Date Issued: ${new Date(credit.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
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
              Name: ${customer.name}<br />
              Firm: ${customer.firm || "No Firm"}<br />
              Address: ${customer.address || "No Address"}<br />
            </div>

            <div>
              <table style="width: 100%;">
                <tr><td>Customer Phone:</td><td>${customer.phone || "N/A"}</td></tr>
                <tr><td>Status:</td><td>${credit.status}</td></tr>
              </table>
            </div>
          </div>

          <table class="totals">
            <tr><td>Previous Balance</td><td></td><td></td><td></td><td>₹${credit.previousBalance.toFixed(2)}</td></tr>
            <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>₹${credit.amountPaidByCustomer.toFixed(2)}</td></tr>
            <tr class="highlight"><td>New Balance</td><td></td><td></td><td></td><td>₹${credit.finalBalance.toFixed(2)}</td></tr>
          </table>
        </div>
      </body>
    </html>
    `;
    
      return {
          success: true,
          data: html,
          message: 'Credit Note HTML Generated'
      };

  } catch (error: any) {
     throw new Error(error.message);
  }
};

// --- LEDGER & HISTORY ---

export const getLedgerOverview = async () => {
    try {
        const custRes = db.execute('SELECT * FROM Customer ORDER BY name ASC');
        const customers = custRes.rows?._array || [];
        
        // Calculate Total Owed (sum of positive balances)
        const totalOwed = customers.reduce((sum: number, c: any) => sum + (c.balance > 0 ? c.balance : 0), 0);
        
        return {
            success: true,
            data: {
                customers,
                totalOwed,
                customerCount: customers.length
            },
            message: 'Ledger Data Fetched'
        };
    } catch(error: any) {
        throw new Error(error.message);
    }
};

export const getCustomerHistory = async (customerId: number) => {
    try {
        const res = db.execute('SELECT * FROM Customer WHERE id = ?', [customerId]);
        if(res.rows?.length === 0) throw new Error('Customer Not Found');
        const customer = res.rows?.item(0);

        // Fetch Invoices
        const invRes = db.execute('SELECT * FROM Invoice WHERE customerId = ? ORDER BY createdAt DESC', [customerId]);
        const invoices = invRes.rows?._array || [];

        // Fetch Credits
        const credRes = db.execute('SELECT * FROM Credit WHERE customerId = ? ORDER BY createdAt DESC', [customerId]);
        const credits = credRes.rows?._array || [];

        // Normalize transactions
        // Invoice: amount = finalAmount, paid = paidByCustomer
        const normalizedInvoices = invoices.map((i: any) => ({
             type: 'invoice',
             id: i.id,
             date: i.createdAt,
             amount: i.finalAmount,
             paid: i.paidByCustomer,
             previousBalance: i.custPrevBalance,
             newBalance: i.remainingBalance,
             status: i.status
        }));

        // Credit: amount = 0 (or implies payment), paid = amountPaidByCustomer
        const normalizedCredits = credits.map((c: any) => ({
             type: 'credit',
             id: c.id,
             date: c.createdAt,
             amount: 0, 
             paid: c.amountPaidByCustomer,
             previousBalance: c.previousBalance,
             newBalance: c.finalBalance,
             status: c.status
        }));

        const transactions = [...normalizedInvoices, ...normalizedCredits].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return {
            success: true,
            data: {
                customer,
                transactions,
                totalInvoices: invoices.length,
                totalCredits: credits.length
            },
            message: 'History Fetched'
        }

    } catch(error: any) {
        throw new Error(error.message);
    }
};

export const searchInvoices = async (filters: any) => {
    const { invoiceId, phone, customerName, dateFrom, dateTo } = filters;
    
    try {
        let query = `
            SELECT 
                Invoice.*, 
                Customer.name as customer_name, 
                Customer.phone as customer_phone 
            FROM Invoice 
            LEFT JOIN Customer ON Invoice.customerId = Customer.id 
            WHERE 1=1
        `;
        const params: any[] = [];

        if (invoiceId) {
            query += ` AND Invoice.id = ?`;
            params.push(invoiceId);
        }

        if (phone) {
            query += ` AND Customer.phone LIKE ?`;
            params.push(`%${phone}%`);
        }

        if (customerName) {
            query += ` AND Customer.name LIKE ?`;
            params.push(`%${customerName}%`);
        }

        if (dateFrom) {
            query += ` AND Invoice.createdAt >= ?`;
            // backend uses YYYY-MM-DD
            const fromDate = new Date(dateFrom).toISOString();
            params.push(fromDate);
        }

        if (dateTo) {
             query += ` AND Invoice.createdAt <= ?`;
             const toDate = new Date(dateTo);
             toDate.setHours(23, 59, 59, 999);
             params.push(toDate.toISOString());
        }

        query += ` ORDER BY Invoice.createdAt DESC`;

        const results = db.execute(query, params);
        
        const invoices = results.rows?._array.map((inv: any) => ({
            ...inv,
            customer: {
                name: inv.customer_name,
                phone: inv.customer_phone,
            }
        }));

        return {
            success: true,
            data: invoices,
            message: 'Invoices Search Results'
        };

    } catch (error: any) {
        throw new Error(error.message);
    }
};
