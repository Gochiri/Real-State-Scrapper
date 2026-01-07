import clsx from 'clsx'

interface ScoreBarProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function getScoreCategory(score: number): {
  label: string
  color: string
  bgColor: string
  textColor: string
} {
  if (score >= 80) {
    return {
      label: 'Alta Oportunidad',
      color: 'bg-red-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    }
  } else if (score >= 60) {
    return {
      label: 'Buena Oportunidad',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    }
  } else if (score >= 40) {
    return {
      label: 'Oportunidad Media',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    }
  } else if (score >= 20) {
    return {
      label: 'Oportunidad Baja',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    }
  } else {
    return {
      label: 'Ya tienen todo',
      color: 'bg-gray-400',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    }
  }
}

export default function ScoreBar({ score, showLabel = true, size = 'md' }: ScoreBarProps) {
  const category = getScoreCategory(score)

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="space-y-1">
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', category.color)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className={clsx('font-medium', category.textColor)}>{category.label}</span>
          <span className="text-gray-500">{score} pts</span>
        </div>
      )}
    </div>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const category = getScoreCategory(score)

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        category.bgColor,
        category.textColor
      )}
    >
      {score} pts
    </span>
  )
}
