import { useEffect, useRef, useState, type FC } from "react";

interface ProgressProps {
	start: number;
	end: number;
}

export const Progress: FC<ProgressProps> = ({ start, end }) => {
	const [elapsed, setElapsed] = useState(getElapsed());
	/** x% */
	const [width, setWidth] = useState(calcWidth());
	function getTotal() {
		const total = end - start;
		const totalArr = [
			Math.floor((total / (1000 * 60)) % 60),
			Math.floor((total / 1000) % 60),
		];
		const mapFunc = (t: number) => `0${t}`.slice(-2);
		return totalArr.map(mapFunc).join(":");
	}
	function getElapsed() {
		const elapsed = Date.now() - start;
		const elpasedArr = [
			Math.floor((elapsed / (1000 * 60)) % 60),
			Math.floor((elapsed / 1000) % 60),
		];
		const mapFunc = (t: number) => `0${t}`.slice(-2);
		return elpasedArr.map(mapFunc).join(":");
	}
	function calcWidth() {
		const total = end - start;
		const progress = 100 - (100 * (end - Date.now())) / total;
		if (progress > 100) {
			return "100%";
		} else {
			return `${progress.toFixed(2)}%`;
		}
	}
	const style = {
		width,
	};
	//thanks https://zenn.dev/kakaka/articles/41f22d2dcc9720
	const useIntervalBy1s = (callback: () => void) => {
		const callbackRef = useRef<() => void>(callback);
		useEffect(() => {
			callbackRef.current = callback; // 新しいcallbackをrefに格納！
		}, [callback]);

		useEffect(() => {
			const tick = () => {
				callbackRef.current();
			};
			const id = setInterval(tick, 1000);
			return () => {
				clearInterval(id);
			};
		}, []); //refはミュータブルなので依存配列に含めなくてもよい
	};
	useIntervalBy1s(() => {
		console.log("progress calculating");
		setElapsed(getElapsed());
		setWidth(calcWidth());
	});
	return (
		<div>
			<div className="rounded-lg bg-gray-200/20 h-2">
				<div
					className=" rounded-lg bg-white/75 h-2 transition-all"
					style={style}
				></div>
				<div>
					{elapsed}:{getTotal()}
				</div>
			</div>
		</div>
	);
};
