import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = 'left',
  tone = 'dark',
  as: Tag = 'h2',
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  as?: 'h1' | 'h2' | 'h3';
  children?: ReactNode;
}) {
  return (
    <header className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      {eyebrow ? (
        <p className={`eyebrow mb-3 ${tone === 'light' ? 'text-teal/90' : ''}`}>{eyebrow}</p>
      ) : null}
      <Tag
        className={`text-[clamp(1.65rem,3.1vw,2.6rem)] font-semibold leading-[1.12] ${
          tone === 'light' ? 'text-white' : 'text-ink'
        }`}
      >
        {title}
      </Tag>
      {copy ? (
        <p
          className={`mt-4 max-w-[62ch] text-[15px] leading-relaxed sm:text-base ${
            align === 'center' ? 'mx-auto' : ''
          } ${tone === 'light' ? 'text-white/70' : 'text-muted'}`}
        >
          {copy}
        </p>
      ) : null}
      {children}
    </header>
  );
}
