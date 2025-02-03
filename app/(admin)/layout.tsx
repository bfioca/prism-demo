export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
}
