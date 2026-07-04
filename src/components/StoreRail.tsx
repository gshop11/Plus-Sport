'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

type StoreRailMode = 'manual' | 'cyclic'

type StoreRailVisibleItems = {
  mobile: number
  tablet: number
  desktop: number
}

type StoreRailProps = {
  children: ReactNode
  ariaLabel: string
  previousLabel: string
  nextLabel: string
  staticThreshold?: number
  className?: string
  mode?: StoreRailMode
  autoplay?: boolean
  autoplayInterval?: number
  visibleItems?: StoreRailVisibleItems
}

type InertElementProps = {
  children?: ReactNode
  href?: unknown
  id?: unknown
  tabIndex?: unknown
}

const SCROLL_TOLERANCE = 2
const DEFAULT_AUTOPLAY_INTERVAL = 5500
const MANUAL_PAUSE_DURATION = 8000
const DEFAULT_VISIBLE_ITEMS: StoreRailVisibleItems = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
}
const FOCUSABLE_TAGS = new Set(['button', 'input', 'select', 'textarea'])

const getVisibleCount = (visibleItems: StoreRailVisibleItems) => {
  if (typeof window === 'undefined') {
    return visibleItems.desktop
  }

  if (window.matchMedia('(min-width: 1024px)').matches) {
    return visibleItems.desktop
  }

  if (window.matchMedia('(min-width: 768px)').matches) {
    return visibleItems.tablet
  }

  return visibleItems.mobile
}

const isFocusableElement = (element: ReactElement<InertElementProps>) => {
  if (typeof element.type !== 'string') {
    return false
  }

  if (element.type === 'a') {
    return element.props.href != null
  }

  return FOCUSABLE_TAGS.has(element.type) || element.props.tabIndex != null
}

