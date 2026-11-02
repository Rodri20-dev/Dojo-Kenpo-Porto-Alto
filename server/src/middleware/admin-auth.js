
import { HttpError } from '../utils/http-error.js';

export function createAdminAuth({ authClient, adminClient }) {
  if (!authClient || !adminClient) {
    return (_req, _res, next) => {
      next(new HttpError(
        503,
        'AUTH_NOT_CONFIGURED',
        'Administrative authentication is not configured.',
      ));
    };
  }

  return async (req, _res, next) => {
    const token = req
      .get('authorization')
      ?.match(/^Bearer\s+([^\s]+)$/i)?.[1];

    if (!token) {
      return next(new HttpError(
        401,
        'UNAUTHORIZED',
        'Authentication is required.',
      ));
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser(token);

      if (authError) {
        console.error('[ADMIN AUTH] Token verification failed:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
        });
      }

      if (authError || !user) {
        return next(new HttpError(
          401,
          'UNAUTHORIZED',
          'The access token is invalid or expired.',
        ));
      }

      const { data: profile, error: profileError } = await adminClient
        .from('admin_profiles')
        .select('user_id, role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[ADMIN AUTH] Profile lookup failed:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        });
        return next(new HttpError(
          503,
          'AUTH_SERVICE_UNAVAILABLE',
          'Administrative permissions could not be verified.',
        ));
      }

      if (
        !profile ||
        profile.is_active !== true ||
        !['owner', 'admin'].includes(profile.role)
      ) {
        return next(new HttpError(
          403,
          'FORBIDDEN',
          'Administrative permission is required.',
        ));
      }

        req.auth = {
        userId: user.id,
        role: profile.role,
      };

      return next();
    } catch (error) {
      console.error('[ADMIN AUTH] Unexpected error:', error.message);

      return next(new HttpError(
        500,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred.',
      ));
    }
  };
}
