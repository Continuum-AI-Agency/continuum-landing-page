'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ProgressiveBlur } from '@/components/core/progressive-blur';
import { ArrowClockwise as RotateCw } from '@phosphor-icons/react';

import avatarMich from '@/assets/team/mich.jpg';
import avatarDuane from '@/assets/team/Duane Scott Profile.png';
import avatarMati from '@/assets/team/mati.png';

import logoPedidosYa from '@/assets/Logos_Team/pedidosya-logo_brandlogos.net_perjc.png';
import logoCocaCola from '@/assets/Logos_Team/Coca-Cola_bottle_cap.svg';
import logoMercadoLibre from '@/assets/Logos_Team/mercado-libre-logo.svg';
import logoTechstars from '@/assets/Logos_Team/techstars-duane.png';
import logoUnnamed from '@/assets/Logos_Team/unnamed.png';
import logoDatobox from '@/assets/Logos_Team/datobox_logo.jpeg';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  zoomOut?: boolean;
  logos: { src: string; alt: string }[];
}

const teamMembers: TeamMember[] = [
  {
    name: 'Michelle Shocron',
    role: 'CEO',
    image: avatarMich.src,
    bio: '10+ years leading growth, product, and partnerships for tech and fintech companies in LatAm.',
    logos: [
      { src: logoPedidosYa.src, alt: 'PedidosYa' },
      { src: logoCocaCola.src, alt: 'Coca-Cola' },
      { src: logoMercadoLibre.src, alt: 'Mercado Libre' },
    ],
  },
  {
    name: 'Duane Scott',
    role: 'Product & Engineering',
    image: avatarDuane.src,
    bio: 'Seasoned engineering leader with experience building high-scale SaaS platforms and data products. Owns the technical architecture and AI stack.',
    logos: [
      { src: logoTechstars.src, alt: 'Techstars' },
      { src: logoUnnamed.src, alt: 'Foothill College' },
    ],
  },
  {
    name: 'Matías Ares',
    role: 'Engineering & Innovation',
    image: avatarMati.src,
    bio: 'Motion designer and creative technologist with experience in video, VFX, and After Effects. Designs and maintains the creative automation system.',
    logos: [
      { src: logoDatobox.src, alt: 'Datobox' },
    ],
  },
];

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
            alt=""
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

export function TeamSection() {
  return (
    <section id="team" className="bg-background border-t border-border/30 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-display uppercase">
            Meet our Co-founders
          </h2>
          <p className="mx-auto max-w-6xl text-lg text-muted-foreground font-sans">
            A small team obsessed with creative systems, media performance, and
            building tools that actually get used.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  );
}
