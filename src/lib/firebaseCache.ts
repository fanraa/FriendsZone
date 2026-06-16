import { DocumentReference, getDoc, DocumentSnapshot, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Memory cache stores for Zero/Low Firestore I/O
export const firestoreMemoryCache = {
  users: new Map<string, any>(),
  posts: new Map<string, any>(),
  isUsersSnapshotActive: false,
  isPostsSnapshotActive: false,
};

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: "scan" | "compression" | "report_flagged" | "admin_restore" | "admin_delete" | "user_report";
  message: string;
  details?: any;
}

export const systemAuditLogs: AuditLogEntry[] = [
  {
    id: "log_initial",
    timestamp: new Date().toLocaleTimeString(),
    type: "scan",
    message: "FanraBot Zero-Cost Canvas Guard & RAM Cache system initialized.",
    details: { system: "V1.8+" }
  }
];

export function addAuditLog(type: AuditLogEntry["type"], message: string, details?: any) {
  const newLog: AuditLogEntry = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    details
  };
  systemAuditLogs.unshift(newLog);
  if (systemAuditLogs.length > 50) {
    systemAuditLogs.pop();
  }
}

// Sync functions to be called by snapshots to keep RAM cache fresh
export function syncUsersCache(usersMap: Record<string, any>) {
  firestoreMemoryCache.users.clear();
  Object.entries(usersMap).forEach(([id, data]) => {
    firestoreMemoryCache.users.set(id.toLowerCase().trim(), data);
  });
  firestoreMemoryCache.isUsersSnapshotActive = true;
}

export function syncPostsCache(postsList: any[]) {
  firestoreMemoryCache.posts.clear();
  postsList.forEach((post) => {
    firestoreMemoryCache.posts.set(post.id.toLowerCase().trim(), post);
  });
  firestoreMemoryCache.isPostsSnapshotActive = true;
}

// Custom DocumentSnapshot helper to act as a drop-in mock
class CachedDocSnapshot {
  existsValue: boolean;
  docData: any;
  id: string;

  constructor(id: string, exists: boolean, data: any) {
    this.id = id;
    this.existsValue = exists;
    this.docData = data;
  }

  exists(): boolean {
    return this.existsValue;
  }

  data(): any {
    return this.docData;
  }

  get(fieldPath: string): any {
    return this.docData?.[fieldPath];
  }
}

// Intercept getDoc: If memory snapshot is active, serve it with 0 reads!
export async function cachedGetDoc(docRef: DocumentReference<any>): Promise<DocumentSnapshot<any>> {
  const pathSegments = docRef.path.split("/");
  if (pathSegments.length === 2) {
    const [collectionName, docId] = pathSegments;
    const key = docId.toLowerCase().trim();

    if (collectionName === "users" && firestoreMemoryCache.isUsersSnapshotActive) {
      const cachedData = firestoreMemoryCache.users.get(key);
      const exists = cachedData !== undefined;
      console.log(`[RAM Cache Hit] served user "${docId}" from RAM cache. Saved 1 Firestore Read! 🚀`);
      return new CachedDocSnapshot(docId, exists, cachedData) as any;
    }

    if (collectionName === "posts" && firestoreMemoryCache.isPostsSnapshotActive) {
      const cachedData = firestoreMemoryCache.posts.get(key);
      const exists = cachedData !== undefined;
      console.log(`[RAM Cache Hit] served post "${docId}" from RAM cache. Saved 1 Firestore Read! 🚀`);
      return new CachedDocSnapshot(docId, exists, cachedData) as any;
    }
  }

  // Fallback to network read if target cache is not warm
  console.log(`[RAM Cache Miss] fetching document "${docRef.path}" from raw Firestore network.`);
  return await getDoc(docRef);
}

// Debounced and batched multi-user reader to collapse repetitive getDoc reads into one query pool
const pendingUserBatch = new Set<string>();
const batchResolvers = new Map<string, Array<{ resolve: (v: any) => void; reject: (e: any) => void }>>();
let batchTimer: any = null;

export function fetchUserInBatch(userId: string): Promise<any> {
  const cleanId = userId.toLowerCase().trim();
  
  // Resolve instantly if cached
  if (firestoreMemoryCache.isUsersSnapshotActive && firestoreMemoryCache.users.has(cleanId)) {
    return Promise.resolve(firestoreMemoryCache.users.get(cleanId));
  }

  return new Promise((resolve, reject) => {
    if (!batchResolvers.has(cleanId)) {
      batchResolvers.set(cleanId, []);
    }
    batchResolvers.get(cleanId)?.push({ resolve, reject });
    pendingUserBatch.add(cleanId);

    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(async () => {
      const currentBatch = Array.from(pendingUserBatch);
      pendingUserBatch.clear();
      batchTimer = null;

      if (currentBatch.length === 0) return;

      console.log(`[Batch Read Router] Aggregating reads for:`, currentBatch);
      
      if (firestoreMemoryCache.isUsersSnapshotActive) {
        currentBatch.forEach((id) => {
          const cachedUserData = firestoreMemoryCache.users.get(id);
          const resolvers = batchResolvers.get(id) || [];
          resolvers.forEach((r) => r.resolve(cachedUserData));
          batchResolvers.delete(id);
        });
        return;
      }

      // If snapshots are not yet warm, execute a batch read query to save Firestore read quota
      try {
        const usersRef = collection(db, "users");
        
        // Chunk batch list in blocks of 10 for Firestore 'in' limitation safety
        const chunks: string[][] = [];
        for (let i = 0; i < currentBatch.length; i += 10) {
          chunks.push(currentBatch.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const q = query(usersRef, where("id", "in", chunk));
          const snap = await getDocs(q);
          const found = new Map<string, any>();
          
          snap.forEach((snapshotDoc: any) => {
            found.set(snapshotDoc.id.toLowerCase().trim(), snapshotDoc.data());
          });

          chunk.forEach((id) => {
            const data = found.get(id);
            const resolvers = batchResolvers.get(id) || [];
            resolvers.forEach((r) => r.resolve(data));
            batchResolvers.delete(id);
          });
        }
      } catch (err) {
        console.error("[Batch Read Router Error]", err);
        currentBatch.forEach((id) => {
          const resolvers = batchResolvers.get(id) || [];
          resolvers.forEach((r) => r.reject(err));
          batchResolvers.delete(id);
        });
      }
    }, 50);
  });
}
