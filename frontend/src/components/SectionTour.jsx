import { useCallback, useState } from 'react'
import GuidedTour from './GuidedTour'
import { TourContext } from './TourContext'
import { MENU_TOURS } from '../data/menuTours'

export default function SectionTour({ section, children }) {
  // O App remonta este componente por seção para reiniciar o guia ao repeti-lo.
  const storageKey = section === 'accounts' ? 'margemai.accounts-tour.v1' : `margemai.tour.${section}.v1`
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'seen' } catch { return true }
  })
  const showTour = useCallback(() => setOpen(true), [])
  const closeTour = useCallback(() => {
    setOpen(false)
    try { localStorage.setItem(storageKey, 'seen') } catch { /* O guia também funciona sem armazenamento local. */ }
  }, [storageKey])
  const steps = MENU_TOURS[section]
  return <TourContext.Provider value={steps ? showTour : null}>
    {children}
    {open && steps && <GuidedTour steps={steps} onClose={closeTour} />}
  </TourContext.Provider>
}