const makeInertNode = (node: ReactNode): ReactNode => {
  if (!isValidElement<InertElementProps>(node)) {
    return node
  }

  const nextProps: Partial<InertElementProps> = {}

  if (node.props.id != null) {
    nextProps.id = undefined
  }

  if (isFocusableElement(node)) {
    nextProps.tabIndex = -1
  }

  if (node.props.children != null) {
    nextProps.children = Children.map(node.props.children, makeInertNode)
  }

  return cloneElement(node, nextProps)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function StoreRail({
  children,
  ariaLabel,
  previousLabel,
  nextLabel,
  staticThreshold = 3,
  className,
  mode = 'manual',
  autoplay = false,
  autoplayInterval = DEFAULT_AUTOPLAY_INTERVAL,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
}: StoreRailProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logicalIndexRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const generatedId = useId()
  const trackId = `store-rail-${generatedId}`
  const items = Children.toArray(children)
  const isCyclicMode = mode === 'cyclic'
  const [visibleCount, setVisibleCount] = useState(() => Math.max(1, visibleItems.mobile))
  const [stepSize, setStepSize] = useState(0)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const [hasReducedMotion, setHasReducedMotion] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const [isPointerDown, setIsPointerDown] = useState(false)
  const [isManualPauseActive, setIsManualPauseActive] = useState(false)
  const [autoplayCycle, setAutoplayCycle] = useState(0)

  const cyclicVisibleCount = Math.max(1, Math.min(visibleCount, items.length || 1))
  const isCyclicActive = isCyclicMode && items.length > cyclicVisibleCount
  const isManualScrollable = !isCyclicMode && items.length > staticThreshold
  const hasControls = isCyclicActive || isManualScrollable
  const clonesBefore = isCyclicActive ? items.slice(-cyclicVisibleCount) : []
  const clonesAfter = isCyclicActive ? items.slice(0, cyclicVisibleCount) : []
  const visibleStyle = { '--store-rail-visible': cyclicVisibleCount } as CSSProperties

  const cancelAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  const measureStep = useCallback(() => {
    const track = trackRef.current

    if (!track || !isCyclicActive) {
      setStepSize(0)
      return
    }

    const firstItem = track.querySelector<HTMLElement>('[data-store-rail-item]')
    const secondItem = firstItem?.nextElementSibling as HTMLElement | null

    if (!firstItem) {
      setStepSize(0)
      return
    }

    const measuredStep = secondItem
      ? secondItem.offsetLeft - firstItem.offsetLeft
      : firstItem.getBoundingClientRect().width

    setStepSize(Math.max(0, measuredStep))
  }, [isCyclicActive])

  const scrollToLogicalIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = hasReducedMotion ? 'auto' : 'smooth') => {
      const track = trackRef.current

      if (!track || !isCyclicActive || stepSize <= 0) {
        return
      }

      isAnimatingRef.current = true
      logicalIndexRef.current = nextIndex
      track.scrollTo({
        left: (cyclicVisibleCount + nextIndex) * stepSize,
        behavior,
      })
    },
    [cyclicVisibleCount, hasReducedMotion, isCyclicActive, stepSize],
  )

  const settleCyclicScroll = useCallback(() => {
    const track = trackRef.current

    if (!track || !isCyclicActive || stepSize <= 0) {
      isAnimatingRef.current = false
      return
    }

    const rawIndex = Math.round(track.scrollLeft / stepSize) - cyclicVisibleCount
    let normalizedIndex = rawIndex

    if (rawIndex < 0) {
      normalizedIndex = rawIndex + items.length
    } else if (rawIndex >= items.length) {
      normalizedIndex = rawIndex - items.length
    }

    if (normalizedIndex !== rawIndex) {
      track.scrollTo({
        left: (cyclicVisibleCount + normalizedIndex) * stepSize,
        behavior: 'auto',
      })
    }

    logicalIndexRef.current = normalizedIndex
    isAnimatingRef.current = false
    setAutoplayCycle((currentCycle) => currentCycle + 1)
  }, [cyclicVisibleCount, isCyclicActive, items.length, stepSize])

  const scheduleScrollSettle = useCallback(() => {
    if (scrollSettleTimerRef.current) {
      window.clearTimeout(scrollSettleTimerRef.current)
    }

    scrollSettleTimerRef.current = setTimeout(() => {
      settleCyclicScroll()
    }, 140)
  }, [settleCyclicScroll])

  const pauseAfterManualInteraction = useCallback(() => {
    cancelAutoplayTimer()
    setIsManualPauseActive(true)

    if (manualPauseTimerRef.current) {
      window.clearTimeout(manualPauseTimerRef.current)
    }

    manualPauseTimerRef.current = setTimeout(() => {
      setIsManualPauseActive(false)
    }, MANUAL_PAUSE_DURATION)
  }, [cancelAutoplayTimer])

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current

      if (!track) {
        return
      }

      if (isCyclicActive) {
        pauseAfterManualInteraction()
        scrollToLogicalIndex(logicalIndexRef.current + direction)
        return
      }

      const maxScrollLeft = track.scrollWidth - track.clientWidth
      const nextScrollLeft = Math.min(Math.max(track.scrollLeft + track.clientWidth * 0.88 * direction, 0), maxScrollLeft)

      track.scrollTo({
        left: nextScrollLeft,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [isCyclicActive, pauseAfterManualInteraction, scrollToLogicalIndex],
  )

  const updateManualScrollState = useCallback(() => {
    const track = trackRef.current

    if (!track || !isManualScrollable) {
      setCanScrollPrevious(false)
      setCanScrollNext(false)
      return
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth

    setCanScrollPrevious(track.scrollLeft > SCROLL_TOLERANCE)
    setCanScrollNext(maxScrollLeft - track.scrollLeft > SCROLL_TOLERANCE)
  }, [isManualScrollable])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !hasControls) {
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
      pauseAfterManualInteraction()
      if (isCyclicActive) {
        scrollToLogicalIndex(0)
        return
      }
      trackRef.current?.scrollTo({ left: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      return
    }

    if (event.key === 'End') {
      const track = trackRef.current

      if (!track) {
        return
      }

      event.preventDefault()
      pauseAfterManualInteraction()

      if (isCyclicActive) {
        scrollToLogicalIndex(items.length - cyclicVisibleCount)
        return
      }

      track.scrollTo({
        left: track.scrollWidth - track.clientWidth,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    }
  }

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(Math.max(1, getVisibleCount(visibleItems)))
    }

    updateVisibleCount()

    if (typeof window === 'undefined') {
      return undefined
    }

    const tabletQuery = window.matchMedia('(min-width: 768px)')
    const desktopQuery = window.matchMedia('(min-width: 1024px)')

    tabletQuery.addEventListener('change', updateVisibleCount)
    desktopQuery.addEventListener('change', updateVisibleCount)
    window.addEventListener('resize', updateVisibleCount)

    return () => {
      tabletQuery.removeEventListener('change', updateVisibleCount)
      desktopQuery.removeEventListener('change', updateVisibleCount)
      window.removeEventListener('resize', updateVisibleCount)
    }
  }, [visibleItems])

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => {
      setHasReducedMotion(motionQuery.matches)
    }

    updateMotionPreference()
    motionQuery.addEventListener('change', updateMotionPreference)

    return () => {
      motionQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current

    if (!root || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting && entry.intersectionRatio >= 0.3)
      },
      { threshold: [0, 0.3, 0.5] },
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const updateVisibility = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }

    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current

    if (!track) {
      return undefined
    }

    const handleScroll = () => {
      if (isCyclicActive) {
        scheduleScrollSettle()
        return
      }

      updateManualScrollState()
    }

    const handleScrollEnd = () => {
      if (isCyclicActive) {
        settleCyclicScroll()
      }
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            measureStep()
            updateManualScrollState()
          })
        : null

    measureStep()
    updateManualScrollState()
    track.addEventListener('scroll', handleScroll, { passive: true })
    track.addEventListener('scrollend', handleScrollEnd)
    window.addEventListener('resize', measureStep)
    resizeObserver?.observe(track)

    return () => {
      track.removeEventListener('scroll', handleScroll)
      track.removeEventListener('scrollend', handleScrollEnd)
      window.removeEventListener('resize', measureStep)
      resizeObserver?.disconnect()
    }
  }, [isCyclicActive, measureStep, scheduleScrollSettle, settleCyclicScroll, updateManualScrollState])

  useEffect(() => {
    const track = trackRef.current

    if (!track || !isCyclicActive || stepSize <= 0) {
      return
    }

    logicalIndexRef.current = 0
    track.scrollTo({
      left: cyclicVisibleCount * stepSize,
      behavior: 'auto',
    })
  }, [cyclicVisibleCount, isCyclicActive, items.length, stepSize])

  const canAutoplay =
    isCyclicActive &&
    autoplay &&
    !hasReducedMotion &&
    isIntersecting &&
    isDocumentVisible &&
    !isHovered &&
    !hasFocusWithin &&
    !isPointerDown &&
    !isManualPauseActive

  useEffect(() => {
    cancelAutoplayTimer()

    if (!canAutoplay) {
      return undefined
    }

    autoplayTimerRef.current = setTimeout(() => {
      if (!isAnimatingRef.current) {
        scrollToLogicalIndex(logicalIndexRef.current + 1)
      }
    }, autoplayInterval)

    return () => {
      cancelAutoplayTimer()
    }
  }, [autoplayCycle, autoplayInterval, canAutoplay, cancelAutoplayTimer, scrollToLogicalIndex])

  useEffect(
    () => () => {
      cancelAutoplayTimer()

      if (manualPauseTimerRef.current) {
        window.clearTimeout(manualPauseTimerRef.current)
      }

      if (scrollSettleTimerRef.current) {
        window.clearTimeout(scrollSettleTimerRef.current)
      }
    },
    [cancelAutoplayTimer],
  )

  const renderedItems = useMemo(() => {
    if (!isCyclicActive) {
      return items.map((item, index) => ({
        item,
        key: `real-${index}`,
        clone: false,
      }))
    }

    return [
      ...clonesBefore.map((item, index) => ({
        item: makeInertNode(item),
        key: `clone-before-${index}`,
        clone: true,
      })),
      ...items.map((item, index) => ({
        item,
        key: `real-${index}`,
        clone: false,
      })),
      ...clonesAfter.map((item, index) => ({
        item: makeInertNode(item),
        key: `clone-after-${index}`,
        clone: true,
      })),
    ]
  }, [clonesAfter, clonesBefore, isCyclicActive, items])

  if (items.length === 0) {
    return null
  }

  const rootClassName = [
    'store-rail',
    isCyclicMode ? 'store-rail--cyclic' : null,
    isCyclicActive ? 'store-rail--cyclic-active' : null,
    isManualScrollable ? 'store-rail--scrollable' : null,
    !isCyclicActive && !isManualScrollable ? 'store-rail--static' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      role="region"
      aria-label={ariaLabel}
      data-store-rail-mode={mode}
      data-store-rail-active={isCyclicActive ? 'true' : 'false'}
      style={visibleStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocusWithin(false)
        }
      }}
      onPointerDown={() => {
        setIsPointerDown(true)
        pauseAfterManualInteraction()
      }}
      onPointerUp={() => setIsPointerDown(false)}
      onPointerCancel={() => setIsPointerDown(false)}
      onWheel={() => {
        if (isCyclicActive) {
          pauseAfterManualInteraction()
        }
      }}
    >
      {hasControls ? (
        <div className="store-rail__controls" aria-hidden={false}>
          <button
            type="button"
            className="store-rail__button store-rail__button--previous"
            aria-label={previousLabel}
            aria-controls={trackId}
            disabled={isManualScrollable ? !canScrollPrevious : undefined}
            onClick={() => scrollByPage(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="store-rail__button store-rail__button--next"
            aria-label={nextLabel}
            aria-controls={trackId}
            disabled={isManualScrollable ? !canScrollNext : undefined}
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
        tabIndex={hasControls ? 0 : undefined}
        onKeyDown={handleKeyDown}
      >
        {renderedItems.map(({ item, key, clone }) => (
          <div
            className="store-rail__item"
            key={key}
            data-store-rail-item=""
            data-store-rail-clone={clone ? 'true' : undefined}
            aria-hidden={clone ? 'true' : undefined}
            inert={clone ? true : undefined}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
