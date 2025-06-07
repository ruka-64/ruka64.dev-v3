import { Icon } from "@iconify/react";
import { useState } from "react";

const classNameBase = [
	"border",
	"border-gray-500",
	"transition-colors",
	"text-gray-400",
	"rounded-xl",
	"py-2",
	"pl-4",
	"pr-6",
	"flex",
	"items-center",
];
const className_normal = [...classNameBase, "hover:border-gray-400"];
const className_interactive = [...classNameBase, "hover:border-purple-500"];

interface CardProps {
	icon: string;
	name: string;
	href?: string;
	clip?: string;
}

export function Cards({ icon, name, href, clip }: CardProps) {
	function Copy(text: string) {
		console.log("Called");
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log("[dev] copied");
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 1000);
			})
			.catch((e) => {
				console.error(e);
				alert(`Error: ${e}`);
			});
	}
	const [copied, setCopied] = useState(false);
	return (
		<>
			{clip ? (
				//clip
				<a
					className={className_interactive.join(" ")}
					onClick={() => {
						console.log("calling");
						Copy(clip);
					}}
				>
					<Icon icon={icon} className="mr-2" />
					<p>{copied ? "Copied!" : name}</p>
				</a>
			) : href ? (
				//noclip
				<a
					className={className_interactive.join(" ")}
					href={href}
					target="_blank"
				>
					<Icon icon={icon} className="mr-2" />
					<p>{name}</p>
				</a>
			) : (
				<a className={className_normal.join(" ")}>
					<Icon icon={icon} className="mr-2" />
					<p>{name}</p>
				</a>
			)}
		</>
	);
}
