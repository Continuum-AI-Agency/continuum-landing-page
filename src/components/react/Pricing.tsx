import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Plan {
	icon: React.ReactNode;
	description: string;
	name: string;
	price: string;
	period?: string;
	variant: string;
	features: string[];
	badge?: string;
	original?: string;
	monthlyPrice: string;
	annualPrice: string;
}

const AnimatedPrice = ({ price }: { price: string }) => {
	// If it's pure text like "Contact Us", just return it
	if (isNaN(parseInt(price.replace(/[^0-9]/g, '')))) {
		return <span>{price}</span>;
	}

	return (
		<div className="flex overflow-hidden relative">
			<AnimatePresence mode="popLayout">
				<motion.span
					key={price}
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -20, opacity: 0 }}
					transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
					className="inline-block"
				>
					{price}
				</motion.span>
			</AnimatePresence>
		</div>
	);
};

export function PricingSection() {
	const handleGetStarted = () => {
		const demoSection = document.getElementById('demo');
		if (demoSection) {
			const yOffset = -80; // Adjust for header height
			const y = demoSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
			window.scrollTo({ top: y, behavior: 'smooth' });

			// Trigger highlight in CTA component
			const emailInput = document.querySelector('#footer-demo-form input') as HTMLInputElement;
			if (emailInput) {
				setTimeout(() => {
					emailInput.focus();
					emailInput.classList.add('highlight-pulse');

					// Add a tooltip-like effect
					const tooltip = document.createElement('div');
					tooltip.id = 'pricing-tooltip';
					tooltip.className = 'absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs py-2 px-4 rounded-lg shadow-xl animate-bounce whitespace-nowrap z-50';
					tooltip.innerHTML = 'Complete this to get started! <span class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-600"></span>';

					const inputWrapper = emailInput.parentElement;
					if (inputWrapper) {
						// Remove existing if any
						document.getElementById('pricing-tooltip')?.remove();
						inputWrapper.style.position = 'relative';
						inputWrapper.appendChild(tooltip);

						setTimeout(() => {
							tooltip.remove();
							emailInput.classList.remove('highlight-pulse');
						}, 4000);
					}
				}, 800);
			}
		}
	};

	const [isAnnual, setIsAnnual] = useState(false);

	return (
		<section className="w-full bg-[#0f172a] px-4 py-24 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
					<h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
						Plans that Scale with You
					</h2>
					<p className="mx-auto max-w-xl text-lg text-neutral-400">
						Whether you're just starting out or growing fast, our flexible pricing
						has you covered.
					</p>

					{/* Toggle Switch */}
					<div className="mt-8 flex items-center justify-center gap-4">
						<span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-white" : "text-slate-400")}>Monthly</span>
						<button
							onClick={() => setIsAnnual(!isAnnual)}
							className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-800 border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
						>
							<span className="sr-only">Toggle annual billing</span>
							<motion.span
								className="inline-block h-5 w-5 rounded-full bg-blue-500 shadow-lg"
								layout
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
								initial={false}
								animate={{ x: isAnnual ? 32 : 4 }}
							/>
						</button>
						<span className={cn("flex items-center gap-2 text-sm font-medium transition-colors", isAnnual ? "text-white" : "text-slate-400")}>
							Annually <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold text-green-400 border border-green-500/30">SAVE 20%</span>
						</span>
					</div>
				</div>

				<div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
					{plans.map((plan, index) => (
						<div
							key={plan.name}
							className={cn(
								"relative flex flex-col rounded-2xl bg-[#0d1117] p-8",
								index === 1
									? "border border-transparent bg-clip-padding lg:scale-105 shadow-[0_0_30px_-5px_#" + "2f81f7" + "40]"
									: "border border-white/10"
							)}
						>
							{plan.badge && (
								<div
									className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white shimmer-badge z-10"
									style={{
										background: 'linear-gradient(90deg, #2f81f7 0%, #a371f7 25%, #3fb950 50%, #a371f7 75%, #2f81f7 100%)',
										backgroundSize: '200% auto',
										animation: 'shimmer 3s linear infinite',
									}}
								>
									{plan.badge}
								</div>
							)}

							<div className="mb-6">
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white">
										{plan.icon}
									</div>
									<h3 className="text-xl font-semibold text-white">{plan.name}</h3>
								</div>
								<p className="text-sm text-neutral-400">{plan.description}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-2 min-h-[40px]">
								<span className="text-4xl font-bold text-white flex gap-1">
									<AnimatedPrice price={isAnnual ? plan.annualPrice : plan.monthlyPrice} />
								</span>
								{plan.period && (
									<span className="text-neutral-400">{plan.period}</span>
								)}
								{plan.original && !isAnnual && (
									<span className="ml-auto text-lg text-neutral-500 line-through">
										{plan.original}
									</span>
								)}
							</div>

							{plan.variant === "default" ? (
								<button
									onClick={handleGetStarted}
									className="mb-8 w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
									style={{
										background: 'linear-gradient(90deg, #2f81f7 0%, #a371f7 25%, #3fb950 50%, #a371f7 75%, #2f81f7 100%)',
										backgroundSize: '200% auto',
										animation: 'shimmer 3s linear infinite',
									}}
								>
									Get Started
								</button>
							) : (
								<Button
									onClick={handleGetStarted}
									className="mb-8 w-full border-white/20 bg-transparent font-semibold text-white hover:bg-white/10"
									variant="outline"
								>
									Get Started
								</Button>
							)}

							<ul className="space-y-3">
								{plan.features.map((item) => (
									<li key={item} className="flex items-start gap-3 text-neutral-300">
										<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
										<span className="text-sm">{item}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

const plans: Plan[] = [
	{
		icon: <Users className="h-5 w-5" />,
		description: "Perfect for Small Teams",
		name: "Social+",
		price: "",
		monthlyPrice: "$300",
		annualPrice: "$240",
		period: "/month",
		variant: "outline",
		features: [
			"Canvas Studio Access",
			"Live Brand Trends",
			"Organic Delivery",
			"Social Media Automations",
			"Analytics and Insights"
		],
	},
	{
		icon: <Briefcase className="h-5 w-5" />,
		description: "Ideal for Growing Campaigns",
		name: "Studio+",
		badge: "Popular",
		price: "",
		monthlyPrice: "$450-1000",
		annualPrice: "$360-800",
		period: "/month",
		variant: "default",
		features: [
			"All Social+ Features",
			"Bespoke Render Templates",
			"Agentic Campaign Optimizations",
			"Priority Support",
			"Dynamic Content Optimization",
		],
	},
	{
		icon: <Building className="h-5 w-5" />,
		name: "Performance+",
		description: "Perfect for Campaign Deliveries at Scale",
		price: "",
		monthlyPrice: "Contact Us",
		annualPrice: "Contact Us",
		variant: "outline",
		features: [
			"All Studio+ Plan Features",
			"Dedicated Account Manager",
			"Custom Integrations",
			"Advanced Security",
			"Unlimited Users",
		],
	},
];
