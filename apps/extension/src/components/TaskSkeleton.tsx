/**
 * 任务列表骨架屏
 * 在任务加载时显示占位内容
 */

interface TaskSkeletonProps {
  count?: number
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-[var(--bg-card)] rounded-xl animate-pulse">
      {/* 复选框占位 */}
      <div className="w-5 h-5 rounded border-2 border-[var(--border)] shrink-0" />

      {/* 内容占位 */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[var(--border)] rounded w-3/4" />
        <div className="h-3 bg-[var(--border)] rounded w-1/2 opacity-60" />
      </div>

      {/* 优先级占位 */}
      <div className="w-4 h-4 bg-[var(--border)] rounded opacity-40" />
    </div>
  )
}

export function TaskSkeleton({ count = 5 }: TaskSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </div>
  )
}

/**
 * 专注模式骨架屏
 */
export function FocusSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 py-3 px-4 bg-[var(--bg-card)] rounded-xl"
        >
          <div className="w-6 h-6 rounded border-2 border-[var(--border)]" />
          <div className="flex-1 h-5 bg-[var(--border)] rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * 侧边栏骨架屏
 */
export function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      {/* 智能清单 */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2 px-3">
          <div className="w-5 h-5 bg-[var(--border)] rounded" />
          <div className="flex-1 h-4 bg-[var(--border)] rounded" />
          <div className="w-6 h-4 bg-[var(--border)] rounded opacity-60" />
        </div>
      ))}

      {/* 分隔 */}
      <div className="h-px bg-[var(--border)] my-4" />

      {/* 项目列表 */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2 px-3">
          <div className="w-3 h-3 bg-[var(--border)] rounded-full" />
          <div className="flex-1 h-4 bg-[var(--border)] rounded" />
        </div>
      ))}
    </div>
  )
}
