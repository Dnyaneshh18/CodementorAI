import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Code, 
  Bug, 
  Flame, 
  Trophy, 
  Star, 
  Zap, 
  Lock,
  TrendingUp,
  Activity
} from "lucide-react";

interface ProgressData {
  progress: {
    problemsSolved: number;
    bugsFixed: number;
    languagesUsed: Record<string, number>;
    achievements: string[];
  };
  submissions: any[];
  user: {
    level: number;
    xp: number;
    streak: number;
  };
}

export function ProgressDashboard() {
  const { data: progressData, isLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const progress = progressData?.progress;
  const user = progressData?.user;
  const submissions = progressData?.submissions || [];

  // Calculate daily progress (3/5 problems)
  const dailyProgress = Math.min((progress?.problemsSolved || 0) % 5, 5);
  const dailyXP = 45; // Simulated

  return (
    <div className="space-y-8 p-4 max-w-6xl mx-auto h-[calc(100vh-8rem)] overflow-y-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Developer Journey
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Track your progress, achievements, and coding stats</p>
        </div>
        <div className="bg-card/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/50 shadow-inner flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level {user?.level || 1}</span>
            <span className="text-xl font-bold text-primary">{user?.xp || 0} <span className="text-sm font-normal text-muted-foreground">XP</span></span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <Flame className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="floating-card animate-scale-in bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden group" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Problems</p>
                <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400" data-testid="stat-total-problems">
                  {progress?.problemsSolved || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Code className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="floating-card animate-scale-in bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden group" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bugs Fixed</p>
                <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400" data-testid="stat-bugs-fixed">
                  {progress?.bugsFixed || 0}
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Bug className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="floating-card animate-scale-in bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden group" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Streak</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400" data-testid="stat-streak">
                    {user?.streak || 0}
                  </p>
                  <span className="text-sm font-bold text-amber-500/70">days</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Flame className="w-7 h-7 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Progress & Languages */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Section */}
          <Card className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden animate-slide-in-up">
            <CardHeader className="border-b border-border/30 bg-background/30">
              <CardTitle className="flex items-center space-x-2 text-base font-bold">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Today's Target</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-muted-foreground">Daily Challenges</span>
                  <span className="text-xl font-bold text-primary" data-testid="text-daily-progress">
                    {dailyProgress}<span className="text-sm text-muted-foreground">/5</span>
                  </span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000 ease-out"
                    style={{ width: `${(dailyProgress / 5) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div className="bg-background/40 p-3 rounded-xl border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">XP Gained</p>
                  <p className="text-lg font-bold text-emerald-400">+{dailyXP} XP</p>
                </div>
                <div className="bg-background/40 p-3 rounded-xl border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Next Level</p>
                  <p className="text-lg font-bold text-blue-400">{((user?.xp || 0) % 1000) / 10}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Distribution */}
          {progress?.languagesUsed && Object.keys(progress.languagesUsed).length > 0 && (
            <Card className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="border-b border-border/30 bg-background/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-400" />
                  Language Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Object.entries(progress.languagesUsed).sort((a, b) => b[1] - a[1]).map(([lang, count], i) => {
                    const maxCount = Math.max(...Object.values(progress.languagesUsed || {}));
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={lang} className="group">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold capitalize flex items-center gap-2">
                            {lang}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full" data-testid={`lang-${lang}-count`}>
                            {count} {count === 1 ? 'run' : 'runs'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Achievements & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Achievements */}
          <Card className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="border-b border-border/30 bg-background/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Badges & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Bug Hunter */}
                <div className={`relative overflow-hidden group bg-background/40 rounded-2xl p-5 border border-border/50 text-center transition-all duration-300 hover:shadow-lg ${(progress?.bugsFixed || 0) >= 50 ? 'hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
                  {(progress?.bugsFixed || 0) >= 50 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
                    (progress?.bugsFixed || 0) >= 50 ? 'bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30' : 'bg-muted border border-border'
                  }`}>
                    <Bug className={`w-8 h-8 ${(progress?.bugsFixed || 0) >= 50 ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-bold mb-1">Bug Hunter</p>
                  <p className="text-xs text-muted-foreground mb-3">Fix 50+ bugs</p>
                  <Badge className={`w-full justify-center ${(progress?.bugsFixed || 0) >= 50 ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-muted text-muted-foreground'}`}>
                    {(progress?.bugsFixed || 0) >= 50 ? 'Unlocked' : `${progress?.bugsFixed || 0}/50`}
                  </Badge>
                </div>

                {/* Code Master */}
                <div className={`relative overflow-hidden group bg-background/40 rounded-2xl p-5 border border-border/50 text-center transition-all duration-300 hover:shadow-lg ${(progress?.problemsSolved || 0) >= 100 ? 'hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
                  {(progress?.problemsSolved || 0) >= 100 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
                    (progress?.problemsSolved || 0) >= 100 ? 'bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 border border-blue-500/30' : 'bg-muted border border-border'
                  }`}>
                    <Trophy className={`w-8 h-8 ${(progress?.problemsSolved || 0) >= 100 ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-bold mb-1">Code Master</p>
                  <p className="text-xs text-muted-foreground mb-3">Solve 100+ problems</p>
                  <Badge className={`w-full justify-center ${(progress?.problemsSolved || 0) >= 100 ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' : 'bg-muted text-muted-foreground'}`}>
                    {(progress?.problemsSolved || 0) >= 100 ? 'Unlocked' : `${progress?.problemsSolved || 0}/100`}
                  </Badge>
                </div>

                {/* Speed Demon */}
                <div className={`relative overflow-hidden group bg-background/40 rounded-2xl p-5 border border-border/50 text-center transition-all duration-300 hover:shadow-lg ${(progress?.problemsSolved || 0) >= 25 ? 'hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
                  {(progress?.problemsSolved || 0) >= 25 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ${
                    (progress?.problemsSolved || 0) >= 25 ? 'bg-gradient-to-tr from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-muted border border-border'
                  }`}>
                    <Zap className={`w-8 h-8 ${(progress?.problemsSolved || 0) >= 25 ? 'text-green-400' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-bold mb-1">Speed Demon</p>
                  <p className="text-xs text-muted-foreground mb-3">Solve 25+ problems</p>
                  <Badge className={`w-full justify-center ${(progress?.problemsSolved || 0) >= 25 ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-muted text-muted-foreground'}`}>
                    {(progress?.problemsSolved || 0) >= 25 ? 'Unlocked' : `${progress?.problemsSolved || 0}/25`}
                  </Badge>
                </div>

                {/* Algorithm Expert */}
                <div className="relative overflow-hidden group bg-background/40 rounded-2xl p-5 border border-border/50 text-center opacity-50 grayscale">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3 border border-border shadow-inner">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold mb-1">Algo Expert</p>
                  <p className="text-xs text-muted-foreground mb-3">Master 10 algorithms</p>
                  <Badge className="w-full justify-center bg-muted text-muted-foreground">
                    Locked
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {submissions.length > 0 && (
            <Card className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="border-b border-border/30 bg-background/30">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Recent Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {submissions.slice(0, 5).map((submission, index) => (
                    <div key={submission.id || index} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                          <Code className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold capitalize">{submission.language} Execution</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {submission.success ? (
                              <span className="text-emerald-500 font-medium">Successful run</span>
                            ) : (
                              <span className="text-rose-500 font-medium">Failed run</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-background/50 text-xs">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(submission.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
