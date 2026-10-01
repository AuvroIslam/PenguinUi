import type { Metadata } from 'next';

import { CrewPage } from '@/components/crew/CrewPage';

export const metadata: Metadata = {
  title: 'The crew',
  description: 'Pip the penguin and friends: the cast that stars in every PenguinUi demo instead of stock photos.',
};

export default function Crew() {
  return <CrewPage />;
}
