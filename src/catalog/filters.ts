export type ActivityTier = {
  label: string
  min: number
  max: number
}

/**
 * 活跃度分级阈值（单位：安装数）
 * 在此处统一添加或调整区间，UI 组件自动适配，无需其他改动
 */
export const ACTIVITY_TIERS: ActivityTier[] = [
  { label: '>500K',     min: 500_001,  max: Infinity },
  { label: '500K-200K', min: 200_001,  max: 500_000  },
  { label: '200K-100K', min: 100_001,  max: 200_000  },
  { label: '100K-50K',  min: 50_001,   max: 100_000  },
  { label: '50K-10K',   min: 10_001,   max: 50_000   },
  { label: '10K-5K',    min: 5_001,    max: 10_000   },
  { label: '5K-1K',     min: 1_001,    max: 5_000    },
  { label: '<1K',       min: 0,        max: 1_000    },
]

export function formatInstalls(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${Math.floor(count / 1_000)}K`
  return String(count)
}
