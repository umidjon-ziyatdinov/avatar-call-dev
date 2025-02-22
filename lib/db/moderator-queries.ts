import { and, eq, or, like, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, type User } from './schema';

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Get all moderator users
export async function getAllModerators() {
  try {
    return await db
      .select()
      .from(user)
      .where(eq(user.role, 'moderator'));
  } catch (error) {
    console.error('Error getting moderator users:', error);
    throw error;
  }
}

// Get active moderator users
export async function getActiveModerators() {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.role, 'moderator'),
          eq(user.isActive, true)
        )
      );
  } catch (error) {
    console.error('Error getting active moderator users:', error);
    throw error;
  }
}

// Create new moderator user
export async function createModerator(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'>) {
  try {
    const [newModerator] = await db
      .insert(user)
      .values({
        ...data,
        role: 'moderator',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newModerator;
  } catch (error) {
    console.error('Error creating moderator user:', error);
    throw error;
  }
}

// Update moderator user
export async function updateModerator(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'role'>>) {
  try {
    const [updatedModerator] = await db
      .update(user)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'moderator')
        )
      )
      .returning();
    
    return updatedModerator;
  } catch (error) {
    console.error('Error updating moderator user:', error);
    throw error;
  }
}

// Delete moderator user
export async function deleteModerator(id: string) {
  try {
    const [deletedModerator] = await db
      .delete(user)
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'moderator')
        )
      )
      .returning();
    
    return deletedModerator;
  } catch (error) {
    console.error('Error deleting moderator user:', error);
    throw error;
  }
}

// Search moderator users
export async function searchModerators(searchTerm: string) {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.role, 'moderator'),
          or(
            like(user.name, `%${searchTerm}%`),
            like(user.email, `%${searchTerm}%`)
          )
        )
      );
  } catch (error) {
    console.error('Error searching moderator users:', error);
    throw error;
  }
}

// Get moderator by ID
export async function getModeratorById(id: string) {
  try {
    const [moderator] = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'moderator')
        )
      );
    
    return moderator || null;
  } catch (error) {
    console.error('Error getting moderator by ID:', error);
    throw error;
  }
}

// Toggle moderator active status
export async function toggleModeratorStatus(id: string, isActive: boolean) {
  try {
    const [updatedModerator] = await db
      .update(user)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(user.id, id),
          eq(user.role, 'moderator')
        )
      )
      .returning();
    
    return updatedModerator;
  } catch (error) {
    console.error('Error toggling moderator status:', error);
    throw error;
  }
}

// Count total moderators
export async function countModerators(includeInactive: boolean = false) {
  try {
    const conditions = [eq(user.role, 'moderator')];
    if (!includeInactive) {
      conditions.push(eq(user.isActive, true));
    }

    const result = await db
      .select()
      .from(user)
      .where(and(...conditions));

    return result.length;
  } catch (error) {
    console.error('Error counting moderators:', error);
    throw error;
  }
}

// Get moderators by creation date range
export async function getModeratorsByDateRange(startDate: Date, endDate: Date) {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.role, 'moderator'),
          sql`${user.createdAt} >= ${startDate}`,
          sql`${user.createdAt} <= ${endDate}`
        )
      );
  } catch (error) {
    console.error('Error getting moderators by date range:', error);
    throw error;
  }
}