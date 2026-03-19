interface Props {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

function getColor(confidence: number) {
  if (confidence >= 75) return { bar: 'bg-emerald-400', text: 'text-emerald-400', ring: 'stroke-emerald-400' };
  if (confidence >= 65) return { bar: 'bg-amber-400', text: 'text-amber-400', ring: 'stroke-amber-400' };
  return { bar: 'bg-red-400', text: 'text-red-400', ring: 'stroke-red-400' };
}

export function ConfidenceMeter({ confidence, size = 'md' }: Props) {
  const colors = getColor(confidence);
  const radius = size === 'lg' ? 40 : size === 'md' ? 28 : 18;
  const strokeWidth = size === 'lg' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={svgSize}
        height={svgSize}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          className={colors.ring}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute flex flex-col items-center ${fontSize} font-bold ${colors.text}`}>
        {confidence}%
      </div>
    </div>
  );
}
