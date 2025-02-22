import { and, eq, or, like, gte, lte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, patient, type User, type Patient } from './schema';

// Initialize database client
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Create new user and patient
export async function createPatientWithUser(data: {
  // User data
  email: string;
  password: string;
  name: string;
  profilePicture?: string;
  // Patient specific data
  about?: string;
  age?: string;
  sex?: string;
  dateOfBirth?: string;
  location?: string;
  education?: string;
  work?: string;
  fallRisk?: 'yes' | 'no';
  promptAnswers?: Record<string, string>;
  likes?: string;
  dislikes?: string;
  symptoms?: string;
  createdById: string; // ID of the admin/moderator creating this patient
}) {
  try {
    // First create the user
    const [newUser] = await db
      .insert(user)
      .values({
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user',
        profilePicture: data.profilePicture || '',
        isActive: true,
        passcode: 1234, // You might want to generate a random passcode or take it from the request
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Then create the patient record
    const [newPatient] = await db
      .insert(patient)
      .values({
        userId: data.createdById,
        name: data.name,
        email: data.email,
        password: data.password,
        about: data.about || '',
        age: data.age || '',
        sex: data.sex || '',
        dateOfBirth: data.dateOfBirth || '',
        location: data.location || '',
        education: data.education || '',
        work: data.work || '',
        profilePicture: data.profilePicture || '',
        fallRisk: data.fallRisk || 'no',
        promptAnswers: data.promptAnswers || {},
        likes: data.likes || '',
        dislikes: data.dislikes || '',
        symptoms: data.symptoms || '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return { user: newUser, patient: newPatient };
  } catch (error) {
    console.error('Error creating patient and user:', error);
    throw error;
  }
}

// Get all patients with user details
export async function getAllPatients() {
  try {
    return await db
      .select({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        about: patient.about,
        age: patient.age,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        location: patient.location,
        education: patient.education,
        work: patient.work,
        profilePicture: patient.profilePicture,
        fallRisk: patient.fallRisk,
        promptAnswers: patient.promptAnswers,
        likes: patient.likes,
        dislikes: patient.dislikes,
        symptoms: patient.symptoms,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        userId: patient.userId,
        userRole: user.role,
        userIsActive: user.isActive
      })
      .from(patient)
      .leftJoin(user, eq(patient.email, user.email));
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
}

// Get patients by creator
export async function getPatientsByCreator(userId: string) {
  try {
    return await db
      .select({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        about: patient.about,
        age: patient.age,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        location: patient.location,
        education: patient.education,
        work: patient.work,
        profilePicture: patient.profilePicture,
        fallRisk: patient.fallRisk,
        promptAnswers: patient.promptAnswers,
        likes: patient.likes,
        dislikes: patient.dislikes,
        symptoms: patient.symptoms,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        userId: patient.userId,
        userRole: user.role,
        userIsActive: user.isActive
      })
      .from(patient)
      .leftJoin(user, eq(patient.email, user.email))
      .where(eq(patient.userId, userId));
  } catch (error) {
    console.error('Error getting patients by creator ID:', error);
    throw error;
  }
}

// Update patient and user details
export async function updatePatientAndUser(
  patientId: string,
  data: {
    email?: string;
    password?: string;
    name?: string;
    profilePicture?: string;
    about?: string;
    age?: string;
    sex?: string;
    dateOfBirth?: string;
    location?: string;
    education?: string;
    work?: string;
    fallRisk?: 'yes' | 'no';
    promptAnswers?: Record<string, string>;
    likes?: string;
    dislikes?: string;
    symptoms?: string;
  }
) {
  try {
    // Get current patient to find corresponding user
    const [currentPatient] = await db
      .select()
      .from(patient)
      .where(eq(patient.id, patientId));

    if (!currentPatient) {
      throw new Error('Patient not found');
    }

    // Update user first if common fields are changed
    if (data.email || data.password || data.name || data.profilePicture) {
      await db
        .update(user)
        .set({
          email: data.email,
          password: data.password,
          name: data.name,
          profilePicture: data.profilePicture,
          updatedAt: new Date()
        })
        .where(eq(user.email, currentPatient.email));
    }

    // Then update patient
    const [updatedPatient] = await db
      .update(patient)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(patient.id, patientId))
      .returning();

    return updatedPatient;
  } catch (error) {
    console.error('Error updating patient and user:', error);
    throw error;
  }
}

// Delete patient and associated user
export async function deletePatientAndUser(patientId: string) {
  try {
    // Get patient to find corresponding user
    const [patientToDelete] = await db
      .select()
      .from(patient)
      .where(eq(patient.id, patientId));

    if (!patientToDelete) {
      throw new Error('Patient not found');
    }

    // Delete patient first (due to foreign key constraints)
    await db
      .delete(patient)
      .where(eq(patient.id, patientId));

    // Then delete user
    await db
      .delete(user)
      .where(eq(user.email, patientToDelete.email));

    return patientToDelete;
  } catch (error) {
    console.error('Error deleting patient and user:', error);
    throw error;
  }
}

// Search patients
export async function searchPatients(searchTerm: string) {
  try {
    return await db
      .select({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        about: patient.about,
        age: patient.age,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        location: patient.location,
        education: patient.education,
        work: patient.work,
        profilePicture: patient.profilePicture,
        fallRisk: patient.fallRisk,
        promptAnswers: patient.promptAnswers,
        likes: patient.likes,
        dislikes: patient.dislikes,
        symptoms: patient.symptoms,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        userId: patient.userId,
        userRole: user.role,
        userIsActive: user.isActive
      })
      .from(patient)
      .leftJoin(user, eq(patient.email, user.email))
      .where(
        or(
          like(patient.name, `%${searchTerm}%`),
          like(patient.email, `%${searchTerm}%`),
          like(patient.about, `%${searchTerm}%`),
          like(patient.location, `%${searchTerm}%`)
        )
      );
  } catch (error) {
    console.error('Error searching patients:', error);
    throw error;
  }
}

// Get patient by ID
export async function getPatientById(id: string) {
  try {
    const result = await db
      .select({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        about: patient.about,
        age: patient.age,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        location: patient.location,
        education: patient.education,
        work: patient.work,
        profilePicture: patient.profilePicture,
        fallRisk: patient.fallRisk,
        promptAnswers: patient.promptAnswers,
        likes: patient.likes,
        dislikes: patient.dislikes,
        symptoms: patient.symptoms,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        userId: patient.userId,
        userRole: user.role,
        userIsActive: user.isActive
      })
      .from(patient)
      .leftJoin(user, eq(patient.email, user.email))
      .where(eq(patient.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    throw error;
  }
}

// Filter patients
export async function filterPatients({
  location,
  ageRange,
  sex,
  fallRisk,
}: {
  location?: string;
  ageRange?: { min: string; max: string };
  sex?: string;
  fallRisk?: 'yes' | 'no';
}) {
  try {
    const conditions = [];

    if (location) {
      conditions.push(like(patient.location, `%${location}%`));
    }

    if (ageRange) {
      conditions.push(gte(patient.age, ageRange.min));
      conditions.push(lte(patient.age, ageRange.max));
    }

    if (sex) {
      conditions.push(eq(patient.sex, sex));
    }

    if (fallRisk) {
      conditions.push(eq(patient.fallRisk, fallRisk));
    }

    const query = conditions.length > 0
      ? db
        .select({
          id: patient.id,
          name: patient.name,
          email: patient.email,
          about: patient.about,
          age: patient.age,
          sex: patient.sex,
          dateOfBirth: patient.dateOfBirth,
          location: patient.location,
          education: patient.education,
          work: patient.work,
          profilePicture: patient.profilePicture,
          fallRisk: patient.fallRisk,
          promptAnswers: patient.promptAnswers,
          likes: patient.likes,
          dislikes: patient.dislikes,
          symptoms: patient.symptoms,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          userId: patient.userId,
          userRole: user.role,
          userIsActive: user.isActive
        })
        .from(patient)
        .leftJoin(user, eq(patient.email, user.email))
        .where(and(...conditions))
      : db
        .select({
          id: patient.id,
          name: patient.name,
          email: patient.email,
          about: patient.about,
          age: patient.age,
          sex: patient.sex,
          dateOfBirth: patient.dateOfBirth,
          location: patient.location,
          education: patient.education,
          work: patient.work,
          profilePicture: patient.profilePicture,
          fallRisk: patient.fallRisk,
          promptAnswers: patient.promptAnswers,
          likes: patient.likes,
          dislikes: patient.dislikes,
          symptoms: patient.symptoms,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          userId: patient.userId,
          userRole: user.role,
          userIsActive: user.isActive
        })
        .from(patient)
        .leftJoin(user, eq(patient.email, user.email));

    return await query;
  } catch (error) {
    console.error('Error filtering patients:', error);
    throw error;
  }
}