/**
 * IP Geolocation API Route
 *
 * Returns approximate location based on client IP address.
 * Uses ip-api.com free tier with caching.
 *
 * @see contracts/api.md for full specification
 */

import { NextRequest, NextResponse } from 'next/server';
import type { IpGeoResponse } from '@/types/solar';

// In-memory cache for IP geo results (simple approach for serverless)
// In production, consider using Redis or similar
const ipCache = new Map<string, { data: IpGeoResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Extract client IP from request headers
 * Handles various proxy configurations
 */
function getClientIp(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel/Netlify specific
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback - this will be the server IP in development
  return '127.0.0.1';
}

/**
 * Check if an IP is a local/private address
 */
function isLocalIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

/**
 * Fetch geolocation from ip-api.com
 */
async function fetchIpGeo(ip: string): Promise<IpGeoResponse> {
  // ip-api.com free tier endpoint
  // Note: Free tier is HTTP only, for HTTPS use paid tier
  const url = `http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    // Set timeout
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`ip-api.com returned ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'fail') {
    throw new Error(data.message || 'IP lookup failed');
  }

  return {
    lat: data.lat,
    lng: data.lon,
    city: data.city || undefined,
    country: data.country || undefined,
  };
}

/**
 * GET /api/ip-geo
 *
 * Returns approximate location based on client IP address.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);

    // For local development, return Taipei as default
    if (isLocalIp(clientIp)) {
      const defaultLocation: IpGeoResponse = {
        lat: 25.033,
        lng: 121.5654,
        city: 'Taipei',
        country: 'Taiwan',
      };

      return NextResponse.json(defaultLocation, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=3600',
          'X-IP-Source': 'local-default',
        },
      });
    }

    // Check cache
    const cached = ipCache.get(clientIp);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=3600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch from ip-api.com
    const geoData = await fetchIpGeo(clientIp);

    // Store in cache
    ipCache.set(clientIp, {
      data: geoData,
      timestamp: Date.now(),
    });

    // Clean old cache entries periodically (simple approach)
    if (ipCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of ipCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) {
          ipCache.delete(key);
        }
      }
    }

    return NextResponse.json(geoData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=3600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[ip-geo] Error:', error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        error: 'IP geolocation service unavailable',
        code: 'IP_GEO_UNAVAILABLE',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
