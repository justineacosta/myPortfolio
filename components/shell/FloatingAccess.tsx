import AccessMenu from './AccessMenu'

/** On desktop the accessibility button floats in the bottom-right corner, under open views. Phones keep theirs beside theme and search. */
export default function FloatingAccess() {
  return (
    <div data-floating-access className="fixed right-5 bottom-5 z-30 hidden rounded-xl shadow-(--tile-shadow) shell:block">
      <AccessMenu size={40} />
    </div>
  )
}
