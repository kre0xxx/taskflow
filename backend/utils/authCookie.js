const cookieName = 'auth_token';

const isHttpsRequest = (req) => {
  if (!req) return false;
  return Boolean(
    req.secure ||
    req.protocol === 'https' ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-proto']?.includes('https')
  );
};

const getAuthToken = (req) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map(c => c.trim()).filter(Boolean);
  const authCookie = cookies.find(cookie => cookie.startsWith(`${cookieName}=`));

  if (!authCookie) return null;

  return decodeURIComponent(authCookie.substring(cookieName.length + 1));
};

const getCookieOptions = (req = null) => {
  const secure = isHttpsRequest(req) || process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/'
  };
};

const setAuthCookie = (res, token, req = null) => {
  res.cookie(cookieName, token, getCookieOptions(req));
};

const clearAuthCookie = (res, req = null) => {
  const options = getCookieOptions(req);
  res.clearCookie(cookieName, { path: '/', secure: options.secure, sameSite: options.sameSite });
};

module.exports = {
  cookieName,
  getAuthToken,
  setAuthCookie,
  clearAuthCookie
};
