'use client'

import { useEffect, useRef, useState } from 'react'

export type CatalogFilterOption = {
  label: string
  href: string
  active: boolean
}

export type CatalogFilterGroup = {
  label: string
  options: CatalogFilterOption[]
}

type CatalogFiltersProps = {
  groups: CatalogFilterGroup[]
  hasActiveFilters: boolean
  resetHref: string
}

function FilterGroupsList({ groups }: { groups: CatalogFilterGroup[] }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.label} className="store-catalog-filter-group">
          <p className="store-catalog-filter-group__label">{group.label}</p>
          <div className="store-catalog-filter-options">
            {group.options.map((option) => (
              <a
                key={`${group.label}-${option.label}`}
                href={option.href}
                className={`store-catalog-filter-chip ${option.active ? 'store-catalog-filter-chip--active store-catalog-filter-chip--primary' : ''}`}
                aria-current={option.active ? 'page' : undefined}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CatalogFilters({ groups, hasActiveFilters, resetHref }: CatalogFiltersProps) {
  const [open, setOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
      triggerButtonRef.current?.focus()
    }
  }, [open])

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="store-catalog-filter-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Filtrar
        </button>
        {hasActiveFilters ? (
          <a href={resetHref} className="store-catalog-filter-reset">
            Limpiar filtros
          </a>
        ) : null}
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <div className="store-catalog-sidebar">
          <div className="store-catalog-sidebar__header">
            <p className="store-catalog-filters__eyebrow">Catalogo</p>
            <h2 className="store-catalog-filters__title">Filtrar productos</h2>
            {hasActiveFilters ? (
              <a href={resetHref} className="store-catalog-filter-reset mt-1 inline-flex">
                Limpiar todos los filtros
              </a>
            ) : null}
          </div>
          <FilterGroupsList groups={groups} />
        </div>
      </aside>

      {open ? (
        <div className="store-catalog-filter-drawer lg:hidden" role="dialog" aria-modal="true" aria-label="Filtrar productos">
          <div className="store-catalog-filter-drawer__backdrop animate-overlayIn" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="store-catalog-filter-drawer__panel animate-slideDown">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="store-catalog-filters__title text-lg">Filtrar productos</h2>
              <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="store-catalog-filter-trigger" aria-label="Cerrar filtros">
                Cerrar
              </button>
            </div>
            <FilterGroupsList groups={groups} />
            {hasActiveFilters ? (
              <a href={resetHref} className="store-catalog-filter-reset mt-4 inline-flex" onClick={() => setOpen(false)}>
                Limpiar todos los filtros
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
