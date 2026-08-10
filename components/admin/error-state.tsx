import { Button } from "@/components/ui/button";

interface AdminErrorStateProps {
  onRetry: () => void;
}

export function AdminErrorState({ onRetry }: AdminErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
      <p>加载失败，请稍后重试</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        重试
      </Button>
    </div>
  );
}
