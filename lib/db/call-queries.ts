// lib/db/queries.ts

import { and, eq, inArray, desc, gte, lte, sql } from 'drizzle-orm';
import { call, patient, avatar, user, type NewCall } from './schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';



// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getModeratorPatients(moderatorId: string) {
  try {
    const patients = await db
      .select()
      .from(patient)
      .where(and(
        eq(patient.userId, moderatorId),
        // Add any other conditions specific to moderator's patients
      ));
    
    return patients;
  } catch (error) {
    console.error('Error getting moderator patients:', error);
    throw new Error('Failed to get moderator patients');
  }
}

export async function getAllCallsByModeratorId(moderatorId: string) {
  try {
    // First get all patients for this moderator
    const moderatorPatients = await db
      .select({
        id: patient.id
      })
      .from(patient)
      .where(eq(patient.userId, moderatorId));

    const patientIds = moderatorPatients.map(p => p.id);
    
    if (patientIds.length === 0) {
      return [];
    }

    // Get calls with joins
    const calls = await db
      .select({
        id: call.id,
        createdAt: call.createdAt,
        endedAt: call.endedAt,
        duration: call.duration,
        status: call.status,
        recordingUrl: call.recordingUrl,
        transcriptUrl: call.transcriptUrl,
        analysis: call.analysis,
        qualityMetrics: call.qualityMetrics,
        conversationMetrics: call.conversationMetrics,
        technicalDetails: call.technicalDetails,
        // Patient fields
        userName: patient.name,
        userEmail: patient.email,
        userProfilePicture: patient.profilePicture,
        // Avatar fields
        avatarName: avatar.name,
        avatarRole: avatar.role,
        avatarImage: avatar.avatarImage
      })
      .from(call)
      .leftJoin(patient, eq(call.userId, patient.id))
      .leftJoin(avatar, eq(call.avatarId, avatar.id))
      .where(inArray(call.userId, patientIds))
      .orderBy(desc(call.createdAt));

    return calls;
  } catch (error) {
    console.error('Error getting moderator calls:', error);
    throw new Error('Failed to get moderator calls');
  }
}

export async function getCallByIdForModerator({ callId, moderatorId }: { callId: string; moderatorId: string }) {
  try {
    // First verify this call belongs to one of the moderator's patients
    const moderatorPatients = await db
      .select({
        id: patient.id
      })
      .from(patient)
      .where(eq(patient.userId, moderatorId));

    const patientIds = moderatorPatients.map(p => p.id);

    if (patientIds.length === 0) {
      return null;
    }

    const result = await db.select({
      id: call.id,
      createdAt: call.createdAt,
      endedAt: call.endedAt,
      duration: call.duration,
      status: call.status,
      recordingUrl: call.recordingUrl,
      transcriptUrl: call.transcriptUrl,
      qualityMetrics: call.qualityMetrics,
      conversationMetrics: call.conversationMetrics,
      technicalDetails: call.technicalDetails,
      analysis: call.analysis,
      errorLogs: call.errorLogs,
      metadata: call.metadata,
      // Patient fields
      name: patient.name,
      age: patient.age,
      profilePicture: patient.profilePicture,
      sex: patient.sex,
      // Avatar fields
      avatarName: avatar.name,
      avatarRole: avatar.role,
      avatarImage: avatar.avatarImage,
    })
    .from(call)
    .leftJoin(patient, eq(call.userId, patient.id))
    .leftJoin(avatar, eq(call.avatarId, avatar.id))
    .where(
      and(
        eq(call.id, callId),
        inArray(call.userId, patientIds)
      )
    )
    .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting call:', error);
    throw new Error('Failed to get call');
  }
}

interface ModeratorCallFilters {
  userId?: string;
  avatarId?: string;
  status?: 'active' | 'completed' | 'failed' | 'missed';
  startDate?: Date;
  endDate?: Date;
}

export async function getFilteredModeratorCalls(moderatorId: string, filters: ModeratorCallFilters = {}) {
  try {
    // First get all patients for this moderator
    const moderatorPatients = await db
      .select({
        id: patient.id
      })
      .from(patient)
      .where(eq(patient.userId, moderatorId));

    const patientIds = moderatorPatients.map(p => p.id);
    
    if (patientIds.length === 0) {
      return [];
    }

    // Build where conditions
    const whereConditions = [
      inArray(call.userId, patientIds),
      filters.userId ? eq(call.userId, filters.userId) : undefined,
      filters.avatarId ? eq(call.avatarId, filters.avatarId) : undefined,
      filters.status ? eq(call.status, filters.status) : undefined,
      filters.startDate ? gte(call.createdAt, filters.startDate) : undefined,
      filters.endDate ? lte(call.createdAt, filters.endDate) : undefined,
    ].filter(Boolean);

    const calls = await db
      .select({
        id: call.id,
        createdAt: call.createdAt,
        endedAt: call.endedAt,
        duration: call.duration,
        status: call.status,
        recordingUrl: call.recordingUrl,
        transcriptUrl: call.transcriptUrl,
        analysis: call.analysis,
        qualityMetrics: call.qualityMetrics,
        conversationMetrics: call.conversationMetrics,
        technicalDetails: call.technicalDetails,
        // Patient fields
        userName: patient.name,
        userEmail: patient.email,
        userProfilePicture: patient.profilePicture,
        // Avatar fields
        avatarName: avatar.name,
        avatarRole: avatar.role,
        avatarImage: avatar.avatarImage
      })
      .from(call)
      .leftJoin(patient, eq(call.userId, patient.id))
      .leftJoin(avatar, eq(call.avatarId, avatar.id))
      .where(and(...whereConditions))
      .orderBy(desc(call.createdAt));

    return calls;
  } catch (error) {
    console.error('Error getting filtered moderator calls:', error);
    throw new Error('Failed to get filtered moderator calls');
  }
}