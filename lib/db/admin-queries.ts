import { and, eq, or, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, type User } from './schema';

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Get all admin users
export async function getAllAdmins() {
  try {
    return await db
      .select()
      .from(user)
      .where(eq(user.role, 'admin'));
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw error;
  }
}

// Get active admin users
export async function getActiveAdmins() {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.role, 'admin'),
          eq(user.isActive, true)
        )
      );
  } catch (error) {
    console.error('Error getting active admin users:', error);
    throw error;
  }
}

// Create new admin user
export async function createAdmin(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'>) {
  try {
    const [newAdmin] = await db
      .insert(user)
      .values({
        ...data,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newAdmin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Update admin user
export async function updateAdmin(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'role'>>) {
  try {
    const [updatedAdmin] = await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'admin')
        )
      )
      .returning();
    
    return updatedAdmin;
  } catch (error) {
    console.error('Error updating admin user:', error);
    throw error;
  }
}

// Delete admin user
export async function deleteAdmin(id: string) {
  try {
    const [deletedAdmin] = await db
      .delete(user)
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'admin')
        )
      )
      .returning();
    
    return deletedAdmin;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    throw error;
  }
}

// Search admin users
export async function searchAdmins(searchTerm: string) {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.role, 'admin'),
          or(
            like(user.name, `%${searchTerm}%`),
            like(user.email, `%${searchTerm}%`)
          )
        )
      );
  } catch (error) {
    console.error('Error searching admin users:', error);
    throw error;
  }
}

// Get admin by ID
export async function getAdminById(id: string) {
  try {
    const [admin] = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'admin')
        )
      );
    
    return admin || null;
  } catch (error) {
    console.error('Error getting admin by ID:', error);
    throw error;
  }
}

// Toggle admin active status
export async function toggleAdminStatus(id: string, isActive: boolean) {
  try {
    const [updatedAdmin] = await db
      .update(user)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'admin')
        )
      )
      .returning();
    
    return updatedAdmin;
  } catch (error) {
    console.error('Error toggling admin status:', error);
    throw error;
  }
}