import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { CodeWorkspace } from "@/components/code-workspace";

export type ViewType = 'editor' | 'debug-history' | 'progress' | 'settings' | 'battle';

export default function HomePage() {
  const [activeView, setActiveView] = useState<ViewType>('editor');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground">
      {!isSidebarHidden && <Sidebar activeView={activeView} onNavigate={setActiveView} />}
      <CodeWorkspace
        activeView={activeView}
        onNavigate={setActiveView}
        onSidebarVisibilityChange={setIsSidebarHidden}
      />
    </div>
  );
}
