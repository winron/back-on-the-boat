'use client';

import { useDisplaySettings } from '@/hooks/useDisplaySettings';
import { useUnlockedLevel } from '@/hooks/useUnlockedLevel';
import { useTodayTimers } from '@/hooks/usePageTimer';
import TrilingualLabel from '@/components/shared/TrilingualLabel';
import ProgressCard from '@/components/shared/ProgressCard';

export default function HomePage() {
	const { showPinyin, showEnglish, togglePinyin, toggleEnglish } = useDisplaySettings();
	const {
		charProgressLevel,
		sentProgressLevel,
		masteredCount, totalCount,
		sentMasteredCount, sentTotalCount,
		loading,
	} = useUnlockedLevel();

	const { charactersSeconds, sentencesSeconds } = useTodayTimers();

	return (
		<div className='tab-color-1 flex flex-col items-center justify-center h-[calc(100vh-8rem)] overflow-hidden space-y-8'>
			{/* App Title */}
			<TrilingualLabel
				chinese='回到船上'
				pinyin='huí dào chuán shàng'
				english='BACK ON THE BOAT'
				size='lg'
			/>

			{/* Progress Cards */}
			<div className='w-full max-w-xs space-y-5'>
				<ProgressCard
					label='Characters'
					hskLevel={charProgressLevel}
					mastered={masteredCount}
					total={totalCount}
					timerSeconds={charactersSeconds}
					gradient='linear-gradient(90deg, var(--color-tab-1), var(--color-tab-2))'
					loading={loading}
				/>
				<ProgressCard
					label='Sentences'
					hskLevel={sentProgressLevel}
					mastered={sentMasteredCount}
					total={sentTotalCount}
					timerSeconds={sentencesSeconds}
					gradient='linear-gradient(90deg, var(--color-tab-1), var(--color-tab-4))'
					loading={loading}
				/>
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
