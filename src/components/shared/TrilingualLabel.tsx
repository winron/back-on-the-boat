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
		<span className={`inline-flex flex-col items-center ${className}`}>
			{showPinyin && <span className={s.pinyin}>{pinyin}</span>}
			<span className={s.chinese}>{chinese}</span>
			{showEnglish && <span className={s.english}>{english}</span>}
		</span>
	);
}
