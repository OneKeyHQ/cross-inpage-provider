import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

export type TabCardProps = {
    tabs: {
        label: string;
        value: string;
        title: string;
        description?: string;
        content: React.ReactNode;
    }[];
    defaultValue?: string;
}

export default function TabCard({ tabs, defaultValue }: TabCardProps) {
    return (
        <Tabs defaultValue={defaultValue || tabs[0]?.value}>
            <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{tab.title}</CardTitle>
                            {tab.description && (
                                <CardDescription>{tab.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {tab.content}
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    );
}
