import { useEffect, useRef, useState } from "react";
import { Progress } from "./Progress.tsx";
type ActivityT =
	| {
			type: 0;
			timestamps: {
				start: number;
				end?: number;
			};
			/** ex: Workspace: lanyard */
			state: string;
			/** ex: Visual Studio Code */
			name: string;
			id: string;
			/** ex: Editing README.md */
			details: string;
			created_at: number;
			assets?: {
				/** ex: Visual Studio Code */
				small_text: string;
				/** returns id */
				small_image: string;
				/** ex: Editing a MARKDOWN file */
				large_text: string;
				/** returns id */
				large_image: string;
			};
			application_id: string;
	  }
	| {
			type: 2;
			timestamps: {
				start: number;
				end: number;
			};
			sync_id: string;
			state: string;
			session_id: string;
			party: {
				/** starts with spotify: */
				id: string;
			};
			name: "Spotify";
			id: "spotify:1";
			flags: number;
			details: string;
			created_at: string;
			assets?: {
				large_text: string;
				large_image: string;
			};
	  };

interface LanyardMessageT {
	discord_user: {
		username: string;
		public_flags: number;
		id: string;
		discriminator: string;
		/** **[!] avatar returns hash** */
		avatar: string;
	};
	discord_status: "online" | "idle" | "dnd" | "offline";
	activities: ActivityT[];
	listening_to_spotify: boolean;
}

