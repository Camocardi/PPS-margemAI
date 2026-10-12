import { useCallback, useRef, useState } from 'react'
import GuidedTour from './GuidedTour'
import { TourContext } from './TourContext'
import { MENU_TOURS } from '../data/menuTours'

export default function SectionTour({ section, children }) {
  const rootRef = useRef(null)
  const storageKey = section === 'accounts' ? 'margemai.accounts-tour.v1' : `margemai.tour.${section}.v1`
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'seen' } catch { return true }
  })
  const showTour = useCallback(() => setOpen(true), [])
  const closeTour = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(storageKey, 'seen') } catch { /* Keep the tour available when storage is blocked. */ }
  }, [storageKey])
  const steps = MENU_TOURS[section]
  return <TourContext.Provider value={steps ? showTour : null}>
    <div ref={rootRef} inert={open && !!steps ? true : undefined} aria-hidden={open && !!steps ? true : undefined}>{children}</div>
    {open && steps && <GuidedTour rootRef={rootRef} steps={steps} onClose={closeTour} />}
  </TourContext.Provider>
}
