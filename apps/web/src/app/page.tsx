import { Bento } from '@/components/home/Bento';
import { Crew } from '@/components/home/Crew';
import { Hero } from '@/components/home/Hero';
import { Install } from '@/components/home/Install';
import { Numbers } from '@/components/home/Numbers';
import { Principles } from '@/components/home/Principles';
import { Ticker } from '@/components/home/Ticker';
import { catalog } from '@/lib/catalog';
import { highlight } from '@/lib/highlight';

const USAGE = `import { LikeButton, PenguinProvider } from 'penguin-ui';

export default function App() {
  const [liked, setLiked] = useState(false);

  return (
    <PenguinProvider scheme="dark">
      <LikeButton
        liked={liked}
        onChange={setLiked}
        count={1284 + (liked ? 1 : 0)}
      />
    </PenguinProvider>
  );
}`;

export default async function Home() {
  const items = catalog().map((e) => ({ id: e.id, name: e.name }));
  const code = await highlight(USAGE);
  return (
    <main>
      <Hero />
      <Ticker items={items} />
      <Bento />
      <Principles />
      <Crew />
      <Numbers />
      <Install codeHtml={code} />
    </main>
  );
}
