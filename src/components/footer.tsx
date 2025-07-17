export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-foreground/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-1 py-3 sm:py-4 text-xs sm:text-sm text-foreground/60">
          ©{" "} {new Date().getFullYear()} AgroComm
        </div>
      </div>
    </footer>
  );
}
