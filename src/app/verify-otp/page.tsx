import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootVerifyOtpPage() {
  redirect(`/${routing.defaultLocale}/verify-otp`);
}
