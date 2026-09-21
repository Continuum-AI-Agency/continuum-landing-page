import { cn } from "@/lib/utils";
import { CheckCircle, Users, Briefcase, Building } from "@phosphor-icons/react";
import React from "react";

interface Plan {
	icon: React.ReactNode;
	description: string;
	name: string;
	variant: string;
	features: string[];
	badge?: string;
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

					const tooltip = document.createElement('div');
					tooltip.id = 'pricing-tooltip';
					tooltip.className = 'absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs py-2 px-4 rounded-lg shadow-xl animate-bounce whitespace-nowrap z-50';
					tooltip.innerHTML = 'Complete this to get started! <span class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-600"></span>';

					const inputWrapper = emailInput.parentElement;
					if (inputWrapper) {
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
				<div className="mx-auto mb-12 max-w-2xl space-y-4 text-center">
					<h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-display">
						Plans that Scale with <span className="shimmer-text">You</span>
					</h2>
					<p className="mx-auto max-w-xl text-lg text-muted-foreground font-sans">
						Every module runs your way — <span className="text-foreground font-medium">self-service</span> or{" "}
						<span className="text-foreground font-medium">fully managed</span> by our team. New pricing is on
						the way; reach out to get started.
					</p>

					{/* Engagement models */}
					<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
						<span className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-foreground">
							Self-Service
						</span>
						<span className="text-muted-foreground/50 text-sm">or</span>
						<span className="rounded-full border border-brand-violet/40 bg-brand-violet/10 px-4 py-1.5 text-sm font-medium text-foreground">
							Managed Service
						</span>
					</div>
				</div>

				<div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-3">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className="relative flex flex-col rounded-xl bg-card p-8 border border-border/40 font-sans shadow-[0_1px_3px_oklch(0%_0_0_/_40%),_inset_0_1px_0_oklch(100%_0_0_/_8%)] transition-all duration-500 hover:border-primary/40"
						>
							{plan.badge && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold bg-brand-violet text-white shadow-sm z-10 font-mono tracking-wider">
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

							{/* Availability — both engagement models, no prices yet */}
							<div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground/80">
								<span className="rounded bg-muted px-2 py-0.5 border border-border/40">Self-Service</span>
								<span className="rounded bg-muted px-2 py-0.5 border border-border/40">Managed</span>
							</div>

							<button
								onClick={handleGetStarted}
								className="mb-8 w-full border border-border/60 bg-transparent font-medium text-foreground hover:bg-muted hover:border-border transition-all duration-150 rounded-md px-6 py-2.5 cursor-pointer"
							>
								Get Started
							</button>

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
		name: "Social+",
		description: "Organic social and community management — on-brand and automated.",
		variant: "outline",
		features: [
			"Canvas Studio Access",
			"Live Brand Trends",
			"Organic Delivery",
			"Social Media Automations",
			"Analytics and Insights",
		],
	},
	{
		icon: <Briefcase className="h-5 w-5" />,
		name: "Creative+",
		description: "AI-native creative production — hundreds of on-brand variations from one template.",
		variant: "outline",
		features: [
			"Bespoke Render Templates",
			"Agentic Campaign Optimizations",
			"Dynamic Content Optimization",
			"On-brand by construction",
			"Analytics and Insights",
		],
	},
	{
		icon: <Building className="h-5 w-5" />,
		name: "Performance+",
		description: "Paid performance and stock-aware DCO for campaign delivery at scale.",
		variant: "outline",
		features: [
			"Stock-Aware Dynamic Creative",
			"Managed Campaign Optimization",
			"Custom Integrations",
			"Advanced Security",
			"Unlimited Users",
		],
	},
];
