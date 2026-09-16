import React from 'react';
import HomeGlass from '../src/screens/HomeGlass';
import HomeShelf from '../src/screens/HomeShelf';
import { useCabinet } from '../src/store/cabinet';

/**
 * Two home designs live side by side. The glass one is current; the original
 * coloured-shelf one is kept and switchable from Settings.
 */
export default function Home() {
  const { settings } = useCabinet();
  return settings.homeStyle === 'shelf' ? <HomeShelf /> : <HomeGlass />;
}
