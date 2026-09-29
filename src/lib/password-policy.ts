// Shared by the admin:create script and the Settings page.
export const PASSWORD_RULE = "At least 10 characters, including a letter and a number.";

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "The password must be at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "The password must include a letter and a number.";
  return null;
}
