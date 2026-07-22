import { type NextRequest } from 'next/server';
import { requireAuth } from '@/services/auth';
import { loadPortalPublicSite } from '@/services/portal-public-site';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, 'portal:read');
  if (auth instanceof Response) return auth;

  try {
    return Response.json(
      { data: await loadPortalPublicSite() },
      { headers: { 'cache-control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('[api/portal/public-site] GET failed:', error);
    return Response.json(
      { error: 'Failed to fetch public site export', code: 'DB_QUERY_ERROR' },
      { status: 500 }
    );
  }
}
