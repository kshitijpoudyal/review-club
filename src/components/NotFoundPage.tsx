import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { typography } from '../utils/typography';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="max-w-md w-full text-center">
        <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/8 text-primary">
          <Compass className="h-10 w-10" strokeWidth={1.5} />
        </span>
        <p className={`${typography.overline} mb-2`}>Error 404</p>
        <h1 className="font-display text-4xl font-semibold text-foreground mb-3">Page not found</h1>
        <p className="text-on-surface-variant mb-8">
          The page might have been moved or deleted, or the address may be mistyped.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link to="/">Go to homepage</Link>
          </Button>
          <Button variant="ghost" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
