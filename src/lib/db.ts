import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check connection type
const useAccelerate = process.env.DATABASE_URL?.includes('accelerate');
const hasDirectUrl = !!process.env.DIRECT_URL;

if (useAccelerate) {
  console.log('📡 Using Prisma Accelerate connection pooling');
  if (hasDirectUrl) {
    console.log('💡 DIRECT_URL is available as fallback');
  } else {
    console.warn('⚠️  No DIRECT_URL configured - consider adding it for fallback');
  }
} else {
  console.log('🔗 Using direct DB connection');
}

// Create Prisma client with enhanced logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
})

// Note: beforeExit hook is not available with Prisma Accelerate (remote query engine)
// Only register it for direct database connections
if (!useAccelerate) {
  // Use setTimeout to register the hook after Prisma client is fully initialized
  // This avoids TypeScript errors with Accelerate's remote query engine
  setTimeout(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaWithHooks = prisma as any;
      if (typeof prismaWithHooks.$on === 'function') {
        prismaWithHooks.$on('beforeExit', () => {
          console.log('⚙️ Prisma is shutting down cleanly');
        });
      }
    } catch (error) {
      // Ignore if beforeExit is not supported
    }
  }, 0);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Retry a Prisma query with automatic fallback for connection errors
 * Specifically handles P5010 errors from Prisma Accelerate
 * 
 * Note: Prisma Accelerate connection failures often indicate:
 * - Network connectivity issues to accelerate.prisma-data.net
 * - Invalid or expired Accelerate API key
 * - Firewall/proxy blocking the connection
 * 
 * Solution: Switch to DIRECT_URL in .env.local if Accelerate continues to fail
 */
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 1, // Reduced retries since Prisma already retries 3 times internally
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection errors (P5010) or fetch failures
      const isConnectionError = 
        error?.code === 'P5010' || 
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('Cannot fetch data from service');
      
      if (isConnectionError && attempt < maxRetries) {
        const retryDelay = delayMs * (attempt + 1);
        console.warn(
          `⚠️ Query attempt ${attempt + 1} failed with connection error (${error.code || 'unknown'}), ` +
          `retrying in ${retryDelay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Not a retryable error or max retries reached
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Get diagnostic information about database connectivity
 */
export function getDatabaseDiagnostics() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const isAccelerate = dbUrl?.includes('accelerate');
  
  return {
    connectionType: isAccelerate ? 'Prisma Accelerate' : 'Direct',
    hasDatabaseUrl: !!dbUrl,
    hasDirectUrl: !!directUrl,
    accelerateConfigured: isAccelerate,
    recommendations: isAccelerate && !directUrl
      ? [
          'Prisma Accelerate is configured but DIRECT_URL is missing',
          'Add DIRECT_URL to .env.local for fallback connection',
          'If Accelerate continues to fail, switch DATABASE_URL to use DIRECT_URL instead',
          'Check network connectivity to accelerate.prisma-data.net',
          'Verify Accelerate API key is valid in Prisma Cloud'
        ]
      : isAccelerate
      ? [
          'Prisma Accelerate connection is failing',
          'Consider switching DATABASE_URL to use DIRECT_URL',
          'Check Prisma Accelerate service status',
          'Verify network connectivity and firewall rules'
        ]
      : []
  };
}
