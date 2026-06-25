"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type FlipImage = { title: string; url: string };

const defaultImages: FlipImage[] = [
  { title: 'Joshua Hibbert', url: 'https://picsum.photos/id/870/600/1000' },
  { title: 'Joshua Earle', url: 'https://picsum.photos/id/883/600/1000' },
  { title: 'Antoine Beauvillain', url: 'https://picsum.photos/id/478/600/1000' },
  { title: 'Greg Rakozy', url: 'https://picsum.photos/id/903/600/1000' },
  { title: 'Ramiro Checchi', url: 'https://picsum.photos/id/503/600/1000' }
];

const FLIP_SPEED = 750;
const flipTiming: KeyframeAnimationOptions = { duration: FLIP_SPEED, iterations: 1 };

// flip down
const flipAnimationTop = [
  { transform: 'rotateX(0)' },
  { transform: 'rotateX(-90deg)' },
  { transform: 'rotateX(-90deg)' }
];
const flipAnimationBottom = [
  { transform: 'rotateX(90deg)' },
  { transform: 'rotateX(90deg)' },
  { transform: 'rotateX(0)' }
];

// flip up
const flipAnimationTopReverse = [
  { transform: 'rotateX(-90deg)' },
  { transform: 'rotateX(-90deg)' },
  { transform: 'rotateX(0)' }
];
const flipAnimationBottomReverse = [
  { transform: 'rotateX(0)' },
  { transform: 'rotateX(90deg)' },
  { transform: 'rotateX(90deg)' }
];

interface FlipGalleryProps {
  /** Slides to flip through. Defaults to a stock demo set. */
  images?: FlipImage[];
  /** Replaces the full-screen black wrapper so the gallery can be embedded. */
  bare?: boolean;
}

export default function FlipGallery({ images = defaultImages, bare = false }: FlipGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniteRef = useRef<NodeListOf<HTMLDivElement> | HTMLDivElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);

  // initialise first image once
  useEffect(() => {
    if (!containerRef.current) return;
    uniteRef.current = containerRef.current.querySelectorAll<HTMLDivElement>('.unite');
    defineFirstImg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defineFirstImg = () => {
    uniteRef.current.forEach((el) => setActiveImage(el));
    setImageTitle();
  };

  const setActiveImage = (el: HTMLDivElement) => {
    el.style.backgroundImage = `url('${images[indexRef.current].url}')`;
  };

  const setImageTitle = () => {
    const gallery = containerRef.current;
    if (!gallery) return;
    gallery.setAttribute('data-title', images[indexRef.current].title);
    gallery.style.setProperty('--title-y', '0');
    gallery.style.setProperty('--title-opacity', '1');
  };

  const updateGallery = (isReverse = false) => {
    const gallery = containerRef.current;
    if (!gallery) return;

    // determine direction animation arrays
    const topAnim = isReverse ? flipAnimationTopReverse : flipAnimationTop;
    const bottomAnim = isReverse ? flipAnimationBottomReverse : flipAnimationBottom;

    gallery.querySelector('.overlay-top')?.animate(topAnim, flipTiming);
    gallery.querySelector('.overlay-bottom')?.animate(bottomAnim, flipTiming);

    // hide title
    gallery.style.setProperty('--title-y', '-1rem');
    gallery.style.setProperty('--title-opacity', '0');
    gallery.setAttribute('data-title', '');

    // update images with slight delay so animation looks continuous
    uniteRef.current.forEach((el, idx) => {
      const delay =
        (isReverse && idx !== 1 && idx !== 2) ||
        (!isReverse && (idx === 1 || idx === 2))
          ? FLIP_SPEED - 200
          : 0;

      setTimeout(() => setActiveImage(el), delay);
    });

    // reveal new title roughly half-way through animation
    setTimeout(setImageTitle, FLIP_SPEED * 0.5);
  };

  const updateIndex = (increment: number) => {
    const newIndex = (indexRef.current + increment + images.length) % images.length;
    const isReverse = increment < 0;
    indexRef.current = newIndex;
    setCurrentIndex(newIndex);
    updateGallery(isReverse);
  };

  const gallery = (
    <div
      className='relative bg-white/10 border border-white/25 p-2'
      style={{ '--gallery-bg-color': 'rgba(255 255 255 / 0.075)' } as React.CSSProperties}
    >
      {/* flip gallery */}
      <div
        id='flip-gallery'
        ref={containerRef}
        className='relative w-[240px] h-[400px] md:w-[300px] md:h-[500px] text-center'
        style={{ perspective: '800px' }}
        data-current={currentIndex}
      >
        <div className='top unite bg-cover bg-no-repeat'></div>
        <div className='bottom unite bg-cover bg-no-repeat'></div>
        <div className='overlay-top unite bg-cover bg-no-repeat'></div>
        <div className='overlay-bottom unite bg-cover bg-no-repeat'></div>
      </div>

      {/* navigation */}
      <div className='absolute top-full right-0 mt-2 flex gap-2'>
        <button
          type='button'
          onClick={() => updateIndex(-1)}
          title='Previous'
          className='text-white opacity-75 hover:opacity-100 hover:scale-125 transition'
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type='button'
          onClick={() => updateIndex(1)}
          title='Next'
          className='text-white opacity-75 hover:opacity-100 hover:scale-125 transition'
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const scopedStyles = (
    <style>{`
      #flip-gallery::after {
        content: '';
        position: absolute;
        background-color: black;
        width: 100%;
        height: 4px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
      }

      #flip-gallery::before {
        content: attr(data-title);
        color: rgba(255 255 255 / 0.75);
        font-size: 0.75rem;
        left: -0.5rem;
        position: absolute;
        top: calc(100% + 1rem);
        line-height: 2;
        opacity: var(--title-opacity, 0);
        transform: translateY(var(--title-y, 0));
        transition: opacity 500ms ease-in-out, transform 500ms ease-in-out;
      }

      #flip-gallery > * {
        position: absolute;
        width: 100%;
        height: 50%;
        overflow: hidden;
        background-size: 240px 400px;
      }

      @media (min-width: 600px) {
        #flip-gallery > * {
          background-size: 300px 500px;
        }
      }

      .top,
      .overlay-top {
        top: 0;
        transform-origin: bottom;
        background-position: top;
      }

      .bottom,
      .overlay-bottom {
        bottom: 0;
        transform-origin: top;
        background-position: bottom;
      }
    `}</style>
  );

  if (bare) {
    return (
      <div className='flex items-center justify-center font-sans'>
        {gallery}
        {scopedStyles}
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-black font-sans'>
      {gallery}
      {scopedStyles}
    </div>
  );
}
