export default function TouristLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex min-h-dvh flex-col">{children}</main>;
}
