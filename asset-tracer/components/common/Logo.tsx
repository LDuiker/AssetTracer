import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';

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
      icon: 'h-6 w-6',
      text: 'text-lg',
      logo: 'h-8',
    },
    md: {
      icon: 'h-8 w-8',
      text: 'text-xl',
      logo: 'h-10',
    },
    lg: {
      icon: 'h-12 w-12',
      text: 'text-3xl',
      logo: 'h-16',
    },
  };

  // Theme classes
  const themeClasses = {
    light: {
      icon: 'text-white',
      text: 'text-white',
    },
    dark: {
      icon: 'text-[#2563EB]',
      text: 'text-[#0B1226]',
    },
    auto: {
      icon: 'text-[#2563EB] dark:text-white',
      text: 'text-[#0B1226] dark:text-white',
    },
  };

  const currentSize = sizeClasses[size];
  const currentTheme = themeClasses[theme];

  // Logo content based on variant
  const renderLogoContent = () => {
    switch (variant) {
      case 'icon':
        // Try to load logo icon, fallback to Package
        return (
          <div className="flex items-center">
            <Package className={`${currentSize.icon} ${currentTheme.icon}`} />
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
        // Try to load full logo image with text
        // If logo.svg exists, use it. Otherwise fallback to icon + text
        return (
          <div className="flex items-center space-x-2">
            {/* <Image 
              src="/logo.svg" 
              alt="Asset Tracer" 
              width={40} 
              height={40}
              className={currentSize.logo}
            /> */}
            <Package className={`${currentSize.icon} ${currentTheme.icon}`} />
            {showText && (
              <span className={`${currentSize.text} font-bold ${currentTheme.text}`}>
                Asset Tracer
              </span>
            )}
          </div>
        );

      case 'fallback':
      default:
        // Package icon + text (current default)
        return (
          <div className="flex items-center space-x-2">
            <Package className={`${currentSize.icon} ${currentTheme.icon}`} />
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

