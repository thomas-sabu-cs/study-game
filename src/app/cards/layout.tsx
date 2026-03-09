import { AppNav } from "@/components/AppNav";

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}

