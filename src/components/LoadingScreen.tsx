import LunarPhase from "./LunarPhase";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="text-center">
        <LunarPhase size="lg" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}