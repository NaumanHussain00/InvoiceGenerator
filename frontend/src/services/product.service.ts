import getDatabase from './database/db';

export interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductData {
  name: string;
  price: number;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
}

class ProductService {
  // Get All Products
  async getAllProducts(): Promise<Product[]> {
    const db = getDatabase();
    const result = db.getAllSync<Product>('SELECT * FROM Product ORDER BY id DESC');
    return result || [];
  }

  // Create a New Product
  async createProduct(data: CreateProductData): Promise<Product> {
    const db = getDatabase();
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      throw new Error('Name is Required');
    }
    
    if (
      data.price === undefined ||
      data.price === null ||
      !Number.isFinite(Number(data.price)) ||
      Number(data.price) < 0
    ) {
      throw new Error('Price is Required and must be a non-negative number');
    }

    const now = new Date().toISOString();
    const result = db.runSync(
      `INSERT INTO Product (name, price, createdAt)
       VALUES (?, ?, ?)`,
      [String(data.name).trim(), Number(data.price), now]
    );

    return this.getProductById(result.lastInsertRowId!);
  }

  // Get Product by ID
  async getProductById(id: number): Promise<Product> {
    const db = getDatabase();
    const result = db.getFirstSync<Product>('SELECT * FROM Product WHERE id = ?', [id]);
    
    if (!result) {
      throw new Error('Product not Found');
    }
    
    return result;
  }

  // Update Product
  async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
    const db = getDatabase();
    
    // Check if product exists
    await this.getProductById(id);
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(String(data.name).trim());
    }
    if (data.price !== undefined) {
      const priceNum = Number(data.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error('Price must be a non-negative number');
      }
      updates.push('price = ?');
      values.push(priceNum);
    }
    
    if (updates.length === 0) {
      throw new Error('No Fields to Update');
    }
    
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.runSync(
      `UPDATE Product SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getProductById(id);
  }

  // Delete Product
  async deleteProduct(id: number): Promise<Product> {
    const db = getDatabase();
    const existing = await this.getProductById(id);
    
    db.runSync('DELETE FROM Product WHERE id = ?', [id]);
    return existing;
  }
}

export default new ProductService();
