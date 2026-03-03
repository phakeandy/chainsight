import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

import { Separator } from '../components/ui/separator'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>ChainSight</span>
            <span className="text-muted-foreground">第三阶段</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/submit"
              className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              提交证据
            </Link>
            <Link
              to="/graph"
              className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              图谱视图
            </Link>
          </nav>
        </div>
      </header>
      <Separator />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
