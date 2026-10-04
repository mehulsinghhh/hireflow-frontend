import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">HireFlow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 font-medium">
            Frontend foundation is ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
