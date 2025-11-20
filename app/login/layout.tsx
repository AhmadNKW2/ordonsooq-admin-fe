/**
 * Login Layout - No sidebar for authentication pages
 */

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
