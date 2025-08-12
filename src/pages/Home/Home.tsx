import React, { type ComponentType, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import {
  FolderIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';

type FeatureCardProps = {
  to: string;
  ariaLabel: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  category: string;
  title: string;
  description: string;
  cta: string;
};

const FeatureCard = ({
  to,
  ariaLabel,
  Icon,
  category,
  title,
  description,
  cta,
}: FeatureCardProps) => (
  <Link
    to={to}
    aria-label={ariaLabel}
    className="group relative flex h-full min-h-56 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 transition duration-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
  >
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      aria-hidden="true"
    />
    <div className="flex items-center gap-3">
      <span
        className="inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary p-2 ring-1 ring-primary/20"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex flex-col text-left">
        <span className="text-xs font-medium text-muted-foreground">
          {category}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
    </div>
    <p className="mt-3 text-sm text-left text-muted-foreground">
      {description}
    </p>
    <div className="mt-auto pt-4 inline-flex items-center gap-1 text-primary transition-all group-hover:gap-1.5">
      <span className="text-sm font-medium">{cta}</span>
      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
    </div>
  </Link>
);

const features: FeatureCardProps[] = [
  {
    to: '/insights',
    ariaLabel: 'Go to Pull Request Insights',
    Icon: ArrowsRightLeftIcon,
    category: 'Pull Requests',
    title: 'Pull Request Insights',
    description:
      'Track end‑to‑end PR flow. Visualize lead time, review cycle time, and throughput to spot bottlenecks fast.',
    cta: 'Explore insights',
  },
  {
    to: '/developer',
    ariaLabel: 'Go to Developer Insights',
    Icon: UserGroupIcon,
    category: 'People',
    title: 'Developer Insights',
    description:
      'Surface contributions, reviews, and impact across repositories with radar and trend views.',
    cta: 'View dashboard',
  },
  {
    to: '/repo',
    ariaLabel: 'Go to Repository Insights',
    Icon: FolderIcon,
    category: 'Repositories',
    title: 'Repository Insights',
    description:
      'Monitor repository health—deployment frequency, MTTR, change failure rate, and hotspots—at a glance.',
    cta: 'See metrics',
  },
];

export default function Home() {
  useDocumentTitle('PR-ism Home');
  useMetaDescription('Access GitHub pull request insights and metrics.');
  return (
    <main className="px-4">
      <section className="container mx-auto max-w-6xl flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4">
        <h1 className="inline-block leading-tight text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter max-w-4xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
          Unlock actionable GitHub PR and DevOps metrics for data-driven
          engineering excellence
        </h1>
        <p className="text-foreground/80 max-w-3xl text-base text-balance sm:text-lg">
          Track key engineering metrics—lead time, review cycle time, deployment
          frequency, change failure rate, and more—to drive data-informed
          decisions. Start with the defaults and customize the dashboard to your
          team&apos;s workflow.
        </p>

        <div className="flex w-full items-center justify-center gap-2 pt-2">
          <Link
            to="/insights"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md gap-1.5 px-4"
            aria-label="Get started with insights"
          >
            Get Started
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/developer"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-9 rounded-md gap-1.5 px-4"
            aria-label="View developer insights"
          >
            View Developer Insights
          </Link>
        </div>

        <ul
          className="mt-10 grid w-full grid-cols-1 auto-rows-fr gap-4 sm:gap-6 md:grid-cols-3"
          aria-label="Navigation cards"
        >
          {features.map(({ title, ...card }) => (
            <li key={title}>
              <FeatureCard title={title} {...card} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
