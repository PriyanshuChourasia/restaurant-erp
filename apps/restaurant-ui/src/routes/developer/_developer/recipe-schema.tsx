import { createFileRoute } from '@tanstack/react-router'
import { RecipeSchemaPage } from '@/modules/developer/pages/recipe-schema-page'

export const Route = createFileRoute('/developer/_developer/recipe-schema')({
  component: RecipeSchemaPage,
})
