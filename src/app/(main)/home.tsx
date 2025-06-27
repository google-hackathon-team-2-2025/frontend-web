'use client';
import { useRouter } from 'next/navigation';

type Section = {
  href: string;
  title: string;
  description: string;
  inProgress: boolean;
};

const sections: Section[] = [
  {
    href: '/html&css',
    title: 'HTML & CSS',
    description:
      'Semantic HTML, accessibility basics, Flexbox, Grid, responsive designSemantic HTML, accessibility basics, Flexbox, Grid, responsive design',
    inProgress: false,
  },
  {
    href: '#',
    title: 'JavaScript Fundamentals',
    description: 'ES6+ syntax, scope, closures, async patterns, DOM APIs',
    inProgress: true,
  },
  {
    href: '#',
    title: 'API Integration',
    description: 'fetch/axios, REST, GraphQL, error handling, loading states',
    inProgress: true,
  },
  {
    href: '#',
    title: 'Framework Basics (React)',
    description: 'Components, props, state, hooks, Context API, lifecycle',
    inProgress: true,
  },
  {
    href: '#',
    title: 'Tooling & Debugging',
    description: 'Chrome DevTools, ESLint/Prettier, npm scripts, build tools',
    inProgress: true,
  },
  // {
  //   href: '#',
  //   title: 'Algorithmic Practice',
  //   description: 'Arrays/strings, time/space complexity, LeetCode problems',
  //   inProgress: true,
  // },
];

export default function HomeComponent() {
  const router = useRouter();

  const totalItems = sections.length;
  const columns = 3;

  const colSpanClasses: { [key: number]: string } = {
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    6: 'md:col-span-6',
  };

  return (
    <div className="text-4xl font-bold text-center"> Hello Fact Checkers</div>
  );
} 