export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t-2 border-black/50 p-4">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm">
          &copy; {new Date().getFullYear()} AgroComm
        </div>
      </div>
    </footer>
  );
}