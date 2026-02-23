import { Card, CardContent } from '../components/ui/card';
import { Construction } from 'lucide-react';

export const Expenses = () => {
  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Cheltuieli</h1>
        <p className="text-muted-foreground mt-1">Gestionează cheltuielile companiei</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold mb-2">În proces de lucru</h2>
            <p className="text-muted-foreground max-w-md">
              Această secțiune este în curs de dezvoltare. Revino în curând pentru a gestiona cheltuielile companiei.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
