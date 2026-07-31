export default function AdminUserLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
}
