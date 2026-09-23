'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ProgressiveBlur } from '@/components/core/progressive-blur';
import { ArrowClockwise as RotateCw } from '@phosphor-icons/react';

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  zoomOut?: boolean;
  logos: { src: string; alt: string }[];
}

function TeamMemberCard({ name, role, image, bio, zoomOut, logos }: TeamMember) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className="group relative aspect-[2/3] w-full cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl bg-card border border-border/40 shadow-[0_1px_3px_oklch(0%_0_0_/_40%),_inset_0_1px_0_oklch(100%_0_0_/_8%)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${zoomOut ? 'scale-90 object-top' : ''}`}
          />

          <ProgressiveBlur
            className="absolute bottom-0 left-0 h-[55%] w-full"
            blurIntensity={0.5}
            animate={isHover ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 0.7 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-6 pt-16 font-sans">
            <h3 className="text-xl font-semibold text-foreground">{name}</h3>
            <p className="text-sm font-medium text-muted-foreground">{role}</p>
          </div>

          <motion.div
            className="absolute right-4 top-4 rounded-full bg-background/60 border border-border/30 p-2 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHover ? 1 : 0, scale: isHover ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <RotateCw className="h-5 w-5 text-foreground" />
          </motion.div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl bg-card border border-border/40 p-5 shadow-[0_1px_3px_oklch(0%_0_0_/_40%),_inset_0_1px_0_oklch(100%_0_0_/_8%)]"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex h-full flex-col font-sans">
            <div className="flex-none pt-2">
              <h3 className="mb-1 text-lg font-semibold text-foreground">{name}</h3>
              <p className="mb-3 text-xs font-medium text-muted-foreground">{role}</p>
              <p className="text-xs leading-relaxed text-muted-foreground/90">{bio}</p>
            </div>

            {logos.length > 0 && (
              <div className="mt-auto flex flex-nowrap items-center justify-center gap-2 pb-2">
                {logos.map((logo, index) => (
                  <div key={index} className="h-6 w-auto shrink-0 bg-white/5 rounded px-1.5 py-0.5 border border-white/10 flex items-center justify-center">
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-auto object-contain opacity-80 mix-blend-lighten brightness-110"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.div
            className="absolute right-4 top-4 rounded-full bg-background/60 border border-border/30 p-2"
            whileHover={{ scale: 1.1 }}
          >
            <RotateCw className="h-5 w-5 text-foreground" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export interface TeamMate {
  name: string;
  role: string;
  image: string | null;
}

function TeamMateCard({ name, role, image }: TeamMate) {
  return (
    <figure className="group">
      <div className="aspect-[4/5] overflow-hidden rounded-xl border border-border/40 bg-[#0b0b0e]">
        {image ? (
          <img
            src={image}
            alt={`${name}, Continuum team`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-4xl font-bold text-white/80" aria-hidden="true">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <figcaption className="mt-3 font-sans">
        <p className="font-semibold text-foreground">{name}</p>
        {role && <p className="text-sm text-muted-foreground">{role}</p>}
      </figcaption>
    </figure>
  );
}

export function TeamSection({ members, team = [] }: { members: TeamMember[]; team?: TeamMate[] }) {
  return (
    <section id="team" className="bg-transparent px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-display">
            Meet the Team
          </h2>
          <p className="mx-auto max-w-[60ch] text-lg text-muted-foreground font-sans">
            A small team obsessed with creative systems, media performance, and
            building tools that actually get used.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {members.map((member) => (
            <TeamMemberCard key={member.name} {...member} />
          ))}
        </div>

        {team.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            {team.map((mate) => (
              <TeamMateCard key={mate.name} {...mate} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
