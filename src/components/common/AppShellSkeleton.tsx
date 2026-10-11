import React from 'react';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from './PageContainer';

/**
 * First paint while auth and onboarding state resolve: the app frame with
 * placeholder content, instead of a blank page.
 */
export const AppShellSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading">
    <div className="bg-header">
      <PageContainer className="flex h-14 items-center gap-2 text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
          <Package className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="font-display text-[1.0625rem] font-semibold">Review Club</span>
      </PageContainer>
    </div>
    <PageContainer className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="space-y-2 p-3">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-3/4" />
          </Card>
        ))}
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <Card className="divide-y divide-border/60 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-6 w-24 sm:block" />
          </div>
        ))}
      </Card>
    </PageContainer>
  </div>
);