export function Discord() {
	const socketRef = useRef<WebSocket>(null);
	const [connected, setConnected] = useState(false);
	useEffect(() => {
		// return;
		const lanyardWS = () => {
			if (connected) {
				console.log("already connected. skipping");
				return;
			}
			const ws = new WebSocket("wss://api.lanyard.rest/socket");
			socketRef.current = ws;
			const onMessage = (ev: MessageEvent<string>) => {
				const { t, d } = JSON.parse(ev.data);
				if (t !== "INIT_STATE" && t !== "PRESENCE_UPDATE") return;
				console.log(t, d);
				updateRPC(d);
			};
			ws.onopen = () => {
				setConnected(true);

				ws.send(
					JSON.stringify({
						op: 2,
						d: { subscribe_to_id: "760731506448138251" },
					})
				);
				ws.onerror = (ev) => {
					console.log("ws error", ev);
					ws.close();
				};
				ws.onclose = () => {
					setConnected(false);
					setTimeout(lanyardWS, 1000);
				};
			};
			ws.addEventListener("message", onMessage);
		};
		lanyardWS();
	});
	function getImage(
		str: string | undefined,
		appid?: string,
		size: number = 160
	) {
		if (!str) return "/fallback.jpg";
		if (str.startsWith("mp:"))
			return `https://media.discordapp.net/${str.slice(
				3
			)}?width=${size}&height=${size}`;
		if (str.startsWith("spotify:"))
			return `https://i.scdn.co/image/${str.slice(8)}`;
		else
			return `https://discordapp.com/app-assets/${appid}/${str}.png?size=${size}`;
	}
	function updateRPC({
		discord_user,
		discord_status,
		activities,
		listening_to_spotify,
	}: LanyardMessageT) {
		updateAvatar(
			`https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.webp?size=80`
		);
		updateUsername(discord_user.username);
		updateDotstyle({
			backgroundColor: STATUS_COLORS[discord_status],
		});
		const a = activities.find((x) => x.name !== "Custom Status");
		setIsSpotify(listening_to_spotify);

		if (a) {
			setHasactivity(true);
			if (a.type === 2) {
				const l_url = getImage(a.assets?.large_image);
				if (a_large !== l_url) {
					a_updateLarge(l_url);
				}
				a_updateSmall(null);
				a_setName(a.name);
				a_setDetails(a.details);
				a_setState(a.state);
				rpc_Setstart(a.timestamps.start);
				rpc_Setend(a.timestamps.end);
			} else {
				const l_url = getImage(a.assets?.large_image, a.application_id, 160);
				const s_url = getImage(a.assets?.small_image, a.application_id, 60);
				if (a_large !== l_url) a_updateLarge(l_url);
				if (a_small !== s_url) a_updateSmall(s_url);
				a_setName(a.name);
				a_setDetails(a.details);
				a_setState(a.state);
				rpc_Setstart(a.timestamps.start);
				rpc_Setend(a.timestamps.end ?? null);
			}
		} else setHasactivity(false);
		// function setRPC(timestamp);
	}
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
		console.log("calling");
		calcRpc_Timestamp(rpc_Start, rpc_End);
	});
	function calcRpc_Timestamp(start: number | null, end: number | null) {
		if (isSpotify) {
			a_setTime(null);
			return;
		}
		if (!start) a_setTime(null);
		const mapFunc = (t: number) => `0${t}`.slice(-2);
		if (start && !end) {
			const Elapsed = Math.abs(Date.now() - start) / 1000;
			const elapsedArr = [
				Math.floor(Elapsed / 3600) % 24,
				Math.floor(Elapsed / 60) % 60,
				Math.floor(Elapsed % 60),
			];
			if (String(elapsedArr[0]) === "0") elapsedArr.shift();
			a_setTime(`${elapsedArr.map(mapFunc).join(":")} elapsed`);
		} else if (end) {
			const timeLeft = Math.abs(end - Date.now()) / 1000;
			const leftArr = [
				Math.floor(timeLeft / 3600) % 24,
				Math.floor(timeLeft / 60) % 60,
				Math.floor(timeLeft % 60),
			];
			if (String(leftArr[0]) === "0") leftArr.shift();

			a_setTime(`${leftArr.map(mapFunc).join(":")} left`);
		}
	}
	const STATUS_COLORS = {
		online: "#4b8",
		idle: "#fa1",
		dnd: "#f44",
		offline: "#778",
	};
	const [dotStyle, updateDotstyle] = useState({
		backgroundColor: STATUS_COLORS.offline,
	});
	const [isSpotify, setIsSpotify] = useState(false);
	const [avatar, updateAvatar] = useState<string | null>(null);
	const [username, updateUsername] = useState<string | null>(null);
	const [hasActivity, setHasactivity] = useState(false);
	const [a_large, a_updateLarge] = useState<string | null>(null);
	const [a_small, a_updateSmall] = useState<string | null>(null);
	const [a_name, a_setName] = useState<string | null>(null);
	const [a_details, a_setDetails] = useState<string | null>(null);
	const [a_state, a_setState] = useState<string | null>(null);
	const [rpc_Start, rpc_Setstart] = useState<number | null>(null);
	const [rpc_End, rpc_Setend] = useState<number | null>(null);
	const [a_time, a_setTime] = useState<string | null>(null);
	return (
		<>
			{avatar ? (
				<div className="flex flex-col gap-4 border border-gray-700 p-4 rounded-lg font-sans mx-4">
					<div className="flex items-center space-x-4">
						<div className="shrink-0 relative">
							{avatar && (
								<>
									<img
										src={avatar}
										width={64}
										height={64}
										draggable="false"
										alt="avatar"
										className="rounded-full h-11 w-11"
									></img>
									<div
										className="rounded-full absolute w-3 h-3 right-[1px] bottom-[1px]"
										style={dotStyle}
									></div>
								</>
							)}
						</div>
						{username && <p>{username}</p>}
					</div>
					{hasActivity ? (
						<div className="border rounded-lg border-gray-400 backdrop-blur-3xl p-6 flex flex-col box-border">
							<div className="flex space-x-4 items-center">
								<div className="shrink-0 relative">
									<img
										src={a_large ?? "/fallback.jpg"}
										width="128"
										height="128"
										draggable="false"
										alt="Large image"
										className="rounded-xl h-28 w-28"
									/>

									{a_small && (
										<img
											src={a_small}
											width="16"
											height="16"
											draggable="false"
											alt="Small image"
											className="rounded-full bg-gray-100 bg-opacity-20 h-7 right-0 bottom-0 ring-2 ring-gray-600/80 ring-opacity-20 w-7 absolute"
										/>
									)}
								</div>
								<div className="space-y-1 w-full">
									{a_name && (
										<h1 className="font-semibold text-lg leading-tight truncate">
											{a_name}
										</h1>
									)}
									{a_details && (
										<h2 className="leading-tight line-clamp-2 text-xl truncate w-auto">
											{a_details}
										</h2>
									)}
									{a_state && (
										<h2 className="leading-tight line-clamp-2 text-lg truncate w-auto">
											{isSpotify ? "by " : ""}
											{a_state}
										</h2>
									)}
									{a_time && (
										<span className="leading-tight opacity-90 truncate">
											{a_time}
										</span>
									)}
									{isSpotify && rpc_Start && rpc_End && (
										<Progress start={rpc_Start} end={rpc_End} />
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="border rounded-lg border-gray-600 backdrop-blur-3xl p-6 flex flex-col box-border">
							<div className="flex space-x-4 items-center justify-center">
								<p className="text-gray-500 italic font-mono">No activity</p>
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-4 border border-gray-700 p-4 rounded-lg animate-pulse">
					<div className="flex items-center space-x-4">
						<div className="shrink-0 relative">
							<div className="rounded-full h-11 w-11 bg-gray-800"></div>
							<div className="rounded-full absolute w-3 h-3 right-[1px] bottom-[1px] bg-gray-700"></div>
						</div>
						<p className="text-gray-300">...</p>
					</div>

					<div className="border rounded-lg border-gray-400 backdrop-blur-3xl p-6 flex flex-col box-border">
						<div className="flex space-x-4 items-center">
							<div className="shrink-0 relative">
								<div className="rounded-xl h-28 w-28 bg-gray-800"></div>

								<div className="rounded-full bg-gray-700 bg-opacity-20 h-6 right-0 bottom-0 ring-4 ring-gray-600 ring-opacity-20 w-6 absolute"></div>
							</div>
							<div className="space-y-1 w-full">
								<h1 className="font-semibold text-lg leading-tight truncate text-gray-300">
									...
								</h1>
								<h2 className="leading-tight line-clamp-2 text-gray-300">
									...
								</h2>
								<h2 className="leading-tight line-clamp-2 text-gray-300">
									...
								</h2>
								<div>
									<div className="rounded-lg bg-gray-200/20 h-2">
										<div className=" rounded-lg bg-gray-400/75 h-2 transition-all w-full"></div>
										<div className="text-gray-600">00:00</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
