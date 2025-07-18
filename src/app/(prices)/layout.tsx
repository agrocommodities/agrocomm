import ContentSidebar from "@/components/content-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-20 pb-12">
      {/* <div className="mx-auto px-4 sm:px-6 lg:px-8"> */}
        <div className="flex gap-8">
          <div className="flex-1">
            {children}
          </div>
          <div className="hidden lg:block">
            <ContentSidebar />
          </div>
        </div>
      {/* </div> */}
    </div>
  );
}