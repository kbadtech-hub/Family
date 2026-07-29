import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootResetPasswordPage() {
  redirect(`/${routing.defaultLocale}/reset-password`);
}
