import getDatabase from './database/db';
import customerService from './customer.service';

export interface Credit {
  id: number;
  customerId: number;
  previousBalance: number;
  amountPaidByCustomer: number;
  finalBalance: number;
  status: 'ACTIVE' | 'VOID';
  createdAt: string;
  updatedAt?: string;
  customer?: any;
}

export interface CreateCreditData {
  amountPaidByCustomer: number;
}

class CreditService {
  // Get All Credits (with Customer info)
  async getAllCredits(): Promise<Credit[]> {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT c.*, 
              cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone,
              cust.firm as customer_firm, cust.address as customer_address,
              cust.balance as customer_balance, cust.createdAt as customer_createdAt
       FROM Credit c
       JOIN Customer cust ON c.customerId = cust.id
       ORDER BY c.createdAt DESC`
    ) || [];
    
    const credits = rows.map((row: any) => ({
      id: row.id,
      customerId: row.customerId,
      previousBalance: row.previousBalance,
      amountPaidByCustomer: row.amountPaidByCustomer,
      finalBalance: row.finalBalance,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        firm: row.customer_firm,
        address: row.customer_address,
        balance: row.customer_balance,
        createdAt: row.customer_createdAt,
      },
    }));
    
    return credits;
  }

  // Create Credit
  async createCredit(customerId: number, data: CreateCreditData): Promise<Credit> {
    const db = getDatabase();
    
    const customer = await customerService.getCustomerById(customerId);
    const finalBalance = customer.balance - data.amountPaidByCustomer;
    
    // Use transaction-like behavior
    try {
      // Update customer balance
      db.runSync(
        'UPDATE Customer SET balance = ?, updatedAt = ? WHERE id = ?',
        [finalBalance, new Date().toISOString(), customerId]
      );
      
      // Create credit
      const now = new Date().toISOString();
      const result = db.runSync(
        `INSERT INTO Credit (customerId, previousBalance, amountPaidByCustomer, finalBalance, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          customer.balance,
          data.amountPaidByCustomer,
          finalBalance,
          'ACTIVE',
          now,
        ]
      );
      
      return this.getCreditById(result.lastInsertRowId!);
    } catch (error) {
      // Rollback would be handled by SQLite transactions if we implement them
      throw error;
    }
  }

  // Get Credits by Customer ID
  async getCreditsByCustomerId(customerId: number): Promise<Credit[]> {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT c.*, 
              cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone,
              cust.firm as customer_firm, cust.address as customer_address,
              cust.balance as customer_balance, cust.createdAt as customer_createdAt
       FROM Credit c
       JOIN Customer cust ON c.customerId = cust.id
       WHERE c.customerId = ?
       ORDER BY c.createdAt DESC`,
      [customerId]
    ) || [];
    
    const credits = rows.map((row: any) => ({
      id: row.id,
      customerId: row.customerId,
      previousBalance: row.previousBalance,
      amountPaidByCustomer: row.amountPaidByCustomer,
      finalBalance: row.finalBalance,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        firm: row.customer_firm,
        address: row.customer_address,
        balance: row.customer_balance,
        createdAt: row.customer_createdAt,
      },
    }));
    
    return credits;
  }

  // Get Credit by ID
  async getCreditById(id: number): Promise<Credit> {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      `SELECT c.*, 
              cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone,
              cust.firm as customer_firm, cust.address as customer_address,
              cust.balance as customer_balance, cust.createdAt as customer_createdAt
       FROM Credit c
       JOIN Customer cust ON c.customerId = cust.id
       WHERE c.id = ?`,
      [id]
    );
    
    if (!row) {
      throw new Error('Credit not found');
    }
    
    return {
      id: row.id,
      customerId: row.customerId,
      previousBalance: row.previousBalance,
      amountPaidByCustomer: row.amountPaidByCustomer,
      finalBalance: row.finalBalance,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        firm: row.customer_firm,
        address: row.customer_address,
        balance: row.customer_balance,
        createdAt: row.customer_createdAt,
      },
    };
  }

  // Void Credit by ID
  async voidCreditById(id: number): Promise<Credit> {
    const db = getDatabase();
    const credit = await this.getCreditById(id);
    
    if (credit.status === 'VOID') {
      throw new Error('Credit Already Voided');
    }
    
    try {
      // Restore customer balance
      db.runSync(
        'UPDATE Customer SET balance = ?, updatedAt = ? WHERE id = ?',
        [credit.previousBalance, new Date().toISOString(), credit.customerId]
      );
      
      // Update credit status
      db.runSync(
        'UPDATE Credit SET status = ?, updatedAt = ? WHERE id = ?',
        ['VOID', new Date().toISOString(), id]
      );
      
      return this.getCreditById(id);
    } catch (error) {
      throw error;
    }
  }

  // Generate Credit HTML
  generateCreditHtml(credit: Credit): string {
    const { previousBalance, amountPaidByCustomer, finalBalance, customer } = credit;
    
    return `
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
              <div>Date Issued: ${new Date(credit.createdAt).toLocaleDateString()}</div>
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
                <tr><td>Customer ID:</td><td>${customer.id}</td></tr>
                <tr><td>Status:</td><td>${credit.status}</td></tr>
              </table>
            </div>
          </div>

          <table class="totals">
            <tr><td>Previous Balance</td><td></td><td></td><td></td><td>₹${previousBalance.toFixed(2)}</td></tr>
            <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>₹${amountPaidByCustomer.toFixed(2)}</td></tr>
            <tr class="highlight"><td>New Balance</td><td></td><td></td><td></td><td>₹${finalBalance.toFixed(2)}</td></tr>
          </table>
        </div>
      </body>
    </html>
    `;
  }
}

export default new CreditService();
