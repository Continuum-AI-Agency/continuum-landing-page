import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";
import type React from "react";

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
}

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

	return (
		<section className="w-full bg-[#010409] px-4 py-24 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
					<h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
						Plans that Scale with You
					</h2>
					<p className="mx-auto max-w-xl text-lg text-neutral-400">
						Whether you're just starting out or growing fast, our flexible pricing
						has you covered.
					</p>
				</div>

				<div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
					{plans.map((plan, index) => (
						<div
							key={plan.name}
							className={cn(
								"relative flex flex-col rounded-2xl border border-white/10 bg-[#0d1117] p-8",
								index === 1 && "border-blue-500/50 lg:scale-105"
							)}
						>
						{plan.badge && (
							<div 
								className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-white shimmer-badge"
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

							<div className="mb-6 flex items-baseline gap-2">
								<span className="text-4xl font-bold text-white">{plan.price}</span>
								{plan.period && (
									<span className="text-neutral-400">{plan.period}</span>
								)}
								{plan.original && (
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
		price: "$300",
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
		description: "Ideal for small teams",
		name: "Studio+",
		badge: "Popular",
		price: "$450-1000",
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
		price: "Contact Us",
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
