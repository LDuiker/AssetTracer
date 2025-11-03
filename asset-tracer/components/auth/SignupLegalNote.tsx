'use client';

import Link from 'next/link';

interface SignupLegalNoteProps {
  className?: string;
}

export function SignupLegalNote({ className = '' }: SignupLegalNoteProps) {
  return (
    <div className={`text-xs text-gray-500 dark:text-gray-400 text-center ${className}`}>
      By continuing, you acknowledge that you have read and agree to our{' '}
      <Link
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Terms of Service
      </Link>
      {' '}and{' '}
      <Link
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Privacy Policy
      </Link>
      .
    </div>
  );
}

