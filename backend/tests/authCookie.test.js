const { getAuthToken, setAuthCookie, clearAuthCookie } = require('../utils/authCookie');

describe('auth cookie helpers', () => {
  test('extracts token from cookie header', () => {
    const req = { headers: { cookie: 'auth_token=abc123; other=value' } };
    expect(getAuthToken(req)).toBe('abc123');
  });

  test('returns null when token is missing', () => {
    const req = { headers: {} };
    expect(getAuthToken(req)).toBeNull();
  });

  test('sets cookie attributes for response', () => {
    const res = {
      cookie: jest.fn()
    };

    setAuthCookie(res, 'token');

    expect(res.cookie).toHaveBeenCalledWith(
      'auth_token',
      'token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' })
    );
  });

  test('clears cookie for logout', () => {
    const res = {
      clearCookie: jest.fn()
    };

    clearAuthCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith('auth_token', expect.objectContaining({ path: '/' }));
  });

  test('uses secure cookies for https requests', () => {
    const req = { secure: true };
    const res = { cookie: jest.fn() };

    setAuthCookie(res, 'token', req);

    expect(res.cookie).toHaveBeenCalledWith(
      'auth_token',
      'token',
      expect.objectContaining({ secure: true, sameSite: 'none' })
    );
  });
});
