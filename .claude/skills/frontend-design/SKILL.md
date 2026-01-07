---
name: frontend-design
description: Crear componentes React con TailwindCSS siguiendo los patrones del proyecto. Usar cuando se pida crear páginas, componentes UI, o modificar el diseño frontend.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Frontend Design - Real Estate Leads Argentina

## Stack Tecnológico

- **React 18** con TypeScript
- **TailwindCSS** para estilos
- **React Router DOM** para navegación
- **React Query** (@tanstack/react-query) para data fetching
- **Lucide React** para iconos
- **clsx** para clases condicionales

## Estructura de Archivos

```
frontend/src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas/vistas principales
├── main.tsx        # Entry point
├── App.tsx         # Router principal
└── index.css       # Estilos globales (Tailwind)
```

## Patrones de Diseño del Proyecto

### Paleta de Colores

- **Primary**: `primary-50` a `primary-700` (azul/brand)
- **Grays**: `gray-50` (fondo), `gray-100`, `gray-200` (bordes), `gray-500`, `gray-600`, `gray-900` (texto)
- **Estados**:
  - Alta: `red-500`, `red-100`, `red-700`
  - Buena: `orange-500`, `orange-100`, `orange-700`
  - Media: `yellow-500`, `yellow-100`, `yellow-700`
  - Baja: `blue-500`, `blue-100`, `blue-700`

### Componentes Base

#### Cards
```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6">
  {/* contenido */}
</div>
```

#### Badges
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-{color}-100 text-{color}-700">
  {text}
</span>
```

#### Botones
```tsx
// Primario
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">

// Secundario
<button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
```

#### Links de Navegación
```tsx
<Link
  to={href}
  className={clsx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  )}
>
```

### Estructura de Página

```tsx
export default function NombrePagina() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Título</h1>
          <p className="text-gray-500">Descripción opcional</p>
        </div>
        {/* Acciones opcionales */}
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards o contenido */}
      </div>
    </div>
  )
}
```

### Estructura de Componente

```tsx
import clsx from 'clsx'

interface ComponentNameProps {
  // props tipadas
  children?: React.ReactNode
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // JSX
  )
}
```

## Iconos Disponibles (Lucide)

Importar desde `lucide-react`:
- Navegación: `LayoutDashboard`, `Users`, `Search`, `Building2`
- Acciones: `Plus`, `Edit`, `Trash2`, `Download`, `Upload`
- Estado: `Check`, `X`, `AlertCircle`, `Info`
- Flechas: `ChevronRight`, `ChevronDown`, `ArrowLeft`

```tsx
import { IconName } from 'lucide-react'
<IconName className="w-5 h-5" />
```

## Data Fetching con React Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['leads'],
  queryFn: () => fetch('/api/leads').then(res => res.json())
})

// Mutation
const mutation = useMutation({
  mutationFn: (newLead) => fetch('/api/leads', {
    method: 'POST',
    body: JSON.stringify(newLead)
  }),
  onSuccess: () => queryClient.invalidateQueries(['leads'])
})
```

## Responsividad

Usar breakpoints de Tailwind:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Checklist al Crear Componentes

1. [ ] TypeScript interfaces para props
2. [ ] Usar `clsx` para clases condicionales
3. [ ] Seguir paleta de colores existente
4. [ ] Agregar `transition-colors` a elementos interactivos
5. [ ] Usar `space-y-*` o `gap-*` para espaciado consistente
6. [ ] Iconos de Lucide con `w-5 h-5` por defecto
