// Server component wrapper to force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ActivityClient from './ActivityClient';

export default function ActivityPage() {
  return <ActivityClient />;
}
