import getDatabase from './database/db';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  firm: string;
  address?: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  firm: string;
  address?: string;
  balance: number;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  firm?: string;
  balance?: number;
}

class CustomerService {
  // Get All Customers
  async getAllCustomers(): Promise<Customer[]> {
    const db = getDatabase();
    const result = db.getAllSync<Customer>('SELECT * FROM Customer ORDER BY id DESC');
    return result || [];
  }

  // Create a New Customer
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    console.log('[CustomerService] createCustomer called with:', data);
    
    try {
      const db = getDatabase();
      console.log('[CustomerService] Database obtained');
      
      // Check if phone already exists
      console.log('[CustomerService] Checking for existing customer with phone:', data.phone.trim());
      const existing = db.getAllSync<Customer>(
        'SELECT * FROM Customer WHERE phone = ?',
        [data.phone.trim()]
      );
      
      console.log('[CustomerService] Existing customers found:', existing?.length || 0);
      
      if (existing && existing.length > 0) {
        throw new Error(
          `Customer with Phone Number ${data.phone.trim()} Already Exists: ${
            existing[0].name
          }`
        );
      }

      const now = new Date().toISOString();
      console.log('[CustomerService] Inserting customer into database...');
      const result = db.runSync(
        `INSERT INTO Customer (name, phone, firm, address, balance, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.name.trim(),
          data.phone.trim(),
          data.firm.trim(),
          data.address?.trim() || '',
          data.balance,
          now,
        ]
      );

      console.log('[CustomerService] Insert result:', result);
      console.log('[CustomerService] Last insert ID:', result.lastInsertRowId);

      const customer = await this.getCustomerById(result.lastInsertRowId!);
      console.log('[CustomerService] Customer retrieved:', customer);
      return customer;
    } catch (error: any) {
      console.error('[CustomerService] Error in createCustomer:', error);
      throw error;
    }
  }

  // Get Customer by ID
  async getCustomerById(id: number): Promise<Customer> {
    const db = getDatabase();
    const result = db.getFirstSync<Customer>('SELECT * FROM Customer WHERE id = ?', [id]);
    
    if (!result) {
      throw new Error('Customer not Found');
    }
    
    return result;
  }

  // Update Customer
  async updateCustomer(id: number, data: UpdateCustomerData): Promise<Customer> {
    const db = getDatabase();
    
    // Check if customer exists
    await this.getCustomerById(id);
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(String(data.name).trim());
    }
    if (data.firm !== undefined) {
      updates.push('firm = ?');
      values.push(data.firm === null ? null : String(data.firm).trim());
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone === null ? null : String(data.phone).trim());
    }
    if (data.balance !== undefined) {
      updates.push('balance = ?');
      values.push(Number(data.balance));
    }
    
    if (updates.length === 0) {
      throw new Error('No Fields to Update');
    }
    
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.runSync(
      `UPDATE Customer SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getCustomerById(id);
  }

  // Delete Customer
  async deleteCustomer(id: number): Promise<Customer> {
    const db = getDatabase();
    const existing = await this.getCustomerById(id);
    
    db.runSync('DELETE FROM Customer WHERE id = ?', [id]);
    return existing;
  }

  // Get Customer Ledger (all customers with outstanding balances)
  async getCustomerLedger() {
    const db = getDatabase();
    const customers = db.getAllSync<Customer>(
      `SELECT id, name, phone, firm, balance, createdAt, updatedAt
       FROM Customer
       WHERE balance != 0
       ORDER BY balance DESC`
    );
    
    const customerList = customers || [];
    const totalOwed = customerList.reduce((sum, customer) => sum + customer.balance, 0);
    
    return {
      customers: customerList,
      totalOwed,
      customerCount: customerList.length,
    };
  }

  // Get Customer History (all invoices and credits for a customer)
  async getCustomerHistory(customerId: number) {
    const db = getDatabase();
    
    const customer = await this.getCustomerById(customerId);
    
    // Get all invoices
    const invoices = db.getAllSync<any>(
      `SELECT id, totalAmount, amountDiscount, percentDiscount, finalAmount,
              custPrevBalance, paidByCustomer, remainingBalance, status, createdAt
       FROM Invoice
       WHERE customerId = ?
       ORDER BY createdAt DESC`,
      [customerId]
    ) || [];
    
    // Get all credits
    const credits = db.getAllSync<any>(
      `SELECT id, previousBalance, amountPaidByCustomer, finalBalance, status, createdAt
       FROM Credit
       WHERE customerId = ?
       ORDER BY createdAt DESC`,
      [customerId]
    ) || [];
    
    // Combine and sort by date
    const transactions = [
      ...invoices.map((inv: any) => ({
        type: 'invoice',
        id: inv.id,
        date: inv.createdAt,
        amount: inv.finalAmount,
        paid: inv.paidByCustomer,
        previousBalance: inv.custPrevBalance,
        newBalance: inv.remainingBalance,
        status: inv.status,
        details: inv,
      })),
      ...credits.map((cred: any) => ({
        type: 'credit',
        id: cred.id,
        date: cred.createdAt,
        amount: 0,
        paid: cred.amountPaidByCustomer,
        previousBalance: cred.previousBalance,
        newBalance: cred.finalBalance,
        status: cred.status,
        details: cred,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      customer,
      transactions,
      totalInvoices: invoices.length,
      totalCredits: credits.length,
    };
  }
}

export default new CustomerService();
