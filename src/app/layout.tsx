import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Since we have a `[locale]` dynamic segment, we need a root layout 
// to satisfy Next.js requirements, even if it just passes children through.
export default function RootLayout({ children }: Props) {
  return children;
}
