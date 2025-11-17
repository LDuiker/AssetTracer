import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  /**
   * Variant of the logo to display
   * - 'full': Logo image + text
   * - 'icon': Logo image only
   * - 'text': Text only
   * - 'fallback': Package icon + text (default if no logo file)
   */
  variant?: 'full' | 'icon' | 'text' | 'fallback';
  
  /**
   * Size of the logo
   * - 'sm': Small (mobile, sidebar)
   * - 'md': Medium (default)
   * - 'lg': Large (hero sections)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color scheme
   * - 'light': For dark backgrounds
   * - 'dark': For light backgrounds
   * - 'auto': Adapts to theme
   */
  theme?: 'light' | 'dark' | 'auto';
  
  /**
   * Whether to wrap in a Link component
   */
  href?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show text next to logo
   */
  showText?: boolean;
}

export function Logo({
  variant = 'fallback',
  size = 'md',
  theme = 'dark',
  href = '/',
  className = '',
  showText = true,
}: LogoProps) {
  // Size classes
  const sizeClasses = {
    sm: {
      text: 'text-lg',
      full: { width: 140, height: 32 },
      icon: { width: 32, height: 32 },
    },
    md: {
      text: 'text-xl',
      full: { width: 180, height: 40 },
      icon: { width: 40, height: 40 },
    },
    lg: {
      text: 'text-3xl',
      full: { width: 240, height: 56 },
      icon: { width: 52, height: 52 },
    },
  };

  // Theme classes
  const themeClasses = {
    light: {
      text: 'text-white',
    },
    dark: {
      text: 'text-[#0B1226]',
    },
    auto: {
      text: 'text-[#0B1226] dark:text-white',
    },
  };

  const currentSize = sizeClasses[size];
  const currentTheme = themeClasses[theme];

  // Logo content based on variant
  const renderLogoContent = () => {
    switch (variant) {
      case 'icon':
        return (
          <div className="flex items-center">
            <Image
              src="/favicon.svg"
              alt="Asset Tracer"
              width={currentSize.icon.width}
              height={currentSize.icon.height}
              className="h-auto w-auto"
              priority
            />
          </div>
        );

      case 'text':
        // Text only
        return (
          <span className={`${currentSize.text} font-bold ${currentTheme.text}`}>
            Asset Tracer
          </span>
        );

      case 'full':
        return (
          <Image
            src="/asset-tracer-logo.svg"
            alt="Asset Tracer"
            width={currentSize.full.width}
            height={currentSize.full.height}
            className="h-auto w-auto"
            priority
          />
        );

      case 'fallback':
      default:
        return (
          <div className="flex items-center space-x-2">
            <Image
              src="/asset-tracer-logo.svg"
              alt="Asset Tracer"
              width={currentSize.full.width}
              height={currentSize.full.height}
              className="h-auto w-auto"
              priority
            />
            {showText && (
              <span className={`${currentSize.text} font-bold ${currentTheme.text}`}>
                Asset Tracer
              </span>
            )}
          </div>
        );
    }
  };

  const content = renderLogoContent();

  // Wrap in Link if href is provided
  if (href) {
    return (
      <Link href={href} className={`flex items-center ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center ${className}`}>{content}</div>;
}

// Convenience exports for common use cases
export function LogoLight(props: Omit<LogoProps, 'theme'>) {
  return <Logo {...props} theme="light" />;
}

export function LogoDark(props: Omit<LogoProps, 'theme'>) {
  return <Logo {...props} theme="dark" />;
}

export function LogoIcon(props: Omit<LogoProps, 'variant' | 'showText'>) {
  return <Logo {...props} variant="icon" showText={false} />;
}

