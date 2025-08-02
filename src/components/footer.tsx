export function Footer() {
  return (
    <footer className="bg-background border-t-2 border-black/50 p-4">
      <div className="container mx-auto">
        &copy; {new Date().getFullYear()} AgroComm
      </div>
    </footer>
  );
}