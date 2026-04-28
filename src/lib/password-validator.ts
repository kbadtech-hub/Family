export const validatePassword = (password: string): { isValid: boolean; errorKey: string } => {
  if (password.length < 8) {
    return { isValid: false, errorKey: 'passwordTooShort' };
  }

  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@#$!%*?&]/.test(password);
  
  if (!hasNumber || !hasSpecial) {
    return { isValid: false, errorKey: 'passwordTooWeak' };
  }

  const commonPasswords = ['123456', '12345678', 'password', 'qwerty', 'beteseb', 'ethiopia'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, errorKey: 'passwordCommon' };
  }

  return { isValid: true, errorKey: '' };
};
