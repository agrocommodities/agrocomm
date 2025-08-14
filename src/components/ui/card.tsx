interface CardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, id, className = "" }: CardProps) {
  return (
    <div id={id} className={`bg-background/80 border-2 border-black/40 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`p-4 pb-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`p-4 pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3 className={`font-semibold ${className}`}>
      {children}
    </h3>
  );
}