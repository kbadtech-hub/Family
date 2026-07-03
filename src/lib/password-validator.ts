export const validatePassword = (password: string): { isValid: boolean; errorKey: string } => {
  // Frontend password validation is disabled per user request to allow any password.
  return { isValid: true, errorKey: '' };
};
