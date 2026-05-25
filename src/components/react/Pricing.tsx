import { cn } from "@/lib/utils";
import { CheckCircle, Users, Briefcase, Building } from "@phosphor-icons/react";
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
		<section className="w-full bg-background border-t border-border/30 px-4 py-24 sm:px-6 lg:px-8">
			<style dangerouslySetInnerHTML={{ __html: `
				@keyframes text-shimmer {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
				}
				.shimmer-text {
					background: linear-gradient(
						90deg,
						var(--cs-teal) 0%,
						var(--cs-violet) 25%,
						var(--cs-magenta) 50%,
						var(--cs-teal) 75%,
						var(--cs-violet) 100%
					);
					background-size: 200% auto;
					-webkit-background-clip: text;
					background-clip: text;
					-webkit-text-fill-color: transparent;
					animation: text-shimmer 4s linear infinite;
					display: inline-block;
				}
			`}} />
			<div className="mx-auto max-w-7xl">
				<div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
					<h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-display uppercase">
						Plans that Scale with <span className="shimmer-text">You</span>
					</h2>
					<p className="mx-auto max-w-xl text-lg text-muted-foreground font-sans">
						Whether you're just starting out or growing fast, our flexible pricing
						has you covered.
					</p>

					{/* Toggle Switch */}
					<div className="mt-8 flex items-center justify-center gap-4">
						<span className={cn("text-sm font-medium transition-colors font-sans", !isAnnual ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
						<button
							onClick={() => setIsAnnual(!isAnnual)}
							className="relative inline-flex h-7 w-14 items-center rounded-full bg-muted border border-border/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
						>
							<span className="sr-only">Toggle annual billing</span>
							<motion.span
								className="inline-block h-5 w-5 rounded-full bg-primary shadow-lg"
								layout
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
								initial={false}
								animate={{ x: isAnnual ? 32 : 4 }}
							/>
						</button>
						<span className={cn("flex items-center gap-2 text-sm font-medium transition-colors font-sans", isAnnual ? "text-foreground" : "text-muted-foreground")}>
							Annually <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success border border-success/25 font-mono">SAVE 20%</span>
						</span>
					</div>
				</div>

				<div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
					{plans.map((plan, index) => (
						<div
							key={plan.name}
							className={cn(
								"relative flex flex-col rounded-xl bg-card p-8 border font-sans transition-all duration-500",
								index === 1
									? "border-primary lg:scale-105 shadow-[0_4px_12px_oklch(0%_0_0_/_50%),_inset_0_1px_0_oklch(100%_0_0_/_12%)] z-10"
									: "border-border/40 shadow-[0_1px_3px_oklch(0%_0_0_/_40%),_inset_0_1px_0_oklch(100%_0_0_/_8%)]"
							)}
						>
							{plan.badge && (
								<div
									className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold bg-brand-violet text-white shadow-sm z-10 font-mono tracking-wider"
								>
									{plan.badge}
								</div>
							)}

							<div className="mb-6">
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border/30 text-primary">
										{plan.icon}
									</div>
									<h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
								</div>
								<p className="text-sm text-muted-foreground">{plan.description}</p>
							</div>

							<div className="mb-6 flex items-baseline gap-2 min-h-[40px] font-mono">
								<span className="text-4xl font-bold text-foreground flex gap-1">
									<AnimatedPrice price={isAnnual ? plan.annualPrice : plan.monthlyPrice} />
								</span>
								{plan.period && (
									<span className="text-muted-foreground font-sans">{plan.period}</span>
								)}
								{plan.original && !isAnnual && (
									<span className="ml-auto text-lg text-muted-foreground/60 line-through">
										{plan.original}
									</span>
								)}
							</div>

							{plan.variant === "default" ? (
								<button
									onClick={handleGetStarted}
									className="mb-8 w-full bg-primary text-primary-foreground font-medium rounded-md px-6 py-2.5 shadow-sm hover:bg-[oklch(75%_0.13_180)] transition-all duration-150 ease-standard cursor-pointer"
								>
									Get Started
								</button>
							) : (
								<button
									onClick={handleGetStarted}
									className="mb-8 w-full border border-border/60 bg-transparent font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-150 rounded-md px-6 py-2.5 cursor-pointer"
								>
									Get Started
								</button>
							)}

							<ul className="space-y-3">
								{plan.features.map((item) => (
									<li key={item} className="flex items-start gap-3 text-muted-foreground">
										<CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
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
