const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
const PASSWORD_LENGTH_MESSAGE = 'Password 8 से 128 characters के बीच होना चाहिए।';

export function validateAuthInput(email, password, mode, name = '') {
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return {field: 'email', message: 'कृपया सही Email Address डालें।'};
  }

  if (mode === 'signup' && (!name.trim() || name.trim().length > 80)) {
    return {field: 'name', message: 'Name must be between 1 and 80 characters.'};
  }

  if ((mode === 'login' || mode === 'signup') && (password.length < 8 || password.length > 128)) {
    return {
      field: 'password',
      message: PASSWORD_LENGTH_MESSAGE,
    };
  }

  return null;
}
