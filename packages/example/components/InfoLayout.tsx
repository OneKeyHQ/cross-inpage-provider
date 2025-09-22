import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader } from './ui/card';

export type InfoLayoutProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function InfoLayout({ title, children, className }: InfoLayoutProps) {
  return (
    <Card>
      {title && <CardHeader className="font-medium">{title}</CardHeader>}
      <CardContent className={cn("flex flex-col flex-wrap gap-3 break-all", className)}>{children}</CardContent>
    </Card>
  );
}
