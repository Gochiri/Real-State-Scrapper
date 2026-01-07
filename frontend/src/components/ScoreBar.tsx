import clsx from 'clsx'

interface ScoreBarProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function getScoreCategory(score: number): {
  label: string
  gradient: string
  bgLight: string
  textColor: string
  emoji: string
} {
  if (score >= 80) {
    return {
      label: 'Alta Oportunidad',
      gradient: 'from-rose-500 to-orange-500',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-700',
      emoji: '🔥',
    }
  } else if (score >= 60) {
    return {
      label: 'Buena Oportunidad',
      gradient: 'from-orange-400 to-amber-400',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-700',
      emoji: '⚡',
    }
  } else if (score >= 40) {
    return {
      label: 'Oportunidad Media',
      gradient: 'from-yellow-400 to-lime-400',
      bgLight: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      emoji: '📊',
    }
  } else if (score >= 20) {
    return {
      label: 'Oportunidad Baja',
      gradient: 'from-cyan-400 to-blue-400',
      bgLight: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      emoji: '❄️',
    }
  } else {
    return {
      label: 'Ya tienen todo',
      gradient: 'from-slate-400 to-slate-500',
      bgLight: 'bg-slate-50',
      textColor: 'text-slate-600',
      emoji: '✅',
    }
  }
}

export default function ScoreBar({ score, showLabel = true, size = 'md' }: ScoreBarProps) {
  const category = getScoreCategory(score)

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className="space-y-2">
      <div className={clsx(
        'w-full bg-slate-100 rounded-full overflow-hidden',
        heights[size]
      )}>
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            category.gradient
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className={clsx('font-semibold flex items-center gap-1', category.textColor)}>
            <span>{category.emoji}</span>
            {category.label}
          </span>
          <span className="text-slate-500 font-medium">{score} pts</span>
        </div>
      )}
    </div>
  )
}

export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const category = getScoreCategory(score)

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        'bg-gradient-to-r text-white shadow-sm',
        category.gradient,
        sizes[size]
      )}
    >
      <span>{category.emoji}</span>
      {score}
    </span>
  )
}

export function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const category = getScoreCategory(score)
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r="36"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r="36"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={score >= 60 ? '#f97316' : score >= 40 ? '#facc15' : '#64748b'} />
            <stop offset="100%" stopColor={score >= 60 ? '#ef4444' : score >= 40 ? '#84cc16' : '#94a3b8'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-xs text-slate-500">pts</span>
      </div>
    </div>
  )
}
