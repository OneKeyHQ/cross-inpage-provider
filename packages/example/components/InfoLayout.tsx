import { Card, CardContent, CardHeader } from './ui/card';

export type InfoLayoutProps = {
  title?: string;
  children?: React.ReactNode;
};

export default function InfoLayout({ title, children }: InfoLayoutProps) {
  return (
    <Card>
      {title && <CardHeader className="font-medium">{title}</CardHeader>}
      <CardContent className="flex flex-col flex-wrap gap-3">{children}</CardContent>
    </Card>
  );
}
