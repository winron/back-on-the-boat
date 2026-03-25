'use client';

import { useDisplaySettings } from '@/hooks/useDisplaySettings';
import { useUnlockedLevel } from '@/hooks/useUnlockedLevel';
import TrilingualLabel from '@/components/shared/TrilingualLabel';

export default function HomePage() {
	const { showPinyin, showEnglish, togglePinyin, toggleEnglish } = useDisplaySettings();
	const { currentProgressLevel, masteredCount, totalCount, loading } = useUnlockedLevel();

	const percent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

	return (
		<div className='tab-color-1 flex flex-col items-center justify-center h-[calc(100vh-8rem)] overflow-hidden space-y-8'>
			{/* App Title */}
			<TrilingualLabel
				chinese='回到船上'
				pinyin='huí dào chuán shàng'
				english='BACK ON THE BOAT'
				size='lg'
			/>

			{/* Current Level */}
			<div className='text-center space-y-1'>
				<TrilingualLabel
					chinese='当前等级'
					pinyin='dāngqián děngjí'
					english='Current Level'
					size='sm'
				/>
				<p
					className='text-5xl font-bold'
					style={{ color: 'var(--color-tab-1)' }}>
					HSK {currentProgressLevel}
				</p>
			</div>

			{/* XP Progress Bar */}
			<div className='w-full max-w-xs'>
				<div className='flex justify-between text-xs font-medium text-foreground mb-1'>
					<span>{loading ? '...' : `${masteredCount} / ${totalCount}`}</span>
					<span>{loading ? '...' : `${percent}%`}</span>
				</div>
				<div className='relative h-[2.8rem] bg-muted rounded-lg overflow-hidden border border-white'>
					<div
						className='absolute inset-y-0 left-0 rounded-lg transition-all duration-500'
						style={{
							width: `${percent}%`,
							background: `linear-gradient(90deg, var(--color-tab-1), var(--color-tab-2))`,
						}}
					/>
				</div>
			</div>

			{/* Display Toggles */}
			<div className='flex gap-3 w-full max-w-xs'>
				<button
					onClick={togglePinyin}
					className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${showPinyin ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border'}`}>
					<span className='block text-xs'>pīnyīn</span>
					拼音
					<span className='block text-xs'>Pinyin</span>
				</button>
				<button
					onClick={toggleEnglish}
					className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${showEnglish ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border'}`}>
					<span className='block text-xs'>yīngwén</span>
					英文
					<span className='block text-xs'>English</span>
				</button>
			</div>
		</div>
	);
}
