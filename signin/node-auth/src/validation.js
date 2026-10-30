const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return {error: 'Enter a valid email address.'};
  }
  if (password.length < 8) {
    return {error: 'Password must contain at least 8 characters.'};
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return {error: 'Password must not exceed 72 UTF-8 bytes.'};
  }

  return {email, password};
}