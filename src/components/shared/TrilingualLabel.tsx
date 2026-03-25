'use client';

import { useDisplaySettings } from '@/hooks/useDisplaySettings';

interface TrilingualLabelProps {
	chinese: string;
	pinyin: string;
	english: string;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	className?: string;
}

const sizeMap = {
	xs: { pinyin: 'text-[12px] leading-tight', chinese: 'text-[21px]', english: 'text-[12px] leading-tight' },
	sm: { pinyin: 'text-[13.5px] leading-tight', chinese: 'text-[24px]', english: 'text-[13.5px] leading-tight' },
	md: { pinyin: 'text-sm', chinese: 'text-[27px] font-medium', english: 'text-sm' },
	lg: { pinyin: 'text-base', chinese: 'text-[45px] font-bold', english: 'text-base' },
};

export default function TrilingualLabel({ chinese, pinyin, english, size = 'md', className = '' }: TrilingualLabelProps) {
	const { showPinyin, showEnglish } = useDisplaySettings();
	const s = sizeMap[size];

	return (
		<span className={`inline-flex items-center gap-1 ${className}`}>
			<span className={s.chinese}>{chinese}</span>
			{(showPinyin || showEnglish) && (
				<span className="flex flex-col">
					{showPinyin && <span className={s.pinyin}>{pinyin}</span>}
					{showEnglish && <span className={s.english}>{english}</span>}
				</span>
			)}
		</span>
	);
}
