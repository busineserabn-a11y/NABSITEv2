import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Global promise timeout wrapper to ensure no Firebase operation hangs indefinitely
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'The operation timed out. Please check your network and try again.'
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Strict error handler conforming to Zero-Trust Firestore Security specifications
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    timestamp: new Date().toISOString(),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
  };

  console.error('[Firestore Error Context]', JSON.stringify(errInfo, null, 2));

  // If missing permissions or network error, provide clear guidance
  if (errMessage.includes('permission') || errMessage.includes('Missing or insufficient permissions')) {
    throw new Error(`Permission Denied: You do not have authorization to perform ${operationType} on ${path || 'resource'}.`);
  }
  if (errMessage.includes('offline') || errMessage.includes('unavailable')) {
    throw new Error('Connection Error: The database is currently unreachable. Please verify your connection.');
  }

  throw new Error(errMessage);
}

/**
 * Logs mutation actions to the durable auditLogs collection in Firestore
 */
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
  targetName?: string,
  companyId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const user = auth.currentUser;
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id: logId,
      userId: user?.uid || 'system',
      userEmail: user?.email || 'system',
      userName: user?.displayName || user?.email || 'Authorized User',
      action,
      entityType,
      entityId,
      targetName: targetName || '',
      companyId: companyId || '',
      details: details || '',
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    await setDoc(doc(firestoreDb, 'auditLogs', logId), record).catch(() => {});
  } catch (err) {
    console.warn('Audit log write notice:', err);
  }
}

/**
 * Structured error logger
 */
export function logError(
  operation: string,
  error: any,
  context?: Record<string, any>
): void {
  const logPayload = {
    operation,
    userId: auth.currentUser?.uid || 'anonymous',
    userEmail: auth.currentUser?.email || 'none',
    errorCode: error?.code || error?.name || 'UNKNOWN_ERROR',
    errorMessage: error?.message || String(error),
    timestamp: new Date().toISOString(),
    context: context || {},
  };
  console.error('[NABSITE Structured Error]', logPayload);
}
