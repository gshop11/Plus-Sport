'use client'

import { Children, type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'

type StoreRailProps = {
  children: ReactNode
  ariaLabel: string
  previousLabel: string
  nextLabel: string
  staticThreshold?: number
  className?: string
}

const SCROLL_TOLERANCE = 2

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function StoreRail({
  children,
  ariaLabel,
  previousLabel,
  nextLabel,
  staticThreshold = 3,
  className,
}: StoreRailProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const generatedId = useId()
  const trackId = `store-rail-${generatedId}`
  const items = Children.toArray(children)
  const isScrollable = items.length > staticThreshold
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollState = useCallback(() => {
    const track = trackRef.current

    if (!track || !isScrollable) {
      setCanScrollPrevious(false)
      setCanScrollNext(false)
      return
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth

    setCanScrollPrevious(track.scrollLeft > SCROLL_TOLERANCE)
    setCanScrollNext(maxScrollLeft - track.scrollLeft > SCROLL_TOLERANCE)
  }, [isScrollable])

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current

      if (!track) {
        return
      }

      const maxScrollLeft = track.scrollWidth - track.clientWidth
      const nextScrollLeft = Math.min(Math.max(track.scrollLeft + track.clientWidth * 0.88 * direction, 0), maxScrollLeft)

      track.scrollTo({
        left: nextScrollLeft,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isScrollable) {
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollByPage(-1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollByPage(1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      trackRef.current?.scrollTo({ left: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      return
    }

    if (event.key === 'End') {
      const track = trackRef.current

      if (!track) {
        return
      }

      event.preventDefault()
      track.scrollTo({
        left: track.scrollWidth - track.clientWidth,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }

  useEffect(() => {
    const track = trackRef.current

    if (!track || !isScrollable) {
      updateScrollState()
      return
    }

    const handleScroll = () => updateScrollState()
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateScrollState()
          })
        : null

    updateScrollState()
    track.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    resizeObserver?.observe(track)

    return () => {
      track.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      resizeObserver?.disconnect()
    }
  }, [items.length, isScrollable, updateScrollState])

  if (items.length === 0) {
    return null
  }

  const rootClassName = ['store-rail', isScrollable ? 'store-rail--scrollable' : 'store-rail--static', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName} role="region" aria-label={ariaLabel}>
      {isScrollable ? (
        <div className="store-rail__controls" aria-hidden={false}>
          <button
            type="button"
            className="store-rail__button"
            aria-label={previousLabel}
            aria-controls={trackId}
            disabled={!canScrollPrevious}
            onClick={() => scrollByPage(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="store-rail__button"
            aria-label={nextLabel}
            aria-controls={trackId}
            disabled={!canScrollNext}
            onClick={() => scrollByPage(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}

      <div
        id={trackId}
        ref={trackRef}
        className="store-rail__track"
        tabIndex={isScrollable ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => (
          <div className="store-rail__item" key={index}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
